import { type WadDirectory } from './WadDirectory';
import { type WadHeader } from './WadHeader';
import { type WadMapGroupList, type WadMapList } from './map/WadMap';
import { type WadPlaypal } from './WadPlayPal';
import { type WadColorMap } from './WadColorMap';
import { WadEndoom } from './WadEndoom';

export interface Wad {
    header: WadHeader;
    directory: WadDirectory;
    mapGroups: WadMapGroupList;
    maps: WadMapList;
    playpal: WadPlaypal;
    colormap: WadColorMap;
    endoom: WadEndoom;
}

export const defaultWad: Readonly<Partial<Wad>> = {
    header: undefined,
    directory: undefined,
    mapGroups: undefined,
    maps: undefined,
    playpal: undefined,
    colormap: undefined,
    endoom: undefined,
};
