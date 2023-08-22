import { WadFileEvent } from '../../interfaces/wad/WadFileEvent';
import { WadType, WadHeader } from '../../interfaces/wad/WadHeader';
import { WadParserOptions, WadFileParser } from '../../interfaces/wad/WadParser';
import { utf8ArrayToStr } from '../utilities/stringUtils';

export class WadFileHeaderParser extends WadFileParser {
    constructor(opts: WadParserOptions) {
        super(opts);
    }

    public parseHeader = () => {
        const view = new Uint8Array(this.file, 0, 12);
        const type: WadType = utf8ArrayToStr(view.subarray(0, 4)) as WadType;
        if (type !== WadType.IWAD && type !== WadType.PWAD) {
            void this.sendEvent(WadFileEvent.NOT_WAD, `This is not a wad file! ${type}`);
            return null;
        }
        const directoryEntryCount: number = new Int32Array(view.buffer.slice(4, 8))[0];
        const directoryLocation: number = new Int32Array(view.buffer.slice(8, 12))[0];
        const header: WadHeader = {
            type,
            directoryEntryCount,
            directoryLocation,
        };
        return header;
    };
}
