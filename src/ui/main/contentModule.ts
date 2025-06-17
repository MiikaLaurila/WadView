import { initAttributionsWindow } from "../windows/attributionsWindow";
import { initColormapWindowModule } from "../windows/colormapWindow";
import { initDehackedWindowModule } from "../windows/dehackedWindow";
import { initDirectoryWindowModule } from "../windows/directoryWindow";
import {
	disposeEndoomModule,
	initEndoomWindowModule,
} from "../windows/endoomWindow";
import { initExternalSearchBrowser } from "../windows/externalSearchBrowser";
import { initFlatsWindowModule } from "../windows/flatsWindow";
import { initHeaderWindowModule } from "../windows/headerWindow";
import { initLogWindowModule } from "../windows/logWindow";
import { initMapGroupWindowModule } from "../windows/mapGroupWindow";
import {
	disposeMapWindowModule,
	initMapWindowModule,
} from "../windows/mapWindow";
import { initMenuGraphicsModule } from "../windows/menuGraphicsWindow";
import { initMusicModule, minimizeMusic } from "../windows/musicWindow";
import { initNotReadyWindowModule } from "../windows/notreadyWindow";
import { initPatchesWindowModule } from "../windows/patchesWindow";
import { initPlaypalWindowModule } from "../windows/playpalWindow";
import {
	disposeSpritesWindowModule,
	initSpritesWindowModule,
} from "../windows/spritesWindow";
import { initStbarGraphicsModule } from "../windows/stbarGraphicsWindow";

//prettier-ignore
export const contentModule = [
	"log",
	"map",
	"playpal",
	"colormap",
	"notImplemented",
	"directory",
	"mapgroup",
	"header",
	"endoom",
	"exsearch",
	"dehacked",
	"patches",
	"flats",
	"sprites",
	"menuGraphics",
	"stbarGraphics",
	"music",
	"attributions",
] as const;
export type ContentModuleType = (typeof contentModule)[number];

let selectedModule: ContentModuleType = "log";

export interface ModuleOptions {
	mapName?: string;
}

export const disposeModules = () => {
	const existingModules = document.getElementsByClassName("module");
	if (existingModules.length > 0) {
		for (const m of Array.from(existingModules)) {
			const id = m.id as ContentModuleType;
			if (id === "map") {
				disposeMapWindowModule();
			}
			if (id === "endoom") {
				disposeEndoomModule();
			}
			if (id === "sprites") {
				disposeSpritesWindowModule();
			}
			if (id === "music") {
				minimizeMusic();
			} else {
				m.parentElement?.removeChild(m);
			}
		}
	}
};

export const createModule = (id: ContentModuleType) => {
	disposeModules();
	const mod = document.createElement("div");
	mod.id = id;
	mod.classList.add("module");
	document.getElementById("content")?.appendChild(mod);
	return mod;
};

export const initContentModule = () => {
	switchContentModule("log");
};

export const switchContentModule = (
	id: ContentModuleType,
	options?: ModuleOptions,
) => {
	selectedModule = id;
	switch (selectedModule) {
		case "log":
			initLogWindowModule();
			break;
		case "playpal":
			initPlaypalWindowModule();
			break;
		case "colormap":
			initColormapWindowModule();
			break;
		case "map":
			if (options?.mapName) {
				initMapWindowModule(options.mapName);
			}
			break;
		case "directory":
			initDirectoryWindowModule();
			break;
		case "mapgroup":
			initMapGroupWindowModule();
			break;
		case "header":
			initHeaderWindowModule();
			break;
		case "endoom":
			initEndoomWindowModule();
			break;
		case "exsearch":
			initExternalSearchBrowser();
			break;
		case "dehacked":
			initDehackedWindowModule();
			break;
		case "patches":
			initPatchesWindowModule();
			break;
		case "flats":
			initFlatsWindowModule();
			break;
		case "sprites":
			initSpritesWindowModule();
			break;
		case "menuGraphics":
			initMenuGraphicsModule();
			break;
		case "stbarGraphics":
			initStbarGraphicsModule();
			break;
		case "music":
			initMusicModule();
			break;
		case "attributions":
			initAttributionsWindow();
			break;
		case "notImplemented":
			initNotReadyWindowModule();
			break;
		default:
			console.log("No implementation for", id);
			break;
	}
};
