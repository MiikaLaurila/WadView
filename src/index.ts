import { WadMapGroupList, WadMapList } from './interfaces/wad/map/WadMap';
import { WadColorMap } from './interfaces/wad/WadColorMap';
import { WadDirectory } from './interfaces/wad/WadDirectory';
import { WadFileEvent } from './interfaces/wad/WadFileEvent';
import { WadHeader, defaultWadHeader } from './interfaces/wad/WadHeader';
import { WadPlaypal, defaultPlaypal } from './interfaces/wad/WadPlayPal';
import { initContentModule } from './ui/main/contentModule';
import { initializeSideBarMeta, initializeSideBarColors, initializeSideBarMaps } from './ui/main/sidebar';
import { setTopBarFileName } from './ui/main/topbar';
import { initWadInput } from './ui/main/wadInput';
import { addLogWindowMessage } from './ui/windows/logWindow';
import './styles/styles';

let header: WadHeader = defaultWadHeader;
let directory: WadDirectory = [];
let mapGroups: WadMapGroupList = [];
let maps: WadMapList = [];
let playpal: WadPlaypal = defaultPlaypal;
let colormap: WadColorMap = [];
let niceFileName = '';

export const getHeader = () => header;
export const getDirectory = () => directory;
export const getMapGroups = () => mapGroups;
export const getMaps = () => maps;
export const getPlaypal = () => playpal;
export const getColormap = () => colormap;
export const getNiceFileName = () => niceFileName;

const loadWholeWad = async () => {
    const tempHeader = await wadFile.header();
    if (tempHeader) {
        header = tempHeader;
    } else return;

    const tempDirectory = await wadFile.directory();
    if (tempDirectory) {
        directory = tempDirectory;
    }

    const tempMapGroups = await wadFile.mapGroups();
    if (tempMapGroups) {
        mapGroups = tempMapGroups;
    }

    const tempMaps = await wadFile.maps();
    if (tempMaps) {
        maps = tempMaps;
    }

    const tempPlaypal = await wadFile.playpal();
    if (tempPlaypal) {
        playpal = tempPlaypal;
    }

    const tempColormap = await wadFile.colormap();
    if (tempColormap) {
        colormap = tempColormap;
    }

    addLogWindowMessage(`${wadFile.fileUrl} loaded into memory`);
    onWadFileEvent(WadFileEvent.LOADING_READY);
    niceFileName = wadFile.niceFileName;
    setTopBarFileName(wadFile.niceFileName);
};

const onWadFileEvent = (evt: WadFileEvent) => {
    if (evt === WadFileEvent.FILE_LOADED) {
        void loadWholeWad();
    } else if (evt === WadFileEvent.LOADING_READY) {
        initializeSideBarMeta(header, directory, mapGroups);
        initializeSideBarColors(playpal, colormap);
        initializeSideBarMaps(maps);
    }
};

const wadFile = initWadInput(onWadFileEvent);
initContentModule();
