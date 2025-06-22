import { Buffer } from "buffer";

// @ts-ignore
window.Buffer = Buffer;

import {
	type WadColorMap,
	type WadDehacked,
	type WadDirectoryEntry,
	type WadEndoom,
	WadFileEvent,
	type WadFileInfo,
	type WadFlat,
	type WadHeader,
	type WadMapGroupList,
	type WadMapList,
	type WadMenuGraphic,
	type WadMusic,
	type WadPlaypal,
	type WadSprite,
	type WadStbarGraphic,
	type WadTextures,
	defaultWadDehacked,
	defaultWadHeader,
	preFilledPlaypal,
} from "wadview-lib";
import "./styles/styles";
import { initContentModule } from "./ui/main/contentModule";
import {
	initializeSideBarColors,
	initializeSideBarMaps,
	initializeSideBarMeta,
	initializeSideBarMusic,
	initializeSideBarTextures,
	initializeSideBarAttributions,
	initializeSideBarMisc,
} from "./ui/main/sidebar";
import { initTopBar, setTopBarFileName } from "./ui/main/topbar";
import { initWadInput } from "./ui/main/wadInput";
import { addLogWindowMessage } from "./ui/windows/logWindow";
import { closeMusic } from "./ui/windows/musicWindow";

let headers: WadFileInfo<WadHeader>[] = [
	{ ...defaultWadHeader, wadFileName: "default", wadIdx: 0 },
];
let directories: WadFileInfo<WadDirectoryEntry>[] = [];
let mapGroups: WadMapGroupList = [];
let maps: WadMapList = [];
let playpals: WadFileInfo<WadPlaypal>[] = [
	{ ...preFilledPlaypal, wadFileName: "default", wadIdx: 0 },
];
let colormaps: WadFileInfo<WadColorMap>[] = [];
let endooms: WadFileInfo<WadEndoom>[] = [];
let dehacked: WadDehacked | null = null;
let textures: WadTextures | null = null;
let flats: WadFlat[] | null = null;
let sprites: WadSprite[] | null = null;
let menuGraphics: WadMenuGraphic[] | null = null;
let stbarGraphics: WadStbarGraphic[] | null = null;
let music: WadMusic[] | null = null;
let niceFileName = "";

const resetParsed = () => {
	closeMusic();
	headers = [{ ...defaultWadHeader, wadFileName: "default", wadIdx: 0 }];
	directories = [];
	mapGroups = [];
	maps = [];
	playpals = [{ ...preFilledPlaypal, wadFileName: "default", wadIdx: 0 }];
	colormaps = [];
	endooms = [];
	flats = [];
	sprites = [];
	menuGraphics = [];
	music = [];
	stbarGraphics = [];
	dehacked = defaultWadDehacked;
};

export const getHeaders = () => headers;
export const getDirectories = () => directories;
export const getMapGroups = () => mapGroups;
export const getMaps = () => maps;
export const getPlaypals = () => playpals;
export const getColormaps = () => colormaps;
export const getEndooms = () => endooms;
export const getDehacked = () => dehacked;
export const getTextures = () => textures;
export const getNiceFileName = () => niceFileName;
export const getFlats = () => flats;
export const getSprites = () => sprites;
export const getMenuGraphics = () => menuGraphics;
export const getStbarGraphics = () => stbarGraphics;
export const getMusic = () => music;

const loadWholeWad = async () => {
	resetParsed();

	const tempHeaders = await wadFile.header();
	if (tempHeaders) {
		headers = tempHeaders;
	} else return;

	const tempDirectories = await wadFile.directory();
	if (tempDirectories) {
		directories = tempDirectories;
	}

	const tempMapGroups = await wadFile.mapGroups();
	if (tempMapGroups) {
		mapGroups = tempMapGroups;
	}

	const tempMaps = await wadFile.maps();
	if (tempMaps) {
		maps = tempMaps;
	}

	const tempPlaypals = await wadFile.playpal();
	if (tempPlaypals) {
		playpals = tempPlaypals;
	}

	const tempColormaps = await wadFile.colormap();
	if (tempColormaps) {
		colormaps = tempColormaps;
	}

	const tempEndooms = await wadFile.endoom();
	if (tempEndooms) {
		endooms = tempEndooms;
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

	const tempStbarGraphics = await wadFile.stbarGraphics();
	if (tempStbarGraphics) {
		stbarGraphics = tempStbarGraphics;
	}

	const tempMusic = await wadFile.music();
	if (tempMusic) {
		music = tempMusic;
	}

	addLogWindowMessage(`${wadFile.fileUrls.join(", ")} loaded into memory`);
	onWadFileEvent(WadFileEvent.LOADING_READY);
	niceFileName = (() => {
		if (wadFile.niceFileNames.length > 1) {
			return `${wadFile.wadName}`;
		}
		return wadFile.niceFileNames[0];
	})();
	setTopBarFileName(niceFileName);
};

const onWadFileEvent = (evt: WadFileEvent) => {
	if (evt === WadFileEvent.FILE_LOADED) {
		void loadWholeWad();
	} else if (evt === WadFileEvent.LOADING_READY) {
		initializeSideBarMeta(headers, directories, mapGroups);
		initializeSideBarMisc(endooms, dehacked);
		initializeSideBarColors(playpals, colormaps);
		initializeSideBarMaps(maps);
		initializeSideBarTextures(
			textures,
			flats,
			sprites,
			menuGraphics,
			stbarGraphics,
		);
		initializeSideBarMusic(music);
	}
};

const wadFile = initWadInput(onWadFileEvent);
initContentModule();
initializeSideBarAttributions();
initTopBar();
