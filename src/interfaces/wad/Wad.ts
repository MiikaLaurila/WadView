import { WadDirectory } from "../WadDirectory";
import { WadHeader } from "./WadHeader";
import { WadMapGroupList, WadMapList } from "./map/WadMap";

export interface Wad {
    header: WadHeader;
    directory: WadDirectory;
    mapGroups: WadMapGroupList;
    maps: WadMapList;
}

export const defaultWad: Readonly<Partial<Wad>> = {
    header: undefined,
    directory: undefined,
    mapGroups: undefined,
    maps: undefined,
}