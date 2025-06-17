declare function LibTimidity(overrides?: {
	locateFile?: (file: string) => string;
}): Promise<LibTimidity.Module>;

declare namespace LibTimidity {
	interface Module {

		HEAP16: Int16Array;
		HEAPU8: Uint8Array;
		_malloc: (size: number) => number;
		_free: (pointer: number) => void;

		FS: FS;
		UTF8ToString: (ptr: number) => string;

		_mid_song_start: (songPointer: number) => void;
		_mid_song_seek: (songPointer: number, ms: number) => void;
		_mid_song_get_total_time: (songPointer: number) => number;
		_mid_song_get_time: (songPointer: number) => number;
		_mid_song_read_wave: (
			songPointer: number,
			bufferPointer: number,
			len: number,
		) => number;
		_mid_istream_open_mem: (data: number, size: number) => number;
		_mid_istream_close: (stream: number) => void;
		_mid_exit: () => void;
		_mid_init: (configPath: string) => number;
		_mid_song_load: (streamPointer: number, optionsPointer: number) => number;
		_mid_song_free: (songPointer: number) => void;
		_mid_alloc_options: (
			sampleRate: number,
			audioFormat: number,
			channels: number,
			size: number,
		) => number;
		_mid_get_load_request_count: (songPointer: number) => number;
		_mid_get_load_request: (songPointer: number, index: number) => number;
	}

	interface FS {
		mkdir: (path: string, mode?: number) => void;
		readFile: (
			path: string,
			opts?: { encoding: "binary" | "utf8" },
		) => Uint8Array | string;
		writeFile: (
			path: string,
			data: string | Uint8Array,
			opts?: { encoding: "binary" | "utf8" },
		) => void;
	}
}

export = LibTimidity;
export as namespace LibTimidity;
