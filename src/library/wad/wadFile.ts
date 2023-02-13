import { defaultWad, type Wad } from '../../interfaces/wad/Wad';
import { type WadHeader, WadType } from '../../interfaces/wad/WadHeader';
import {
    defaultWadMap,
    isMapGroupDirectoryEntry,
    type MapGroupDirectory,
    type WadMapGroupList,
    type WadMapList,
} from '../../interfaces/wad/map/WadMap';
import { type WadDirectory } from '../../interfaces/wad/WadDirectory';
import { utf8ArrayToStr } from '../utilities/stringUtils';
import {
    extractWadMapThingFlags,
    type WadMapThing,
    WadThingDict,
    type WadThing,
    type WadThingType,
    getWadMapThingGroup,
    SizeOfMapThing,
} from '../../interfaces/wad/map/WadMapThing';
import { extractWadMapLinedefFlags, type WadMapLinedef } from '../../interfaces/wad/map/WadMapLinedef';
import { type WadMapSidedef } from '../../interfaces/wad/map/WadMapSidedef';
import { WadFileEvent } from '../../interfaces/wad/WadFileEvent';
import { type WadMapSegment } from '../../interfaces/wad/map/WadMapSegment';
import { type WadMapSubSector } from '../../interfaces/wad/map/WadMapSubSector';
import { type WadMapNode, WadMapNodeChildType } from '../../interfaces/wad/map/WadMapNode';
import { type WadMapSector } from '../../interfaces/wad/map/WadMapSector';
import { type WadMapRejectTable } from '../../interfaces/wad/map/WadMapRejectTable';
import { defaultWadMapBlockmap, type WadMapBlockMap } from '../../interfaces/wad/map/WadMapBlockMap';
import {
    defaultPlaypal,
    preFilledPlayPal,
    type WadPlayPal,
    type WadPlayPalTypedEntry,
} from '../../interfaces/wad/WadPlayPal';
import { colorMapLumpName, playPalLumpName } from '../constants';
import { type WadColorMap } from '../../interfaces/wad/WadColorMap';
import { type Point } from '../../interfaces/Point';

interface LogMessage {
    evt: WadFileEvent;
    msg?: string;
}
export class WadFile {
    private _fileUrl = '';
    private _wadLoaded = false;
    private _wadLoadAttempted = false;
    private _wadLoadError = '';
    private _wadFile: ArrayBuffer = new ArrayBuffer(0);
    private _wadStruct: Partial<Wad> = JSON.parse(JSON.stringify(defaultWad));
    private readonly _internalLog: LogMessage[] = [];
    private readonly _eventSink?: (evt: WadFileEvent, msg?: string) => void = undefined;
    private readonly _parseRejects: boolean = false;
    private readonly _parseBlockList: boolean = false;
    private readonly _parseSegments: boolean = false;
    private readonly _parseSubSectors: boolean = false;
    private readonly _parseNodes: boolean = false;
    private readonly _debugLog: boolean = false;
    constructor(
        fileUrl?: string,
        debugLog: boolean = false,
        eventListener?: (evt: WadFileEvent, msg?: string) => any,
        readyCb?: (success: boolean, err?: string) => any,
        parseSegments: boolean = false,
        parseSubSectors: boolean = false,
        parseNodes: boolean = false,
        parseRejects: boolean = false,
        parseBlockmap: boolean = false,
    ) {
        this._parseRejects = parseRejects;
        this._parseBlockList = parseBlockmap;
        this._parseSegments = parseSegments;
        this._parseSubSectors = parseSubSectors;
        this._parseNodes = parseNodes;
        this._debugLog = debugLog;
        if (eventListener !== undefined) {
            this._eventSink = eventListener;
        }
        if (fileUrl !== undefined && readyCb !== undefined) {
            this._fileUrl = fileUrl;
            this.loadFileFromUrl(this._fileUrl, readyCb);
        }
    }

    private async breathe(ms: number): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async sendEvent(evt: WadFileEvent, msg?: string, addDelay?: number): Promise<void> {
        if (this._eventSink !== undefined) {
            if (!this._debugLog && evt.includes('DEBUG')) return;
            this._eventSink(evt, msg);
            this._internalLog.push({ evt, msg });
            await this.breathe(addDelay || 1);
        }
    }

    get eventLog(): LogMessage[] {
        return this._internalLog;
    }

    get fileName(): string {
        return this._fileUrl;
    }

    get wadLoaded(): boolean {
        return this._wadLoaded;
    }

    private set wadLoaded(loaded: boolean) {
        this._wadLoaded = loaded;
    }

    get wadLoadAttempted(): boolean {
        return this._wadLoadAttempted;
    }

    private set wadLoadAttempted(attempted: boolean) {
        this._wadLoadAttempted = attempted;
    }

    get wadLoadError(): string {
        return this._wadLoadError;
    }

    private set wadLoadError(errMsg: string) {
        this._wadLoadError = errMsg;
    }

    private get wadFile(): ArrayBuffer {
        return this._wadFile;
    }

    private set wadFile(file: ArrayBuffer) {
        this._wadFile = file;
    }

    get wadFileLength(): number {
        return this._wadFile.byteLength;
    }

    private get fileLoaded(): boolean {
        return this.wadLoadAttempted && this.wadLoaded && this.wadFile.byteLength > 0;
    }

    public loadFile(file: File, callback?: (success: boolean, err?: string) => any): void {
        this.wadLoadAttempted = true;
        this._wadStruct = JSON.parse(JSON.stringify(defaultWad));
        this._fileUrl = file.name;
        this._wadFile = new ArrayBuffer(0);
        try {
            file.arrayBuffer()
                .then((buf) => {
                    this.wadFile = buf;
                    this.wadLoaded = true;
                    void this.sendEvent(WadFileEvent.FILE_LOADED);
                    if (callback !== undefined) callback(true);
                })
                .catch((e) => {
                    console.error(e);
                    this.wadLoadError = (e as Error).message;
                    if (callback !== undefined) callback(false, e);
                });
        } catch (e) {
            console.error(e);
            this.wadLoadError = (e as Error).message;
            if (callback !== undefined) callback(false, this.wadLoadError);
        }
    }

    public loadFileFromUrl(fileUrl: string, callback?: (success: boolean, err?: string) => any): void {
        this.wadLoadAttempted = true;
        this._wadStruct = JSON.parse(JSON.stringify(defaultWad));
        this._fileUrl = fileUrl;
        this._wadFile = new ArrayBuffer(0);
        fetch(fileUrl)
            .then(async (res) => {
                try {
                    this.wadFile = await res.arrayBuffer();
                    this.wadLoaded = true;
                    void this.sendEvent(WadFileEvent.FILE_LOADED);
                    if (callback !== undefined) callback(true);
                } catch (e) {
                    console.error(e);
                    this.wadLoadError = (e as Error).message;
                    if (callback !== undefined) callback(false, this.wadLoadError);
                }
            })
            .catch((e) => {
                console.error(e);
                this.wadLoadError = (e as Error).message;
                if (callback !== undefined) callback(false, this.wadLoadError);
            });
    }

    public async header(): Promise<WadHeader | null> {
        if (!this.fileLoaded) {
            return null;
        }
        if (this._wadStruct.header !== undefined) {
            return this._wadStruct.header;
        }
        await this.sendEvent(WadFileEvent.HEADER_PARSING, `Header parsing for ${this._fileUrl}`);
        const view = new Uint8Array(this.wadFile, 0, 12);
        const type: WadType = utf8ArrayToStr(view.subarray(0, 4)) as WadType;
        if (type !== WadType.IWAD && type !== WadType.PWAD) {
            console.error('Loaded file is not of type WAD:', type);

            return null;
        }
        const directoryEntryCount: number = new Int32Array(view.buffer.slice(4, 8))[0];
        const directoryLocation: number = new Int32Array(view.buffer.slice(8, 12))[0];
        const header: WadHeader = {
            type,
            directoryEntryCount,
            directoryLocation,
        };
        this.setHeader(header);
        return header;
    }

    private setHeader(header: WadHeader): void {
        this._wadStruct.header = header;
    }

    public async directory(): Promise<WadDirectory | null> {
        const header = await this.header();
        if (header === null) {
            return null;
        }
        if (this._wadStruct.directory !== undefined) {
            return this._wadStruct.directory;
        }
        await this.sendEvent(WadFileEvent.DIRECTORY_PARSING, `Directory parsing for ${this._fileUrl}`);
        const directoryEntryLength = 16;
        const directory: WadDirectory = [];
        const view = new Uint8Array(
            this.wadFile.slice(
                header.directoryLocation,
                header.directoryLocation + header.directoryEntryCount * directoryEntryLength,
            ),
        );
        for (let i = 0; i < header.directoryEntryCount; i++) {
            const viewStart = i * directoryEntryLength;
            const lumpLocation = new Int32Array(view.buffer.slice(viewStart, viewStart + 4))[0];
            const lumpSize = new Int32Array(view.buffer.slice(viewStart + 4, viewStart + 8))[0];
            const lumpName = utf8ArrayToStr(view.subarray(viewStart + 8, viewStart + 16));
            directory.push({ lumpLocation, lumpSize, lumpName });
        }
        this.setDirectory(directory);
        return directory;
    }

    private setDirectory(dir: WadDirectory): void {
        this._wadStruct.directory = dir;
    }

    public async mapGroups(): Promise<WadMapGroupList | null> {
        const dir = await this.directory();

        if (dir === null) {
            return null;
        }
        if (this._wadStruct.mapGroups !== undefined) {
            return this._wadStruct.mapGroups;
        }
        await this.sendEvent(WadFileEvent.MAPGROUPS_PARSING, `MapGroups parsing for ${this._fileUrl}`);
        let foundLumps: MapGroupDirectory = [];
        let currentMapName: string | null = null;
        let mapGroups: WadMapGroupList = [];

        dir.forEach((entry, idx, arr) => {
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
        this.setMapGroups(mapGroups);
        return mapGroups;
    }

    private setMapGroups(groups: WadMapGroupList): void {
        this._wadStruct.mapGroups = groups;
    }

    private getMapThings(start: number, size: number): WadMapThing[] {
        const things: WadMapThing[] = [];
        const thingEntryLength = 10;
        const thingCount = size / thingEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < thingCount; i++) {
            const viewStart = i * thingEntryLength;
            const xPos = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const yPos = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
            const angle = new Int16Array(view.buffer.slice(viewStart + 4, viewStart + 6))[0];
            const thingType: WadThing = new Int16Array(view.buffer.slice(viewStart + 6, viewStart + 8))[0];
            const thingTypeString = WadThingDict[thingType] as WadThingType;
            const thingGroup = getWadMapThingGroup(thingTypeString);
            const flags = new Int16Array(view.buffer.slice(viewStart + 8, viewStart + 10))[0];
            const flagsString = extractWadMapThingFlags(flags);
            const size = SizeOfMapThing[thingTypeString];
            things.push({
                x: xPos,
                y: yPos,
                angle,
                thingType,
                flags,
                thingTypeString,
                flagsString,
                thingGroup,
                size,
            });
        }
        return things;
    }

    private getMapLinedefs(start: number, size: number): WadMapLinedef[] {
        const linedefs: WadMapLinedef[] = [];
        const linedefEntryLength = 14;
        const linedefCount = size / linedefEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < linedefCount; i++) {
            const viewStart = i * linedefEntryLength;
            const start = new Uint16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const end = new Uint16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
            const flags = new Int16Array(view.buffer.slice(viewStart + 4, viewStart + 6))[0];
            const flagsString = extractWadMapLinedefFlags(flags);
            const specialType = new Int16Array(view.buffer.slice(viewStart + 6, viewStart + 8))[0];
            const sectorTag = new Int16Array(view.buffer.slice(viewStart + 8, viewStart + 10))[0];
            const frontSideDef = new Uint16Array(view.buffer.slice(viewStart + 10, viewStart + 12))[0];
            const backSideDef = new Uint16Array(view.buffer.slice(viewStart + 12, viewStart + 14))[0];
            linedefs.push({
                start,
                end,
                flags,
                flagsString,
                specialType,
                sectorTag,
                frontSideDef,
                backSideDef,
            });
        }
        return linedefs;
    }

    private getMapSidedefs(start: number, size: number): WadMapSidedef[] {
        const sidedefs: WadMapSidedef[] = [];
        const sidedefEntryLength = 30;
        const sidedefCount = size / sidedefEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < sidedefCount; i++) {
            const viewStart = i * sidedefEntryLength;
            const xOffset = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const yOffset = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
            const upperTex = utf8ArrayToStr(view.subarray(viewStart + 4, viewStart + 12));
            const lowerTex = utf8ArrayToStr(view.subarray(viewStart + 12, viewStart + 20));
            const middleTex = utf8ArrayToStr(view.subarray(viewStart + 20, viewStart + 28));
            const sector = new Int16Array(view.buffer.slice(viewStart + 28, viewStart + 30))[0];

            sidedefs.push({
                xOffset,
                yOffset,
                upperTex,
                lowerTex,
                middleTex,
                sector,
            });
        }
        return sidedefs;
    }

    private getMapVertices(start: number, size: number): Point[] {
        const vertices: Point[] = [];
        const vertexEntryLength = 4;
        const vertexCount = size / vertexEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < vertexCount; i++) {
            const viewStart = i * vertexEntryLength;
            const xPos = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const yPos = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];

            vertices.push({ x: xPos, y: yPos });
        }
        return vertices;
    }

    private getMapSegments(start: number, size: number): WadMapSegment[] {
        const segments: WadMapSegment[] = [];
        const segmentEntryLength = 12;
        const segmentCount = size / segmentEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < segmentCount; i++) {
            const viewStart = i * segmentEntryLength;
            const start = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const end = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
            const angle = new Int16Array(view.buffer.slice(viewStart + 4, viewStart + 6))[0];
            const linedef = new Int16Array(view.buffer.slice(viewStart + 6, viewStart + 8))[0];
            const dir = new Int16Array(view.buffer.slice(viewStart + 8, viewStart + 10))[0];
            const offset = new Int16Array(view.buffer.slice(viewStart + 10, viewStart + 12))[0];

            segments.push({ start, end, angle, linedef, dir, offset });
        }
        return segments;
    }

    private getMapSubSectors(start: number, size: number): WadMapSubSector[] {
        const subSectors: WadMapSubSector[] = [];
        const subSectorEntryLength = 4;
        const subSectorCount = size / subSectorEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < subSectorCount; i++) {
            const viewStart = i * subSectorEntryLength;
            const segCount = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const firstSeg = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];

            subSectors.push({ segCount, firstSeg });
        }
        return subSectors;
    }

    private getMapNodes(start: number, size: number): WadMapNode[] {
        const nodes: WadMapNode[] = [];
        const nodeEntryLength = 28;
        const nodeCount = size / nodeEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        const getChildValues = (rawChild: number): [number, WadMapNodeChildType] => {
            const mask = 1 << 15;
            let type = WadMapNodeChildType.SUBNODE;
            let val = rawChild;
            if ((rawChild & mask) !== 0) {
                type = WadMapNodeChildType.SUBSECTOR;
                val = rawChild & ~mask;
            }
            return [val, type];
        };
        for (let i = 0; i < nodeCount; i++) {
            if (view.buffer.slice(i * nodeEntryLength, i * nodeEntryLength + 28).byteLength !== 28) continue;
            try {
                const viewStart = i * nodeEntryLength;
                const xPartStart = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
                const yPartStart = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
                const xPartChange = new Int16Array(view.buffer.slice(viewStart + 4, viewStart + 6))[0];
                const yPartChange = new Int16Array(view.buffer.slice(viewStart + 6, viewStart + 8))[0];
                const rightBBoxRaw = Array.from(new Int16Array(view.buffer.slice(viewStart + 8, viewStart + 16)));
                const rightBBox = {
                    top: rightBBoxRaw[0],
                    bottom: rightBBoxRaw[1],
                    left: rightBBoxRaw[2],
                    right: rightBBoxRaw[3],
                };
                const leftBBoxRaw = Array.from(new Int16Array(view.buffer.slice(viewStart + 16, viewStart + 24)));
                const leftBBox = {
                    top: leftBBoxRaw[0],
                    bottom: leftBBoxRaw[1],
                    left: leftBBoxRaw[2],
                    right: leftBBoxRaw[3],
                };
                const rightChildRaw = new Uint16Array(view.buffer.slice(viewStart + 24, viewStart + 26))[0];
                const leftChildRaw = new Uint16Array(view.buffer.slice(viewStart + 26, viewStart + 28))[0];
                const rightChildValues = getChildValues(rightChildRaw);
                const rightChild = rightChildValues[0];
                const rightChildType = rightChildValues[1];
                const leftChildValues = getChildValues(leftChildRaw);
                const leftChild = leftChildValues[0];
                const leftChildType = leftChildValues[1];

                nodes.push({
                    xPartStart,
                    yPartStart,
                    xPartChange,
                    yPartChange,
                    rightBBoxRaw,
                    leftBBoxRaw,
                    rightChildRaw,
                    leftChildRaw,
                    rightBBox,
                    leftBBox,
                    leftChild,
                    leftChildType,
                    rightChild,
                    rightChildType,
                });
            } catch (e) {
                console.error(e);
            }
        }
        return nodes;
    }

    private getMapSectors(start: number, size: number): WadMapSector[] {
        const sectors: WadMapSector[] = [];
        const sectorEntryLength = 26;
        const sectorCount = size / sectorEntryLength;
        const view = new Uint8Array(this.wadFile.slice(start, start + size));
        for (let i = 0; i < sectorCount; i++) {
            const viewStart = i * sectorEntryLength;
            const floorHeight = new Int16Array(view.buffer.slice(viewStart, viewStart + 2))[0];
            const ceilingHeight = new Int16Array(view.buffer.slice(viewStart + 2, viewStart + 4))[0];
            const floorTex = utf8ArrayToStr(view.subarray(viewStart + 4, viewStart + 12));
            const ceilingTex = utf8ArrayToStr(view.subarray(viewStart + 12, viewStart + 20));
            const lightLevel = new Int16Array(view.buffer.slice(viewStart + 20, viewStart + 22))[0];
            const specialType = new Int16Array(view.buffer.slice(viewStart + 22, viewStart + 24))[0];
            const tag = new Int16Array(view.buffer.slice(viewStart + 24, viewStart + 26))[0];

            sectors.push({
                floorHeight,
                ceilingHeight,
                floorTex,
                ceilingTex,
                lightLevel,
                specialType,
                tag,
            });
        }
        return sectors;
    }

    private getMapRejectTable(start: number, size: number, sectorCount: number): WadMapRejectTable {
        const tableToWrite = Array(sectorCount).fill(Array(sectorCount).fill(false)).flat();
        const view = new Uint8Array(this.wadFile.slice(start, start + size));

        for (let i = 0; i < size; i++) {
            let rawBinary = view[i].toString(2);
            rawBinary = '00000000'.substring(0, 8 - rawBinary.length) + rawBinary;
            const bitsToWrite = Array.from(rawBinary)
                .reverse()
                .map((v) => v === '1');
            for (let j = 0; j < bitsToWrite.length; j++) {
                if (i * bitsToWrite.length + j < tableToWrite.length) {
                    tableToWrite[i * bitsToWrite.length + j] = bitsToWrite[j];
                }
            }
        }

        const table: WadMapRejectTable = [];
        const tempTable = Array(sectorCount).fill(false);
        for (let i = 0; i < tableToWrite.length; i++) {
            tempTable[i % sectorCount] = tableToWrite[i];
            if (i % sectorCount === 0) {
                table.push(tempTable);
            }
        }
        return table;
    }

    private getMapBlockmap(start: number, size: number): WadMapBlockMap {
        const blockmap: WadMapBlockMap = JSON.parse(JSON.stringify(defaultWadMapBlockmap));
        const view = new Uint8Array(this.wadFile.slice(start, start + size));

        const xOrigin = new Int16Array(view.buffer.slice(0, 2))[0];
        const yOrigin = new Int16Array(view.buffer.slice(2, 4))[0];
        const columns = new Int16Array(view.buffer.slice(4, 6))[0];
        const rows = new Int16Array(view.buffer.slice(6, 8))[0];

        blockmap.xOrigin = xOrigin;
        blockmap.yOrigin = yOrigin;
        blockmap.columns = columns;
        blockmap.rows = rows;
        if (this._parseBlockList) {
            const blockCount = columns * rows;
            const offsets = [];
            for (let i = 0; i < blockCount; i++) {
                const baseOffset = 8 + i * 2;
                const byte0 = new Uint8Array(view.buffer.slice(baseOffset, baseOffset + 1))[0];
                const byte1 = new Uint8Array(view.buffer.slice(baseOffset + 1, baseOffset + 2))[0];
                offsets.push((((byte1 & 0xff) << 8) | (byte0 & 0xff)) * 2);
            }
            blockmap.offsets = offsets;

            const blockList = [];
            for (let i = 0; i < offsets.length; i++) {
                const startPoint = offsets[i];
                let stopPoint: number | null = null;
                let readLength = 0;
                if (i < offsets.length - 1) {
                    stopPoint = offsets[i + 1];
                    readLength = stopPoint - startPoint;
                } else {
                    let lastByte = 0;
                    let readBytesCount = 0;
                    while (lastByte !== 65535) {
                        readBytesCount += 2;
                        lastByte = new Uint16Array(
                            view.buffer.slice(startPoint + readBytesCount, startPoint + readBytesCount + 2),
                        )[0];
                    }
                    readLength = readBytesCount + 2;
                }

                let linesOfBlock = [];
                for (let j = 0; j < readLength; j += 2) {
                    linesOfBlock.push(new Uint16Array(view.buffer.slice(startPoint + j, startPoint + j + 2))[0]);
                }
                linesOfBlock = linesOfBlock.filter((l) => l !== 0 && l !== 65535);
                blockList.push(linesOfBlock);
            }
            blockmap.blockList = blockList;
        }
        return blockmap;
    }

    public async maps(): Promise<WadMapList | null> {
        const mapGroups = await this.mapGroups();

        if (mapGroups === null) {
            return null;
        }

        if (this._wadStruct.maps !== undefined) {
            return this._wadStruct.maps;
        }
        await this.sendEvent(WadFileEvent.MAPS_PARSING, `Maps parsing for ${this._fileUrl}`);
        const maps: WadMapList = [];
        for (let i = 0; i < mapGroups.length; i++) {
            const mapGroup = mapGroups[i];
            const map = { ...defaultWadMap };
            map.name = mapGroup.name;

            const thingLump = mapGroup.lumps.find((lump) => lump.lumpName === 'THINGS');
            if (thingLump !== undefined) {
                await this.sendEvent(
                    WadFileEvent.MAP_THINGS_PARSING,
                    `Things parsed for ${mapGroup.name}`,
                );
                map.things = this.getMapThings(thingLump.lumpLocation, thingLump.lumpSize);
            }

            const linedefLump = mapGroup.lumps.find((lump) => lump.lumpName === 'LINEDEFS');
            if (linedefLump !== undefined) {
                await this.sendEvent(
                    WadFileEvent.MAP_LININGEFS_PARSING,
                    `Linedefs parsing for ${mapGroup.name}`,
                );
                map.linedefs = this.getMapLinedefs(linedefLump.lumpLocation, linedefLump.lumpSize);
            }

            const sidedefLump = mapGroup.lumps.find((lump) => lump.lumpName === 'SIDEDEFS');
            if (sidedefLump !== undefined) {
                await this.sendEvent(
                    WadFileEvent.MAP_SIDINGEFS_PARSING,
                    `Sidedefs parsing for ${mapGroup.name}`,
                );
                map.sidedefs = this.getMapSidedefs(sidedefLump.lumpLocation, sidedefLump.lumpSize);
            }

            const verticesLump = mapGroup.lumps.find((lump) => lump.lumpName === 'VERTEXES');
            if (verticesLump !== undefined) {
                await this.sendEvent(
                    WadFileEvent.MAP_VERTICES_PARSING,
                    `Vertices parsing for ${mapGroup.name}`,
                );
                map.vertices = this.getMapVertices(verticesLump.lumpLocation, verticesLump.lumpSize);
            }

            if (this._parseSegments) {
                const segmentsLump = mapGroup.lumps.find((lump) => lump.lumpName === 'SEGS');
                if (segmentsLump !== undefined) {
                    await this.sendEvent(
                        WadFileEvent.MAP_SEGMENTS_PARSING,
                        `Segments parsing for ${mapGroup.name}`,
                    );
                    map.segments = this.getMapSegments(segmentsLump.lumpLocation, segmentsLump.lumpSize);
                }
            } else {
                await this.sendEvent(
                    WadFileEvent.MAP_SKIPPING_NODES,
                    `SKIPPING Nodes parsing for ${mapGroup.name}`,
                );
            }

            if (this._parseSubSectors) {
                const subSectorsLump = mapGroup.lumps.find((lump) => lump.lumpName === 'SSECTORS');
                if (subSectorsLump !== undefined) {
                    await this.sendEvent(
                        WadFileEvent.MAP_SUBSECTORS_PARSING,
                        `SubSectors parsing for ${mapGroup.name}`,
                    );
                    map.subSectors = this.getMapSubSectors(subSectorsLump.lumpLocation, subSectorsLump.lumpSize);
                }
            } else {
                await this.sendEvent(
                    WadFileEvent.MAP_SKIPPING_NODES,
                    `SKIPPING Nodes parsing for ${mapGroup.name}`,
                );
            }

            if (this._parseNodes) {
                const nodesLump = mapGroup.lumps.find((lump) => lump.lumpName === 'NODES');
                if (nodesLump !== undefined) {
                    await this.sendEvent(
                        WadFileEvent.MAP_NODES_PARSING,
                        `Nodes parsing for ${mapGroup.name}`,
                    );
                    map.nodes = this.getMapNodes(nodesLump.lumpLocation, nodesLump.lumpSize);
                }
            } else {
                await this.sendEvent(
                    WadFileEvent.MAP_SKIPPING_NODES,
                    `SKIPPING Nodes parsing for ${mapGroup.name}`,
                );
            }

            const sectorLump = mapGroup.lumps.find((lump) => lump.lumpName === 'SECTORS');
            if (sectorLump !== undefined) {
                await this.sendEvent(
                    WadFileEvent.MAP_SECTORS_PARSING,
                    `Sectors parsing for ${mapGroup.name}`,
                );
                map.sectors = this.getMapSectors(sectorLump.lumpLocation, sectorLump.lumpSize);
            }

            if (this._parseRejects) {
                const rejectLump = mapGroup.lumps.find((lump) => lump.lumpName === 'REJECT');
                if (rejectLump !== undefined) {
                    await this.sendEvent(
                        WadFileEvent.MAP_REJECT_TABLE_PARSING,
                        `RejectTable parsing for ${mapGroup.name}`,
                    );
                    map.rejectTable = this.getMapRejectTable(
                        rejectLump.lumpLocation,
                        rejectLump.lumpSize,
                        map.sectors.length,
                    );
                }
            } else {
                await this.sendEvent(
                    WadFileEvent.MAP_SKIPPING_REJECT_TABLE,
                    `SKIPPING RejectTable parsing for ${mapGroup.name}`,
                );
            }

            const blockmapLump = mapGroup.lumps.find((lump) => lump.lumpName === 'BLOCKMAP');
            if (blockmapLump !== undefined) {
                await this.sendEvent(
                    WadFileEvent.MAP_BLOCKMAP_PARSING,
                    `BlockMap parsing for ${mapGroup.name}`,
                );
                if (!this._parseBlockList) {
                    await this.sendEvent(
                        WadFileEvent.MAP_SKIPPING_BLOCKLIST,
                        `SKIPPING BlockList parsing for ${mapGroup.name}`,
                    );
                }
                map.blockMap = this.getMapBlockmap(blockmapLump.lumpLocation, blockmapLump.lumpSize);
            }
            maps.push(map);
        }
        mapGroups.forEach((mapGroup) => {});
        this.setMaps(maps);
        return maps;
    }

    private setMaps(maps: WadMapList): void {
        this._wadStruct.maps = maps;
    }

    public async playpal(): Promise<WadPlayPal | null> {
        const dir = await this.directory();

        if (dir === null) {
            return null;
        }

        if (this._wadStruct.playPal !== undefined) {
            return this._wadStruct.playPal;
        }
        await this.sendEvent(WadFileEvent.PLAYPAL_PARSING, `PlayPal parsing for ${this._fileUrl}`);
        const playPalLump = dir.find((e) => e.lumpName === playPalLumpName);
        if (playPalLump === undefined) {
            this.setPlaypal(preFilledPlayPal);
            return preFilledPlayPal;
        }

        const playpal = JSON.parse(JSON.stringify(defaultPlaypal));
        const view = new Uint8Array(
            this.wadFile.slice(playPalLump.lumpLocation, playPalLump.lumpLocation + playPalLump.lumpSize),
        );
        const paletteSize = 768;
        const paletteCount = 14;
        const rgbToHex = (r: number, g: number, b: number): string => {
            // eslint-disable-next-line no-mixed-operators
            return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
        };
        for (let i = 0; i < paletteCount; i++) {
            const rawPaletteArr: number[] = [];
            const typedPaletteArr: WadPlayPalTypedEntry = [];
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
        this.setPlaypal(playpal);

        return playpal;
    }

    private setPlaypal(playpal: WadPlayPal): void {
        this._wadStruct.playPal = playpal;
    }

    public async colormap(): Promise<WadColorMap | null> {
        const dir = await this.directory();

        if (dir === null) {
            return null;
        }
        if (this._wadStruct.colorMap !== undefined) {
            return this._wadStruct.colorMap;
        }

        const colorMapLump = dir.find((e) => e.lumpName === colorMapLumpName);
        if (colorMapLump === undefined) {
            return null;
        }
        await this.sendEvent(WadFileEvent.COLORMAP_PARSING, `ColorMap parsing for ${this._fileUrl}`);
        const colorMap = [];
        const view = new Uint8Array(
            this.wadFile.slice(colorMapLump.lumpLocation, colorMapLump.lumpLocation + colorMapLump.lumpSize),
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
        this.setColormap(colorMap);
        return colorMap;
    }

    private setColormap(colorMap: WadColorMap): void {
        this._wadStruct.colorMap = colorMap;
    }
}
