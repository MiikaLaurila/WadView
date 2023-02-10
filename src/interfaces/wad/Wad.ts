import { type WadDirectory } from './WadDirectory';
import { type WadHeader } from './WadHeader';
import { type WadMapGroupList, type WadMapList } from './map/WadMap';
import { type WadPlayPal } from './WadPlayPal';
import { type WadColorMap } from './WadColorMap';

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
};
