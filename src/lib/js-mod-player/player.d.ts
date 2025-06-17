import type { Mod } from "./mod";

export declare class ModPlayer {
	playing: boolean;
	mod: Mod;
	constructor(audioContext?: AudioContext);

	load(
		url: string,
		volume?: number,
		sendCustomEventUpdates?: boolean,
	): Promise<void>;
	loadBuffer(
		buffer: ArrayBufferLike,
		volume?: number,
		enableSubscriptionsByDefault?: boolean,
	): Promise<void>;
	onmessage(event: MessageEvent): void;
	watchRows(callback: (position: number, rowIndex: number) => void): void;
	watch(
		position: number,
		row: number,
		callback: (position: number, rowIndex: number) => void,
	): void;
	watchStop(callback: () => void): void;
	unload(): void;
	play(): void;
	stop(): void;
	resume(): void;
	setRow(position: number, row: number): void;
	setVolume(volume: number): void;
}
