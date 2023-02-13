import { isMapLump, type MapLump } from '../../../library/constants';
import { type Point } from '../../Point';
import { type WadDirectoryEntry } from '../WadDirectory';
import { defaultWadMapBlockmap, type WadMapBlockMap } from './WadMapBlockMap';
import { type WadMapLinedef } from './WadMapLinedef';
import { type WadMapNode } from './WadMapNode';
import { type WadMapRejectTable } from './WadMapRejectTable';
import { type WadMapSector } from './WadMapSector';
import { type WadMapSegment } from './WadMapSegment';
import { type WadMapSidedef } from './WadMapSidedef';
import { type WadMapSubSector } from './WadMapSubSector';
import { type WadMapThing } from './WadMapThing';

export interface MapGroupDirectoryEntry extends WadDirectoryEntry {
    lumpName: MapLump;
}

export type MapGroupDirectory = MapGroupDirectoryEntry[];

export const isMapGroupDirectoryEntry = (entry: unknown): entry is MapGroupDirectoryEntry => {
    return isMapLump((entry as MapGroupDirectoryEntry).lumpName);
};

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
    vertices: Point[];
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
    blockMap: { ...defaultWadMapBlockmap },
};
export type WadMapList = WadMap[];
