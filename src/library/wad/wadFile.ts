import { defaultWad, Wad } from "../../interfaces/wad/Wad";
import { WadHeader, WadType } from "../../interfaces/wad/WadHeader";
import { defaultWadMap, isMapGroupDirectoryEntry, MapGroupDirectory, WadMapGroupList, WadMapList } from "../../interfaces/wad/map/WadMap";
import { WadDirectory } from "../../interfaces/WadDirectory";
import { utf8ArrayToStr } from "../utilities/stringUtils";
import { WadMapThing, WadThing, WadThingType } from "../../interfaces/wad/map/WadMapThing";

export class WadFile {
    private _fileUrl: string = '';
    private _wadLoaded: boolean = false;
    private _wadLoadAttempted: boolean = false;
    private _wadLoadError: string = '';
    private _wadFile: ArrayBuffer = new ArrayBuffer(0);
    private _wadStruct: Partial<Wad> = defaultWad;
    constructor(fileUrl?: string, readyCb?: (success: boolean, err?: any) => void) {
        if (fileUrl && readyCb) {
            this._fileUrl = fileUrl;
            this.loadFile(this._fileUrl, readyCb);
        }
    }

    get wadLoaded() {
        return this._wadLoaded;
    }

    private set wadLoaded(loaded: boolean) {
        this._wadLoaded = loaded;
    }

    get wadLoadAttempted() {
        return this._wadLoadAttempted;
    }

    private set wadLoadAttempted(attempted: boolean) {
        this._wadLoadAttempted = attempted;
    }

    get wadLoadError() {
        return this._wadLoadError;
    }

    private set wadLoadError(errMsg: string) {
        this._wadLoadError = errMsg;
    }

    private get wadFile() {
        return this._wadFile;
    }

    private set wadFile(file: ArrayBuffer) {
        this._wadFile = file;
    }

    get wadFileLength() {
        return this._wadFile.byteLength;
    }

    private get fileLoaded() {
        return this.wadLoadAttempted && this.wadLoaded && this.wadFile.byteLength > 0;
    }

    public loadFile(fileUrl: string, callback?: (success: boolean, err?: any) => void) {
        this.wadLoadAttempted = true;
        fetch(fileUrl)
            .then(async (res) => {
                try {
                    this.wadFile = await res.arrayBuffer();
                    this.wadLoaded = true;
                    if (callback !== undefined) callback(true);
                }
                catch (e) {
                    console.error(e);
                    this.wadLoadError = (e as Error).message;
                    if (callback !== undefined) callback(false, e);
                }
            }).catch((e) => {
                console.error(e);
                this.wadLoadError = (e as Error).message;
                if (callback !== undefined) callback(false, e);
            });
    }

    public get header(): WadHeader | null {
        if (!this.fileLoaded) return null;
        if (this._wadStruct.header) return this._wadStruct.header;
        const view = new Uint8Array(this.wadFile, 0, 12);
        const type: WadType = utf8ArrayToStr(view.subarray(0, 4)) as WadType;
        if (type !== WadType.IWAD && type !== WadType.PWAD) {
            console.error("Loaded file is not of type WAD");
            return null;
        }
        const directoryEntries: number = new Int32Array(view.buffer.slice(4, 8))[0];
        const directoryLocation: number = new Int32Array(view.buffer.slice(8, 12))[0];
        const header: WadHeader = {
            type,
            directoryEntryCount: directoryEntries,
            directoryLocation
        }
        this.setHeader(header);
        return header;
    }

    private setHeader(header: WadHeader) {
        this._wadStruct.header = header;
    }

    public get directory(): WadDirectory | null {
        if (!this.fileLoaded) return null;
        if (this._wadStruct.directory) return this._wadStruct.directory;
        let header: WadHeader | null = this.header;
        if (!header) return null;

        const directoryEntryLength = 16;
        const directory: WadDirectory = [];
        const view = new Uint8Array(
            this.wadFile.slice(
                header.directoryLocation,
                header.directoryLocation + header.directoryEntryCount * directoryEntryLength
            )
        );
        for (let i = 0; i < header.directoryEntryCount; i++) {
            const viewStart = i * directoryEntryLength;
            const lumpLocation = new Int32Array(view.buffer.slice(viewStart, viewStart + 4))[0];
            const lumpSize = new Int32Array(view.buffer.slice(viewStart + 4, viewStart + 8))[0];
            const lumpName = utf8ArrayToStr(view.subarray(viewStart + 8, viewStart + 16).filter(v => v));
            directory.push({ lumpLocation, lumpSize, lumpName });
        }
        this.setDirectory(directory);
        return directory;
    }

    private setDirectory(dir: WadDirectory) {
        this._wadStruct.directory = dir;
    }

    private get mapGroups() {
        if (!this.fileLoaded) return null;
        if (this._wadStruct.mapGroups) return this._wadStruct.mapGroups;
        const dir: WadDirectory | null = this.directory;
        if (!dir) return null;

        let foundLumps: MapGroupDirectory = [];
        let currentMapName: string | null = null;
        const mapGroups: WadMapGroupList = [];

        dir.forEach((entry, idx, arr) => {
            const isValid = isMapGroupDirectoryEntry(entry);
            if (isValid && !currentMapName) {
                currentMapName = arr[idx - 1].lumpName;
                foundLumps.push(entry);
            }
            else if (isValid && currentMapName) {
                foundLumps.push(entry);
            }
            else if (!isValid && currentMapName) {
                mapGroups.push({ name: currentMapName, lumps: foundLumps });
                currentMapName = null;
                foundLumps = [];
            }
        });
        this.setMapGroups(mapGroups);
        return mapGroups;
    }

    private setMapGroups(groups: WadMapGroupList) {
        this._wadStruct.mapGroups = groups;
    }

    private getMapThings(start: number, size: number) {
        const things: WadMapThing[] = [];
        const thingEntryLength = 10;
        const thingCount = size / thingEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size * thingEntryLength));
        for (let i = 0; i < thingCount; i++) {
            const viewStart = i * thingEntryLength;
            const xPos = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const yPos = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
            const angle = new Int16Array(view.buffer.slice(viewStart + 4, viewStart + 6))[0];
            const thingType: WadThingType = new Int16Array(view.buffer.slice(viewStart + 6, viewStart + 8))[0];
            const thingTypeString = WadThing[thingType];
            const flags = new Int16Array(view.buffer.slice(viewStart + 8, viewStart + 10))[0];
            things.push({ xPos, yPos, angle, thingType, flags, thingTypeString });
        }
        return things;
    }

    public get maps(): WadMapList | null {
        if (!this.fileLoaded) return null;
        if (this._wadStruct.maps) return this._wadStruct.maps;
        const mapGroups: WadMapGroupList | null = this.mapGroups;
        if (!mapGroups) return null;
        const maps: WadMapList = [];
        mapGroups.forEach((mapGroup) => {
            const map = defaultWadMap;
            const thingLump = mapGroup.lumps.find(lump => lump.lumpName === 'THINGS');
            if (thingLump) {
                map.things = this.getMapThings(thingLump.lumpLocation, thingLump.lumpSize)
            }
            maps.push(map);
        });
        this.setMaps(maps);
        return maps;
    }

    private setMaps(maps: WadMapList) {
        this._wadStruct.maps = maps;
    }


}