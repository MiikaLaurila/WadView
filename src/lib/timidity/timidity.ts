import LibTimidity from "./libtimidity";

const SAMPLE_RATE = 44100;
const AUDIO_FORMAT = 0x8010; // format of the rendered audio 's16'
const NUM_CHANNELS = 2; // stereo (2 channels)
const BYTES_PER_SAMPLE = 2 * NUM_CHANNELS;
const BUFFER_SIZE = 8192; // buffer size for each render() call

export class Timidity {
	private _audioContext: AudioContext;
	private _ready: boolean;
	private _playing = false;
	private _paused = false;
	private _songPtr: number;
	private _bufferPtr: number;
	private _array: Int16Array;
	private _interval: number | undefined;
	private _baseUrl: string;
	private _rootUrl: string;
	private _pendingFetches: Record<
		string,
		Promise<Uint8Array<ArrayBuffer>> | undefined
	>;
	private _currentUrlOrBuf: string | Uint8Array | null;
	private _libHolder: LibTimidity.Module | undefined;
	private _audioWorklet: AudioWorkletNode | undefined;
	private _audioWorkletMessagePort: MessagePort | undefined;
	private _volume = 0.5;

	public destroyed = false;

	constructor(onReady: () => void, baseUrl = "/") {
		this.destroyed = false;

		let baseUrlParsed = baseUrl;
		if (!baseUrlParsed.endsWith("/")) baseUrlParsed += "/";
		this._baseUrl = new URL(baseUrlParsed, window.location.origin).href;
		this._rootUrl = new URL("/", window.location.origin).href;

		this._ready = false;
		this._playing = false;
		this._pendingFetches = {};
		this._songPtr = 0;
		this._bufferPtr = 0;
		this._array = new Int16Array(BUFFER_SIZE * 2);
		this._currentUrlOrBuf = null;
		this._interval = undefined;

		this._startInterval = this._startInterval.bind(this);
		this._stopInterval = this._stopInterval.bind(this);

		this._audioContext = new AudioContext({
			sampleRate: SAMPLE_RATE,
		});

		LibTimidity({
			locateFile: (file: string) => new URL(file, this._rootUrl).href,
		}).then((lib) => {
			this._lib = lib;
			this._onLibReady(onReady);
		});
	}

	private async initAudioWorklet() {
		if (this._audioWorklet) return;
		await this._audioContext.audioWorklet.addModule("./midiAudioProcessor.js");

		this._audioWorklet = new AudioWorkletNode(
			this._audioContext,
			"midi-audio-processor",
			{ numberOfOutputs: 1, outputChannelCount: [2] },
		);

		this._audioWorkletMessagePort = this._audioWorklet.port;
		this._audioWorkletMessagePort.onmessage = this.messageFromWorker.bind(this);
		this._audioWorkletMessagePort.postMessage({
			command: "set-volume",
			data: { volume: 0.5 },
		});

		this._audioWorklet.connect(this._audioContext.destination);
	}

	get _lib(): LibTimidity.Module {
		if (!this._libHolder) throw new Error("Timidity lib not loaded yet");
		return this._libHolder;
	}

	set _lib(lib: LibTimidity.Module) {
		this._libHolder = lib;
	}

	get volume(): number {
		return this._volume;
	}

	get paused(): boolean {
		return this._paused;
	}

	get playing(): boolean {
		return this._playing;
	}

	set volume(volume: number) {
		this._volume = volume;
		if (this._audioWorkletMessagePort) {
			this._audioWorkletMessagePort.postMessage({
				command: "set-volume",
				data: { volume },
			});
		}
	}

	private messageFromWorker(evt: MessageEvent) {
		const { command, data } = { ...evt.data };

		switch (command) {
			case "process":
				this._onAudioProcess();
				break;
			case "end-song":
				this.endSong();
				break;
		}
	}

	private async _onLibReady(onReady: () => void) {
		const createCfgPromise = (cfgName: string) => {
			return this._fetch(new URL(cfgName, this._baseUrl)).then((cfg) => {
				this._lib.FS.writeFile(`/${cfgName}`, cfg);
			});
		};

		const cfgPromises: Array<Promise<void>> = [];
		cfgPromises.push(createCfgPromise("timidity.cfg"));
		cfgPromises.push(createCfgPromise("gravis.cfg"));
		cfgPromises.push(createCfgPromise("gsdrums.cfg"));
		cfgPromises.push(createCfgPromise("gssfx.cfg"));
		cfgPromises.push(createCfgPromise("xgmap2.cfg"));
		cfgPromises.push(createCfgPromise("proteus2.cfg"));
		cfgPromises.push(createCfgPromise("mt-32.cfg"));
		cfgPromises.push(createCfgPromise("sustain.cfg"));

		await Promise.all(cfgPromises);

		const result = this._lib._mid_init("/timidity.cfg");
		if (result !== 0) {
			return this._destroy(new Error("Failed to initialize libtimidity"));
		}

		this._bufferPtr = this._lib._malloc(BUFFER_SIZE * BYTES_PER_SAMPLE);

		this._ready = true;
		onReady();
	}

	async load(urlOrBuf: string | Uint8Array) {
		if (this.destroyed) throw new Error("load() called after destroy()");

		// If the Timidity constructor was not invoked inside a user-initiated event
		// handler, then the AudioContext will be suspended. Attempt to resume it.
		this._audioContext.resume();

		// If a song already exists, destroy it before starting a new one
		if (this._songPtr) this._destroySong();

		this._stopInterval();

		if (!this._ready) this._ready = true;

		// Save the url or buf to load. Allows detection of when a new interleaved
		// load() starts so we can abort this load.
		this._currentUrlOrBuf = urlOrBuf;

		let midiBuf: Uint8Array;
		if (typeof urlOrBuf === "string") {
			midiBuf = await this._fetch(new URL(urlOrBuf, this._baseUrl));
			// If another load() started while awaiting, abort this load
			if (this._currentUrlOrBuf !== urlOrBuf) return;
		} else if (urlOrBuf instanceof Uint8Array) {
			midiBuf = urlOrBuf;
		} else {
			throw new Error("load() expects a `string` or `Uint8Array` argument");
		}

		let songPtr = this._loadSong(midiBuf);

		// Are we missing instrument files?
		let missingCount = this._lib._mid_get_load_request_count(songPtr);
		if (missingCount > 0) {
			let missingInstruments = this._getMissingInstruments(
				songPtr,
				missingCount,
			);

			// Wait for all instruments to load
			await Promise.all(
				missingInstruments.map((instrument) =>
					this._fetchInstrument(instrument),
				),
			);

			// If another load() started while awaiting, abort this load
			if (this._currentUrlOrBuf !== urlOrBuf) return;

			// Retry the song load, now that instruments have been loaded
			this._lib._mid_song_free(songPtr);
			songPtr = this._loadSong(midiBuf);

			// Are we STILL missing instrument files? Then our General MIDI soundset
			// is probably missing instrument files.
			missingCount = this._lib._mid_get_load_request_count(songPtr);

			// Print out missing instrument names
			if (missingCount > 0) {
				missingInstruments = this._getMissingInstruments(songPtr, missingCount);
			}
		}

		this._songPtr = songPtr;
		this._lib._mid_song_start(this._songPtr);
	}

	private _getMissingInstruments(
		songPtr: number,
		missingCount: number,
	): string[] {
		const missingInstruments = [];
		for (let i = 0; i < missingCount; i++) {
			const instrumentPtr = this._lib._mid_get_load_request(songPtr, i);
			const instrument = this._lib.UTF8ToString(instrumentPtr);
			if (instrument.endsWith(".pat")) {
				missingInstruments.push(instrument);
			} else {
				missingInstruments.push(`${instrument}.pat`);
			}
		}
		return missingInstruments;
	}

	private _loadSong(midiBuf: Uint8Array): number {
		const optsPtr = this._lib._mid_alloc_options(
			SAMPLE_RATE,
			AUDIO_FORMAT,
			NUM_CHANNELS,
			BUFFER_SIZE,
		);

		// Copy the MIDI buffer into the heap
		const midiBufPtr = this._lib._malloc(midiBuf.byteLength);
		this._lib.HEAPU8.set(midiBuf, midiBufPtr);

		// Create a stream
		const iStreamPtr = this._lib._mid_istream_open_mem(
			midiBufPtr,
			midiBuf.byteLength,
		);

		// Load the song
		const songPtr = this._lib._mid_song_load(iStreamPtr, optsPtr);

		// Free resources no longer needed
		this._lib._mid_istream_close(iStreamPtr);
		this._lib._free(optsPtr);
		this._lib._free(midiBufPtr);

		if (songPtr === 0) {
			this._destroy(new Error("Failed to load MIDI file"));
			return 0;
		}

		return songPtr;
	}

	private async _fetchInstrument(instrument: string) {
		if (this._pendingFetches[instrument]) {
			// If this instrument is already in the process of being fetched, return
			// the existing promise to prevent duplicate fetches.
			return this._pendingFetches[instrument];
		}

		const url = new URL(instrument, this._baseUrl);
		const bufPromise = this._fetch(url);
		this._pendingFetches[instrument] = bufPromise;

		const buf = await bufPromise;
		this._writeInstrumentFile(instrument, buf);

		delete this._pendingFetches[instrument];

		return buf;
	}

	private _writeInstrumentFile(instrument: string, buf: Uint8Array) {
		const folderPath = instrument
			.split("/")
			.slice(0, -1) // remove basename
			.join("/");
		this._mkdirp(folderPath);
		this._lib.FS.writeFile(instrument, buf, { encoding: "binary" });
	}

	private _mkdirp(folderPath: string) {
		const pathParts = folderPath.split("/");
		let dirPath = "/";
		for (let i = 0; i < pathParts.length; i++) {
			const curPart = pathParts[i];
			try {
				this._lib.FS.mkdir(`${dirPath}${curPart}`);
			} catch (err) {}
			dirPath += `${curPart}/`;
		}
	}

	async _fetch(url: URL) {
		const opts: RequestInit = {
			mode: "cors",
			credentials: "same-origin",
		};
		const response = await window.fetch(url, opts);
		if (response.status !== 200) throw new Error(`Could not load ${url}`);

		const arrayBuffer = await response.arrayBuffer();
		const buf = new Uint8Array(arrayBuffer);
		return buf;
	}

	async play() {
		if (this.destroyed) throw new Error("play() called after destroy()");

		if (!this._audioWorklet) {
			await this.initAudioWorklet();
		}

		if (this._audioWorkletMessagePort) {
			this._audioWorkletMessagePort.postMessage({
				command: "set-volume",
				data: { volume: this.volume },
			});
		}
		// If the Timidity constructor was not invoked inside a user-initiated event
		// handler, then the AudioContext will be suspended. Attempt to resume it.
		await this._audioContext.resume();

		this._playing = true;
		this._paused = false;
		if (this._ready && !this._currentUrlOrBuf) {
			this._startInterval();
		}
	}

	private _onAudioProcess() {
		if (!this._playing) return;

		const sampleCount =
			this._songPtr && this._playing ? this._readMidiData() : 0;

		if (sampleCount > 0 && this._currentUrlOrBuf) {
			this._currentUrlOrBuf = null;
			this._startInterval();
		}

		const output0: Float32Array = new Float32Array(BUFFER_SIZE);
		const output1: Float32Array = new Float32Array(BUFFER_SIZE);

		for (let i = 0; i < sampleCount; i++) {
			output0[i] = this._array[i * 2] / 0x7fff;
			output1[i] = this._array[i * 2 + 1] / 0x7fff;
		}

		for (let i = sampleCount; i < BUFFER_SIZE; i++) {
			output0[i] = 0;
			output1[i] = 0;
		}

		if (this._audioWorkletMessagePort) {
			this._audioWorkletMessagePort.postMessage({
				command: "processed-data",
				data: {
					buffers: [output0, output1],
					isFinal: this._playing && sampleCount === 0,
				},
			});
		}
	}

	private _readMidiData() {
		const byteCount = this._lib._mid_song_read_wave(
			this._songPtr,
			this._bufferPtr,
			BUFFER_SIZE * BYTES_PER_SAMPLE,
		);
		const sampleCount = byteCount / BYTES_PER_SAMPLE;

		if (sampleCount === 0) {
			return 0;
		}

		this._array.set(
			this._lib.HEAP16.subarray(
				this._bufferPtr / 2,
				(this._bufferPtr + byteCount) / 2,
			),
		);

		return sampleCount;
	}

	endSong() {
		if (this._songPtr) {
			this.seek(0);
			this.pause();
			this._lib._mid_song_start(this._songPtr);
			document.dispatchEvent(new CustomEvent("ended"));
		}
	}

	async pause() {
		if (this.destroyed) throw new Error("pause() called after destroy()");

		this._playing = false;
		this._paused = true;
		this._stopInterval();
		await this._audioContext.suspend();
	}

	seek(time: number) {
		if (this.destroyed) throw new Error("seek() called after destroy()");
		if (!this._songPtr) return; // ignore seek if there is no song loaded yet

		const timeMs = Math.floor(time * 1000);
		this._lib._mid_song_seek(this._songPtr, timeMs);
		this._onTimeupdate();
	}

	get currentTime() {
		if (this.destroyed || !this._songPtr) return 0;
		return this._lib._mid_song_get_time(this._songPtr) / 1000;
	}

	get duration() {
		if (this.destroyed || !this._songPtr) return 1;
		return this._lib._mid_song_get_total_time(this._songPtr) / 1000;
	}

	private _onTimeupdate() {
		document.dispatchEvent(
			new CustomEvent("timeupdate", {
				detail: {
					currentTime: this.currentTime,
					maxTime: this.duration,
				},
			}),
		);
	}

	private _startInterval() {
		this._onTimeupdate();
		this._interval = window.setInterval(() => this._onTimeupdate(), 1000);
	}

	private _stopInterval() {
		this._onTimeupdate();
		window.clearInterval(this._interval);
		this._interval = undefined;
	}

	destroy() {
		if (this.destroyed) throw new Error("destroy() called after destroy()");
		this._destroy();
	}

	private _destroy(err?: string | Error) {
		if (this.destroyed) return;
		this.destroyed = true;

		this._stopInterval();

		this._array = new Int16Array();

		if (this._songPtr) {
			this._destroySong();
		}

		if (this._bufferPtr) {
			this._lib._free(this._bufferPtr);
			this._bufferPtr = 0;
		}

		if (this._audioWorklet) {
			this._audioWorklet.port.close();
			this._audioWorklet.disconnect();
		}

		if (this._audioContext) {
			this._audioContext.close();
		}

		if (err) console.log("error", err);
	}

	private _destroySong() {
		this._lib._mid_song_free(this._songPtr);
		this._songPtr = 0;
	}
}
