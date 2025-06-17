declare class Instrument {
    name: string;
    length: number;
    finetune: number;
    volume: number;
    repeatOffset: number;
    bytes: Int8Array;
    isLooped: boolean;
	constructor(modfile: ArrayBuffer, index: number, sampleStart: number);
}

declare class Note {
	instrument: number;
	period: number;
	effect: number;
	constructor(nodeData: Uint8Array);
}

declare class Row {
	notes: Note[];
	constructor(rowData: Uint8Array);
}

declare class Pattern {
	rows: Row[];
	constructor(modfile: ArrayBuffer, index: number);
}

export declare class Mod {
	name: string;
	length: number;
	patternTable: Uint8Array;
	instrument: Instrument[];
	patterns: Pattern[];
	constructor(modfile: ArrayBuffer);
}
