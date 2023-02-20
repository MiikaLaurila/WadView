import { WadDirectoryEntry } from '../../interfaces/wad/WadDirectory';
import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';
import { defaultPlaypal, WadPlaypal, WadPlaypalTypedEntry } from '../../interfaces/wad/WadPlayPal';

interface WadPlaypalParserOptions extends WadParserOptions {
    lump: WadDirectoryEntry;
}

export class WadFilePlaypalParser extends WadFileParser {
    private lump: WadDirectoryEntry;
    constructor(opts: WadPlaypalParserOptions) {
        super(opts);
        this.lump = opts.lump;
    }

    public parsePlaypal = (): WadPlaypal => {
        const playpal: WadPlaypal = JSON.parse(JSON.stringify(defaultPlaypal));
        const view = new Uint8Array(
            this.file.slice(this.lump.lumpLocation, this.lump.lumpLocation + this.lump.lumpSize),
        );
        const paletteSize = 768;
        const paletteCount = 14;
        const rgbToHex = (r: number, g: number, b: number): string => {
            // eslint-disable-next-line no-mixed-operators
            return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
        };
        for (let i = 0; i < paletteCount; i++) {
            const rawPaletteArr: number[] = [];
            const typedPaletteArr: WadPlaypalTypedEntry = [];
            for (let j = 0; j < paletteSize; j += 3) {
                const offset = i * paletteSize + j;
                const colorBytes = new Uint8Array(view.buffer.slice(offset, offset + 3));
                rawPaletteArr.push(...Array.from(colorBytes));
                typedPaletteArr.push({
                    r: colorBytes[0],
                    g: colorBytes[1],
                    b: colorBytes[2],
                    hex: rgbToHex(colorBytes[0], colorBytes[1], colorBytes[2]),
                });
            }
            playpal.rawPlaypal.push(rawPaletteArr);
            playpal.typedPlaypal.push(typedPaletteArr);
        }
        return playpal;
    }
}