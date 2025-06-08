import { Buffer } from "buffer";

// @ts-ignore
window.Buffer = Buffer;

import {
	type WadColorMap,
	type WadDehacked,
	type WadDirectory,
	type WadEndoom,
	WadFileEvent,
	type WadFlat,
	type WadHeader,
	type WadMapGroupList,
	type WadMapList,
	type WadMenuGraphic,
	type WadMusic,
	type WadPlaypal,
	type WadSprite,
	type WadTextures,
	defaultPlaypal,
	defaultWadDehacked,
	defaultWadHeader,
} from "wadview-lib";
import "./styles/styles";
import { disposeModules, initContentModule } from "./ui/main/contentModule";
import {
	initializeSideBarColors,
	initializeSideBarMaps,
	initializeSideBarMeta,
	initializeSideBarMusic,
	initializeSideBarTextures,
} from "./ui/main/sidebar";
import { setTopBarFileName } from "./ui/main/topbar";
import { initWadInput } from "./ui/main/wadInput";
import { addLogWindowMessage } from "./ui/windows/logWindow";
import { closeMusic } from "./ui/windows/musicWindow";

let header: WadHeader = defaultWadHeader;
let directory: WadDirectory = [];
let mapGroups: WadMapGroupList = [];
let maps: WadMapList = [];
let playpal: WadPlaypal = defaultPlaypal;
let colormap: WadColorMap = [];
let endoom: WadEndoom = [];
let dehacked: WadDehacked | null = null;
let textures: WadTextures | null = null;
let flats: WadFlat[] | null = null;
let sprites: WadSprite[] | null = null;
let menuGraphics: WadMenuGraphic[] | null = null;
let music: WadMusic[] | null = null;
let niceFileName = "";

const resetParsed = () => {
	closeMusic();
	header = defaultWadHeader;
	directory = [];
	mapGroups = [];
	maps = [];
	playpal = defaultPlaypal;
	colormap = [];
	endoom = [];
	flats = [];
	sprites = [];
	menuGraphics = [];
	music = [];
	dehacked = defaultWadDehacked;
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
export const getFlats = () => flats;
export const getSprites = () => sprites;
export const getMenuGraphics = () => menuGraphics;
export const getMusic = () => music;

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

	const tempFlats = await wadFile.flats();
	if (tempFlats) {
		flats = tempFlats;
	}

	const tempSprites = await wadFile.sprites();
	if (tempSprites) {
		sprites = tempSprites;
	}

	const tempMenuGraphics = await wadFile.menuGraphics();
	if (tempMenuGraphics) {
		menuGraphics = tempMenuGraphics;
	}

	const tempMusic = await wadFile.music();
	if (tempMusic) {
		music = tempMusic;
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
		initializeSideBarTextures(textures, flats, sprites, menuGraphics);
		initializeSideBarMusic(music);
	}
};

const wadFile = initWadInput(onWadFileEvent);
initContentModule();
