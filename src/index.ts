import './styles/styles';
import { WadMapGroupList, WadMapList } from './interfaces/wad/map/WadMap';
import { WadColorMap } from './interfaces/wad/WadColorMap';
import { WadDirectory } from './interfaces/wad/WadDirectory';
import { WadFileEvent } from './interfaces/wad/WadFileEvent';
import { WadHeader, defaultWadHeader } from './interfaces/wad/WadHeader';
import { WadPlaypal, defaultPlaypal } from './interfaces/wad/WadPlayPal';
import { initContentModule } from './ui/main/contentModule';
import { initializeSideBarMeta, initializeSideBarColors, initializeSideBarMaps, initializeSideBarTextures } from './ui/main/sidebar';
import { setTopBarFileName } from './ui/main/topbar';
import { initWadInput } from './ui/main/wadInput';
import { addLogWindowMessage } from './ui/windows/logWindow';
import { WadEndoom } from './interfaces/wad/WadEndoom';
import { WadDehacked } from './interfaces/wad/WadDehacked';
import { WadTextures } from './interfaces/wad/texture/WadTextures';

let header: WadHeader = defaultWadHeader;
let directory: WadDirectory = [];
let mapGroups: WadMapGroupList = [];
let maps: WadMapList = [];
let playpal: WadPlaypal = defaultPlaypal;
let colormap: WadColorMap = [];
let endoom: WadEndoom = [];
let dehacked: WadDehacked | null = null;
let textures: WadTextures | null = null;
let niceFileName = '';

const resetParsed = () => {
    header = defaultWadHeader;
    directory = [];
    mapGroups = [];
    maps = [];
    playpal = defaultPlaypal;
    colormap = [];
    endoom = [];
};

export const getHeader = () => header;
export const getDirectory = () => directory;
export const getMapGroups = () => mapGroups;
export const getMaps = () => maps;
export const getPlaypal = () => playpal;
export const getColormap = () => colormap;
export const getEndoom = () => endoom;
export const getDehacked = () => dehacked;
export const getTextures = () => textures;
export const getNiceFileName = () => niceFileName;

const loadWholeWad = async () => {
    resetParsed();

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

    const tempEndoom = await wadFile.endoom();
    if (tempEndoom) {
        endoom = tempEndoom;
    }

    const tempDehacked = await wadFile.dehacked();
    if (tempDehacked) {
        dehacked = tempDehacked;
    }

    const tempTextures = await wadFile.textures();
    if (tempTextures) {
        textures = tempTextures;
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
        initializeSideBarMeta(header, directory, mapGroups, endoom, dehacked);
        initializeSideBarColors(playpal, colormap);
        initializeSideBarMaps(maps);
        initializeSideBarTextures(textures);
    }
};

const wadFile = initWadInput(onWadFileEvent);
initContentModule();
