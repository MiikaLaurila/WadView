import { WadDirectoryEntry } from './WadDirectory';
import { WadFileEvent } from './WadFileEvent';

type EventFunc = (type: WadFileEvent, msg?: string) => Promise<void>;

export interface WadParserOptions {
    file: ArrayBuffer;
    lumps?: WadDirectoryEntry[];
    sendEvent: EventFunc;
}

export abstract class WadFileParser {
    protected sendEvent: EventFunc;
    protected file: ArrayBuffer;
    protected lumps: WadDirectoryEntry[];
    constructor(opts: WadParserOptions) {
        this.file = opts.file;
        this.sendEvent = opts.sendEvent;
        this.lumps = opts.lumps ?? [];
    }
}
