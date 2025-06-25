import { Sequencer, Synthetizer } from "spessasynth_lib";

let soundFontBuf: ArrayBuffer | null = null;
let soundFontFetchPromise: Promise<ArrayBuffer> | null = null;
let synthetizer: Synthetizer | null = null;
let sequencer: Sequencer | null = null;
let prevTime: number = 0;
let updateInterval: number | undefined;

const getSoundFontBuf = async () => {
	if (soundFontBuf) return soundFontBuf;
	if (soundFontFetchPromise) return soundFontFetchPromise;
	soundFontFetchPromise = fetch("./soundfont.sf2").then(async (response) => {
		const soundFontArrayBuffer = await response.arrayBuffer();
		soundFontBuf = soundFontArrayBuffer;
		soundFontFetchPromise = null;
		return soundFontArrayBuffer;
	});
	return soundFontFetchPromise;
};

export const spessaSynth = async () => {
	const soundFontArrayBuffer = await getSoundFontBuf();
	const context = new AudioContext({ sampleRate: 44100 });
	await context.audioWorklet.addModule("./worklet_processor.min.js");
	synthetizer = new Synthetizer(context.destination, soundFontArrayBuffer);
	sequencer = new Sequencer([], synthetizer);
	sequencer.loop = false;

	const startInterval = () => {
		updateInterval = window.setInterval(() => {
			if (sequencer) {
				const currentTime = Math.round(sequencer.currentTime);
				if (currentTime !== prevTime) {
					document.dispatchEvent(
						new CustomEvent("timeupdate", {
							detail: { currentTime, maxTime: sequencer.duration },
						}),
					);
					prevTime = currentTime;
				}
			}
		}, 500);
	};
	startInterval();

	sequencer.addOnSongEndedEvent(() => {
		document.dispatchEvent(new CustomEvent("ended"));
	}, "songended");
	return sequencer;
};

export const setSpessaSynthVolume = (volume: number) => {
	if (!synthetizer) return;
	synthetizer.setMainVolume(volume);
};

export const destroySpessaSynth = () => {
	if (updateInterval !== undefined) {
		clearInterval(updateInterval);
		updateInterval = undefined;
	}
	synthetizer?.destroy();
	synthetizer = null;
	sequencer = null;
};
