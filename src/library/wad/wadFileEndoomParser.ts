import { ANSIColors, WadEndoom } from '../../interfaces/wad/WadEndoom';
import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';
import { endoomLumpName } from '../constants';
import { cp347toUtf8 } from '../utilities/stringUtils';

export class WadFileEndoomParser extends WadFileParser {
    constructor(opts: WadParserOptions) {
        super(opts);
    }

    public parseEndoom = (): WadEndoom => {
        if (this.lumps.length === 0 || this.lumps[0].lumpName !== endoomLumpName) return [];

        const endoomCharSize = 2;
        const charCount = this.lumps[0].lumpSize / endoomCharSize;
        const view = new Uint8Array(
            this.file.slice(
                this.lumps[0].lumpLocation,
                this.lumps[0].lumpLocation + this.lumps[0].lumpSize
            ),
        );

        const endoom: WadEndoom = [];

        for (let i = 0; i < charCount; i++) {
            const viewStart = i * endoomCharSize;
            const char = cp347toUtf8[Number(view[viewStart].toString())];
            const colorStrOg = view[viewStart + 1].toString(2);
            const colorStr = '00000000'.substring(0, 8 - colorStrOg.length) + colorStrOg;
            const foregroundColorRaw = parseInt(colorStr.slice(4, 8), 2);
            const backgroundColorRaw = parseInt(colorStr.slice(1, 4), 2);
            const foregroundColor = ANSIColors[foregroundColorRaw];
            const backgroundColor = ANSIColors[backgroundColorRaw];
            const blink = colorStr.startsWith('1');
            endoom.push({
                char,
                foregroundColor,
                backgroundColor,
                blink,
            });
        }

        return endoom;
    }
}