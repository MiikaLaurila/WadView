declare module "spessasynth_core" {
	interface TempoChange {
		tempo: number;
		ticks: number;
	}

	interface Loop {
		start: number;
		end: number;
	}

	interface KeyRange {
		min: number;
		max: number;
	}

	interface NoteData {
		midiNote: number;
		velocity: number;
		start: number;
		length: number;
	}

	interface MIDIMessage {
		ticks: number;
		messageStatusByte: number;
		messageData: Uint8Array;
	}

	interface MIDI {
		tracksAmount: number;
		trackNames: string[];
		timeDivision: number;
		midiName: string;
		fileName?: string;
		midiNameUsesFileName: boolean;
		rawMidiName: Uint8Array;
		copyright: string;
		tempoChanges: TempoChange[];
		loop: Loop;
		format: number;
		firstNoteOn: number;
		lastVoiceEventTick: number;
		duration: number;
		midiPorts: number[];
		midiPortChannelOffsets: number[];
		usedChannelsOnTrack: Set<number>[];
		keyRange: KeyRange;
		lyrics: Uint8Array[];
		embeddedSoundFont?: ArrayBuffer;
		bankOffset: number;
		RMIDInfo: object;
		tracks: MIDIMessage[][];

		flush(): void;
		MIDIticksToSeconds(ticks: number): number;
		writeMIDI(): Uint8Array;
		writeRMIDI(
			soundfontBinary: ArrayBuffer,
			soundfont: any,
			bankOffset?: number,
			encoding?: string,
			metadata?: object,
			correctBankOffset?: boolean,
		): Uint8Array;
		modifyMIDI(): void;
		applySnapshotToMIDI(): void;
		getUsedProgramsAndKeys(soundfont: any): Record<string, Set<string>>;
		getNoteTimes(minDrumLength?: number): NoteData[][];
	}
}
