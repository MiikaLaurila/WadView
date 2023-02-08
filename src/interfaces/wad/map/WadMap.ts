import { isMapLump, MapLump } from "../../../library/constants";
import { WadDirectoryEntry } from "../WadDirectory";
import { defaultWadMapBlockmap, WadMapBlockMap } from "./WadMapBlockMap";
import { WadMapLinedef } from "./WadMapLinedef";
import { WadMapNode } from "./WadMapNode";
import { WadMapRejectTable } from "./WadMapRejectTable";
import { WadMapSector } from "./WadMapSector";
import { WadMapSegment } from "./WadMapSegment";
import { WadMapSidedef } from "./WadMapSidedef";
import { WadMapSubSector } from "./WadMapSubSector";
import { WadMapThing } from "./WadMapThing";
import { WadMapVertex } from "./WadMapVertex";

export interface MapGroupDirectoryEntry extends WadDirectoryEntry {
    lumpName: MapLump;
}

export type MapGroupDirectory = MapGroupDirectoryEntry[];

export const isMapGroupDirectoryEntry = (entry: unknown): entry is MapGroupDirectoryEntry => {
    return isMapLump((entry as MapGroupDirectoryEntry).lumpName)
}

export interface WadMapGroup {
    name: string;
    lumps: MapGroupDirectory;
}
export type WadMapGroupList = WadMapGroup[];
export interface WadMap {
    name: string;
    things: WadMapThing[];
    linedefs: WadMapLinedef[];
    sidedefs: WadMapSidedef[];
    vertices: WadMapVertex[];
    segments: WadMapSegment[];
    subSectors: WadMapSubSector[];
    nodes: WadMapNode[];
    sectors: WadMapSector[];
    rejectTable: WadMapRejectTable;
    blockMap: WadMapBlockMap;
}
export const defaultWadMap: Readonly<WadMap> = {
    name: '',
    things: [],
    linedefs: [],
    sidedefs: [],
    vertices: [],
    segments: [],
    subSectors: [],
    nodes: [],
    sectors: [],
    rejectTable: [],
    blockMap: { ...defaultWadMapBlockmap }
}
export type WadMapList = WadMap[];