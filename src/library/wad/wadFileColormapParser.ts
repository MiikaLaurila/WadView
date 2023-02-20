import { WadColorMap } from '../../interfaces/wad/WadColorMap';
import { WadDirectoryEntry } from '../../interfaces/wad/WadDirectory';
import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';

interface WadColormapParserOptions extends WadParserOptions {
    lump: WadDirectoryEntry;
}

export class WadFileColormapParser extends WadFileParser {
    private lump: WadDirectoryEntry;
    constructor(opts: WadColormapParserOptions) {
        super(opts);
        this.lump = opts.lump;
    }

    public parseColormap = (): WadColorMap => {
        const colorMap = [];
        const view = new Uint8Array(
            this.file.slice(this.lump.lumpLocation, this.lump.lumpLocation + this.lump.lumpSize),
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
    }
}