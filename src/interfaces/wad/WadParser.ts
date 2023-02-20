import { WadFileEvent } from './WadFileEvent';

type EventFunc = (type: WadFileEvent, msg?: string) => Promise<void>;

export interface WadParserOptions {
    file: ArrayBuffer;
    sendEvent: EventFunc;
}

export abstract class WadFileParser {
    protected sendEvent: EventFunc;
    protected file: ArrayBuffer;
    constructor(opts: WadParserOptions) {
        this.file = opts.file;
        this.sendEvent = opts.sendEvent;
    }
}