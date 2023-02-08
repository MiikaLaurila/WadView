import { WadDirectory } from "./WadDirectory";
import { WadHeader } from "./WadHeader";
import { WadMapGroupList, WadMapList } from "./map/WadMap";
import { WadPlayPal } from "./WadPlayPal";
import { WadColorMap } from "./WadColorMap";

export interface Wad {
    header: WadHeader;
    directory: WadDirectory;
    mapGroups: WadMapGroupList;
    maps: WadMapList;
    playPal: WadPlayPal;
    colorMap: WadColorMap;
}

export const defaultWad: Readonly<Partial<Wad>> = {
    header: undefined,
    directory: undefined,
    mapGroups: undefined,
    maps: undefined,
    playPal: undefined,
    colorMap: undefined,
}