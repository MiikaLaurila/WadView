import { WadMapThingGroup, WadThing } from '../../interfaces/wad/map/WadMapThing';
import { defaultWadDehacked, WadDehacked, WadDehackedThing, WadDehackedToThingType } from '../../interfaces/wad/WadDehacked';
import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';
import { dehackedLumpName } from '../constants';

export class WadFileDehackedParser extends WadFileParser {
    constructor(opts: WadParserOptions) {
        super(opts);
    }

    public parseDehacked = (): WadDehacked | null => {
        if (this.lumps.length === 0 || this.lumps[0].lumpName !== dehackedLumpName) return null;

        const dehackedCharSize = 1;
        const charCount = this.lumps[0].lumpSize / dehackedCharSize;
        const view = new Uint8Array(
            this.file.slice(
                this.lumps[0].lumpLocation,
                this.lumps[0].lumpLocation + this.lumps[0].lumpSize
            ),
        );

        const dehacked: WadDehacked = JSON.parse(JSON.stringify(defaultWadDehacked));

        for (let i = 0; i < charCount; i++) {
            const viewStart = i * dehackedCharSize;
            dehacked.dehackedString += String.fromCharCode(view[viewStart]);
        }

        let lineBuffer: string[] = [];

        dehacked.dehackedString.split('\n').forEach((line) => {
            line = line.trim();
            if (line.toLowerCase().includes('thing ')) {
                lineBuffer.push(line);
            }
            else if (lineBuffer.length > 0 && line !== '') {
                lineBuffer.push(line);
            }
            else if (lineBuffer.length > 0 && line === '') {
                const dehackedThing = this.parseThingLine(lineBuffer);
                if (dehackedThing) dehacked.things.push(dehackedThing);
                lineBuffer = [];
            }
        });
        return dehacked;
    }

    private parseThingLine = (thingBlock: string[]): WadDehackedThing | null => {
        let dehackedThingType: WadThing | null = null;
        let dehackedThingName: string | null = null;
        let dehackedThingGroup: WadMapThingGroup | null = null;
        thingBlock.forEach((line, idx) => {
            if (idx === 0) {
                const parts = line.split(' ');
                if (parts[1]) dehackedThingType = WadDehackedToThingType[Number(parts[1])];
                if (parts.length > 2) {
                    parts.shift();
                    parts.shift();
                    dehackedThingName = parts.join(' ').replace('(', '').replace(')', '');
                }
            }
        });

        const bits = thingBlock.find((line) => line.toLowerCase().includes('bits = '));
        if (bits && bits.toLowerCase().includes('countkill')) {
            dehackedThingGroup = WadMapThingGroup.MONSTER;
        }
        else {
            dehackedThingGroup = WadMapThingGroup.UNKNOWN;
        }

        if (dehackedThingType && dehackedThingName && dehackedThingGroup) {
            return { from: dehackedThingType, to: { name: dehackedThingName, type: dehackedThingGroup } }
        }
        return null;
    }
}