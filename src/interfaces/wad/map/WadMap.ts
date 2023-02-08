import { isMapLump, MapLump } from "../../../library/constants";
import { WadDirectoryEntry } from "../../WadDirectory";
import { WadMapThing } from "./WadMapThing";

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
    things: WadMapThing[];
}
export const defaultWadMap: WadMap = {
    things: [],
}
export type WadMapList = WadMap[];