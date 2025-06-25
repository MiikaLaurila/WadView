/// <reference path="./spessasynth_core.d.ts" />

import { MIDI } from "spessasynth_core";

declare module "spessasynth_lib" {
	interface SequencerOptions {
		skipToFirstNoteOn?: boolean;
		autoPlay?: boolean;
		preservePlaybackState?: boolean;
		initialPlaybackRate?: number;
	}

	type MidiBuffer =
		| {
				binary: ArrayBuffer;
				altName?: string;
		  }
		| MIDI;

	type MidiMessageData = [any, number];

	type OnTextEventCallback = (
		messageData: Uint8Array,
		messageType: number,
		lyricsIndex: number,
	) => void;
	type OnErrorCallback = (error: string) => void;
	type SongChangeEventCallback = (midiData: MIDI) => void;
	type TimeChangeEventCallback = (newTime: number) => void;
	type MetaEventCallback = (data: MidiMessageData) => void;
	type TempoChangeEventCallback = (newTempo: number) => void;
	type SongEndedEventCallback = () => void;

	class Sequencer {
		constructor(
			midiBuffers: MidiBuffer[],
			synth: Synthetizer,
			options?: SequencerOptions,
		);

		loadNewSongList(midiBuffers: MidiBuffer[], autoPlay?: boolean): void;
		play(resetTime?: boolean): void;
		pause(): void;
		stop(): void;
		nextSong(): void;
		previousSong(): void;
		setSongIndex(index: number): void;
		connectMidiOutput(output?: MIDIOutput): void;

		addOnSongChangeEvent(callback: SongChangeEventCallback, id: string): void;
		addOnTimeChangeEvent(callback: TimeChangeEventCallback, id: string): void;
		addOnMetaMessageEvent(callback: MetaEventCallback, id: string): void;
		addOnMetaEvent(callback: MetaEventCallback, id: string): void;
		addOnTempoChangeEvent(callback: TempoChangeEventCallback, id: string): void;
		addOnSongEndedEvent(callback: SongEndedEventCallback, id: string): void;

		readonly paused: boolean;
		playbackRate: number;
		loop: boolean;
		loopsRemaining: number;
		shuffleSongs: boolean;
		currentTime: number;
		readonly currentTempo: number;
		skipToFirstNoteOn: boolean;
		preservePlaybackState: boolean;

		readonly midiData: MIDI;
		readonly duration: number;
		readonly songListData: MIDI[];
		readonly songIndex: number;
		readonly songsAmount: number;

		onTextEvent?: OnTextEventCallback;
		onError?: OnErrorCallback;
	}

	interface ChorusConfig {
		nodesAmount: number;
		defaultDelay: number;
		delayVariation: number;
		stereoDifference: number;
		oscillatorFrequency: number;
		oscillatorFrequencyVariation: number;
		oscillatorGain: number;
	}

	interface SynthConfig {
		chorusEnabled: boolean;
		chorusConfig?: ChorusConfig;
		reverbEnabled: boolean;
		reverbImpulseResponse?: AudioBuffer;
		audioNodeCreators?: {
			worklet: (
				context: AudioContext,
				name: string,
				options?: any,
			) => AudioWorkletNode;
		};
	}

	interface StartRenderingData {
		parsedMIDI?: MidiBuffer;
		snapshot?: any;
		oneOutput?: boolean;
		loopCount?: number;
		sequencerOptions?: SequencerOptions;
	}

	interface EventOptions {
		time?: number;
	}

	interface ChannelProperty {
		voicesAmount: number;
		pitchBend: number;
		pitchBendRangeSemitones: number;
		isMuted: boolean;
		isDrum: boolean;
		transposition: number;
		bank: number;
		program: number;
	}

	interface MIDIMessage {
		message: number[];
		channelOffset?: number;
		eventOptions?: EventOptions;
	}

	interface EventHandler {
		addEvent(name: string, id: string, callback: (data: any) => void): void;
		removeEvent(name: string, id: string): void;
		timeDelay: number;
	}

	interface SoundFont {
		id: string;
		bankOffset: number;
	}

	interface SoundFontManager {
		soundfontList: SoundFont[];

		addNewSoundFont(
			soundfontBuffer: ArrayBuffer,
			id: string,
			bankOffset?: number,
		): Promise<void>;
		deleteSoundFont(id: string): void;
		rearrangeSoundFonts(newOrderedList: string[]): void;
		reloadManager(soundfontBuffer: ArrayBuffer): Promise<void>;
	}

	interface Patch {
		program: number;
		bank: number;
	}

	interface KeyModifier {
		velocity?: number;
		patch?: Patch;
		gain?: number;
	}

	interface KeyModifierManager {
		addModifier(channel: number, midiNote: number, options: KeyModifier): void;
		deleteModifier(channel: number, midiNote: number): void;
		getModifier(channel: number, midiNote: number): KeyModifier | undefined;
		clearModifiers(): void;
	}

	class Synthetizer {
		constructor(
			targetNode: AudioNode,
			soundFontBuffer: ArrayBuffer,
			enableEventSystem?: boolean,
			startRenderingData?: StartRenderingData,
			synthConfig?: SynthConfig,
		);

		isReady: Promise<void>;

		destroy(): void;

		sendMessage(
			messageData: number[],
			channelOffset?: number,
			eventOptions?: EventOptions,
		): void;
		noteOn(
			channel: number,
			midiNote: number,
			velocity: number,
			eventOptions?: EventOptions,
		): void;
		noteOff(
			channel: number,
			midiNote: number,
			eventOptions?: EventOptions,
		): void;
		programChange(
			channel: number,
			programNumber: number,
			eventOptions?: EventOptions,
		): void;
		pitchWheel(
			channel: number,
			MSB: number,
			LSB: number,
			eventOptions?: EventOptions,
		): void;
		setPitchBendRange(channel: number, pitchBendRangeSemitones: number): void;
		systemExclusive(
			messageData: Uint8Array,
			channelOffset?: number,
			eventOptions?: EventOptions,
		): void;
		tuneKeys(
			program: number,
			tunings: { sourceKey: number; targetPitch: number }[],
		): void;
		controllerChange(
			channel: number,
			controllerNumber: number,
			controllerValue: number,
			eventOptions?: EventOptions,
		): void;
		resetControllers(): void;
		lockController(
			channel: number,
			controllerNumber: number,
			isLocked: boolean,
		): void;
		channelPressure(
			channel: number,
			pressure: number,
			eventOptions?: EventOptions,
		): void;
		polyPressure(
			channel: number,
			midiNote: number,
			pressure: number,
			eventOptions?: EventOptions,
		): void;
		muteChannel(channel: number, isMuted: boolean): void;
		velocityOverride(channel: number, velocity: number): void;
		stopAll(): void;
		transpose(semitones: number): void;
		setMainVolume(volume: number): void;
		setInterpolationType(type: number): void;
		addNewChannel(): void;
		reloadSoundFont(soundFontBuffer: ArrayBuffer): Promise<void>;
		setReverbResponse(buffer: AudioBuffer): void;
		setChorusConfig(config: ChorusConfig): void;
		setEffectsGain(reverbGain: number, chorusGain: number): void;
		getSynthesizerSnapshot(): Promise<any>;
		disableGSNRPparams(): void;
		connectIndividualOutputs(audioNodes: AudioNode[]): void;
		disconnectIndividualOutputs(audioNodes: AudioNode[]): void;
		debugMessage(): void;

		eventHandler: EventHandler;
		soundfontManager: SoundFontManager;
		keyModifierManager: KeyModifierManager;
		presetList: { bank: number; program: number; presetName: string }[];
		voicesAmount: number;
		voiceCap: number;
		currentTime: number;
		system: string;
		highPerformanceMode: boolean;
		channelProperties: ChannelProperty[];

		static channelsAmount: number;
	}
}
