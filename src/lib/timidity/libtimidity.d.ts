declare function LibTimidity(overrides?: {
	locateFile?: (file: string) => string;
}): Promise<LibTimidity.Module>;

declare namespace LibTimidity {
	interface Module {
		// Core module properties
		ready: Promise<Module>;
		calledRun: boolean;
		preInit?: (() => void)[] | (() => void);
		onRuntimeInitialized?: () => void;

		// Memory management
		HEAP8: Int8Array;
		HEAP16: Int16Array;
		HEAP32: Int32Array;
		HEAPU8: Uint8Array;
		HEAPU16: Uint16Array;
		HEAPU32: Uint32Array;
		HEAPF32: Float32Array;
		HEAPF64: Float64Array;
		_malloc: (size: number) => number;
		_free: (pointer: number) => void;
		_emscripten_get_heap_size: () => number;
		_emscripten_resize_heap: (requestedSize: number) => number;
		_emscripten_memcpy_big: (dest: number, src: number, num: number) => void;

		// Filesystem operations
		FS: FS;
		FS_createPath: FS["createPath"];
		FS_createDataFile: FS["createDataFile"];
		FS_createPreloadedFile: FS["createPreloadedFile"];
		FS_createLazyFile: FS["createLazyFile"];
		FS_createDevice: FS["createDevice"];
		FS_unlink: FS["unlink"];

		// String utilities
		UTF8ToString: (ptr: number) => string;
		stringToUTF8: (
			str: string,
			outPtr: number,
			maxBytesToWrite: number,
		) => void;
		lengthBytesUTF8: (str: string) => number;
		intArrayFromString: (
			stringy: string,
			dontAddNull?: boolean,
			length?: number,
		) => Uint8Array;

		// Runtime management
		addRunDependency: (id: string) => void;
		removeRunDependency: (id: string) => void;
		run: () => void;
		setStatus: (text: string) => void;

		// Timidity audio processing
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

		// System-level operations
		___sys_fcntl64: (fd: number, cmd: number, varargs: number) => number;
		___sys_ioctl: (fd: number, op: number, varargs: number) => number;
		___sys_open: (path: number, flags: number, varargs: number) => number;
		___errno_location: () => number;
		_fd_close: (fd: number) => number;
		_fd_read: (fd: number, iov: number, iovcnt: number, pnum: number) => number;
		_fd_seek: (
			fd: number,
			offset_low: number,
			offset_high: number,
			whence: number,
			newOffset: number,
		) => number;
		_fd_write: (
			fd: number,
			iov: number,
			iovcnt: number,
			pnum: number,
		) => number;
	}

	interface FS {
		// Core FS properties
		root: FSNode;
		mounts: Mount[];
		devices: { [dev: number]: Device };
		streams: FSStream[];
		nameTable: FSNode[];
		currentPath: string;
		initialized: boolean;
		ignorePermissions: boolean;
		ErrnoError: new (errno: number, node?: FSNode) => Error;
		genericErrors: { [code: number]: Error };

		// Path operations
		lookupPath: (
			path: string,
			opts?: { parent?: boolean; follow?: boolean },
		) => LookupResult;
		getPath: (node: FSNode) => string;
		cwd: () => string;
		chdir: (path: string) => void;

		// File operations
		mkdir: (path: string, mode?: number) => void;
		mkdirTree: (path: string, mode?: number) => void;
		mkdev: (path: string, mode: number, dev: number) => void;
		symlink: (oldpath: string, newpath: string) => void;
		rename: (old_path: string, new_path: string) => void;
		rmdir: (path: string) => void;
		unlink: (path: string) => void;
		readlink: (path: string) => string;
		stat: (path: string, dontFollow?: boolean) => Stats;
		lstat: (path: string) => Stats;
		chmod: (path: string, mode: number, dontFollow?: boolean) => void;
		lchmod: (path: string, mode: number) => void;
		fchmod: (fd: number, mode: number) => void;
		chown: (
			path: string,
			uid: number,
			gid: number,
			dontFollow?: boolean,
		) => void;
		lchown: (path: string, uid: number, gid: number) => void;
		fchown: (fd: number, uid: number, gid: number) => void;
		truncate: (path: string, len: number) => void;
		ftruncate: (fd: number, len: number) => void;
		utime: (path: string, atime: number, mtime: number) => void;
		open: (
			path: string,
			flags: string | number,
			mode?: number,
			fd_start?: number,
			fd_end?: number,
		) => FSStream;
		close: (stream: FSStream) => void;
		read: (
			stream: FSStream,
			buffer: Uint8Array,
			offset: number,
			length: number,
			position?: number,
		) => number;
		write: (
			stream: FSStream,
			buffer: Uint8Array,
			offset: number,
			length: number,
			position?: number,
			canOwn?: boolean,
		) => number;
		llseek: (stream: FSStream, offset: number, whence: number) => number;
		allocate: (stream: FSStream, offset: number, length: number) => void;
		readFile: (
			path: string,
			opts?: { encoding: "binary" | "utf8" },
		) => Uint8Array | string;
		writeFile: (
			path: string,
			data: string | Uint8Array,
			opts?: { [key: string]: string },
		) => void;

		// File creation
		createPath: (
			parent: string,
			path: string,
			canRead?: boolean,
			canWrite?: boolean,
		) => string;
		createDataFile: (
			parent: string,
			name: string,
			data: string | Uint8Array,
			canRead?: boolean,
			canWrite?: boolean,
			canOwn?: boolean,
		) => FSNode;
		createPreloadedFile: (
			parent: string,
			name: string,
			url: string,
			canRead?: boolean,
			canWrite?: boolean,
			onload?: () => void,
			onerror?: () => void,
			dontCreateFile?: boolean,
			canOwn?: boolean,
			preFinish?: () => void,
		) => void;
		createLazyFile: (
			parent: string,
			name: string,
			url: string,
			canRead?: boolean,
			canWrite?: boolean,
		) => FSNode;
		createDevice: (
			parent: string,
			name: string,
			input?: () => number | null,
			output?: (data: number) => void,
		) => FSNode;

		// Filesystem management
		mount: (type: FilesystemType, opts: any, mountpoint: string) => FSNode;
		unmount: (mountpoint: string) => void;
		syncfs: (
			populate: boolean | (() => void),
			callback?: (err?: any) => void,
		) => void;

		// Internal types
		isDir: (mode: number) => boolean;
		isFile: (mode: number) => boolean;
		isLink: (mode: number) => boolean;
		isChrdev: (mode: number) => boolean;
		isBlkdev: (mode: number) => boolean;
		isFIFO: (mode: number) => boolean;
		isSocket: (mode: number) => boolean;
		modeStringToFlags: (str: string) => number;
		flagsToPermissionString: (flag: number) => string;
		nodePermissions: (node: FSNode, perms: string) => number;
		handleFSError: (e: Error) => number;
		calculateAt: (dirfd: number, path: string) => string;
	}

	interface FSNode {
		parent: FSNode;
		mount: Mount;
		mounted: Mount | null;
		id: number;
		name: string;
		mode: number;
		node_ops: NodeOps;
		stream_ops: StreamOps;
		rdev: number;
		contents: Uint8Array | null;
		usedBytes?: number;
		timestamp: number;
		link?: string;

		// Properties
		read: boolean;
		write: boolean;
		isFolder: boolean;
		isDevice: boolean;
	}

	interface FSStream {
		node: FSNode;
		path: string;
		flags: number;
		position: number;
		seekable: boolean;
		fd: number;
		error: boolean;
		ungotten: number[];
		getdents?: any;
		stream_ops: StreamOps;
	}

	interface Stats {
		dev: number;
		ino: number;
		mode: number;
		nlink: number;
		uid: number;
		gid: number;
		rdev: number;
		size: number;
		atime: Date;
		mtime: Date;
		ctime: Date;
		blksize: number;
		blocks: number;
	}

	interface Mount {
		type: FilesystemType;
		opts: any;
		mountpoint: string;
		mounts: Mount[];
		root: FSNode;
	}

	interface Device {
		stream_ops: StreamOps;
	}

	interface NodeOps {
		getattr?: (node: FSNode) => Stats;
		setattr?: (node: FSNode, attr: Partial<Stats>) => void;
		lookup?: (parent: FSNode, name: string) => FSNode;
		mknod?: (parent: FSNode, name: string, mode: number, dev: number) => FSNode;
		rename?: (old_node: FSNode, new_dir: FSNode, new_name: string) => void;
		unlink?: (parent: FSNode, name: string) => void;
		rmdir?: (parent: FSNode, name: string) => void;
		readdir?: (node: FSNode) => string[];
		symlink?: (parent: FSNode, newname: string, oldpath: string) => FSNode;
		readlink?: (node: FSNode) => string;
	}

	interface StreamOps {
		open?: (stream: FSStream) => void;
		close?: (stream: FSStream) => void;
		read?: (
			stream: FSStream,
			buffer: Uint8Array,
			offset: number,
			length: number,
			position: number,
		) => number;
		write?: (
			stream: FSStream,
			buffer: Uint8Array,
			offset: number,
			length: number,
			position: number,
			canOwn: boolean,
		) => number;
		llseek?: (stream: FSStream, offset: number, whence: number) => number;
		allocate?: (stream: FSStream, offset: number, length: number) => void;
		mmap?: (
			stream: FSStream,
			address: number,
			length: number,
			position: number,
			prot: number,
			flags: number,
		) => any;
		msync?: (
			stream: FSStream,
			buffer: Uint8Array,
			offset: number,
			length: number,
			mmapFlags: number,
		) => number;
		ioctl?: (stream: FSStream, cmd: number, arg: number) => number;
	}

	interface FilesystemType {
		mount: (mount: Mount) => FSNode;
		syncfs?: (
			mount: Mount,
			populate: boolean,
			callback: (err?: any) => void,
		) => void;
	}

	interface LookupResult {
		path: string;
		node: FSNode;
	}

	// Environment flags
	const ENVIRONMENT_IS_WEB: boolean;
	const ENVIRONMENT_IS_WORKER: boolean;
}

export = LibTimidity;
export as namespace LibTimidity;
