import { WadColorMap } from '../../interfaces/wad/WadColorMap';
import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';
import { colormapLumpName } from '../constants';

export class WadFileColormapParser extends WadFileParser {
    constructor(opts: WadParserOptions) {
        super(opts);
    }

    public parseColormap = (): WadColorMap => {
        if (this.lumps.length === 0 || this.lumps[0].lumpName !== colormapLumpName) return [];
        const colorMap = [];
        const view = new Uint8Array(
            this.file.slice(this.lumps[0].lumpLocation, this.lumps[0].lumpLocation + this.lumps[0].lumpSize),
        );
        const colorMapSize = 256;
        const colorMapCount = 34;
        for (let i = 0; i < colorMapCount; i++) {
            const colorMapArr: number[] = [];
            for (let j = 0; j < colorMapSize; j++) {
                const offset = i * colorMapSize + j;
                colorMapArr.push(new Uint8Array(view.buffer.slice(offset, offset + 1))[0]);
            }
            colorMap.push(colorMapArr);
        }
        return colorMap;
    };
}
