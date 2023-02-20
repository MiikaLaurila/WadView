import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';

export class WadFileEndoomParser extends WadFileParser {
    constructor(opts: WadParserOptions) {
        super(opts);
    }

    public parsEndoom = () => { }
}