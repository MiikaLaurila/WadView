import {
    MapGroupDirectory,
    WadMapGroupList,
    isMapGroupDirectoryEntry
} from '../../interfaces/wad/map/WadMap';
import { WadDirectory } from '../../interfaces/wad/WadDirectory';
import { WadFileParser, WadParserOptions } from '../../interfaces/wad/WadParser';

interface WadMapGroupParserOptions extends WadParserOptions {
    directory: WadDirectory;
}

export class WadFileMapGroupParser extends WadFileParser {
    private directory: WadDirectory;
    constructor(opts: WadMapGroupParserOptions) {
        super(opts);
        this.directory = opts.directory;
    }

    public parseMapGroups = () => {
        let foundLumps: MapGroupDirectory = [];
        let currentMapName: string | null = null;
        let mapGroups: WadMapGroupList = [];

        this.directory.forEach((entry, idx, arr) => {
            const isValid = isMapGroupDirectoryEntry(entry);
            if (isValid && !currentMapName) {
                currentMapName = arr[idx - 1].lumpName;
                foundLumps.push(entry);
            } else if ((isValid && idx !== arr.length - 1) && currentMapName) {
                foundLumps.push(entry);
            } else if ((!isValid || idx === arr.length - 1) && currentMapName) {
                mapGroups.push({ name: currentMapName, lumps: foundLumps });
                currentMapName = null;
                foundLumps = [];
            }
        });
        mapGroups = mapGroups.sort((a, b) => a.name.localeCompare(b.name));
        return mapGroups;
    }
}