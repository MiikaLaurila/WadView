import {
	type WadColorMap,
	type WadDehacked,
	type WadDirectoryEntry,
	type WadEndoom,
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
	WadType,
} from "wadview-lib";
import { switchContentModule } from "./contentModule";

const pages = [
	"Metadata",
	"Misc",
	"Colors",
	"Maps",
	"Images",
	"Music",
	"Attributions",
] as const;
type PageType = (typeof pages)[number];
let openedGroups: PageType[] = [];
let eventListenersAdded: PageType[] = [];

const removeFromOpened = (type: PageType) => {
	const idx = openedGroups.findIndex((g) => g === type);
	const copy = [...openedGroups];
	copy.splice(idx, 1);
	openedGroups = copy;
};

const removeFromEventListenersAdded = (type: PageType) => {
	const idx = eventListenersAdded.findIndex((g) => g === type);
	const copy = [...eventListenersAdded];
	copy.splice(idx, 1);
	eventListenersAdded = copy;
};

const eventListener = (type: PageType, evt: MouseEvent) => {
	if (!eventListenersAdded.includes(type)) {
		eventListenersAdded.push(type);
	}

	if (openedGroups.includes(type)) {
		const parent = (evt.target as HTMLDivElement).parentElement;
		if (parent) {
			for (const c of Array.from(parent.children)) {
				if (c.classList.contains("subhead")) {
					c.setAttribute("style", "display: none;");
				}
			}
		}

		removeFromOpened(type);
	} else {
		const parent = (evt.target as HTMLDivElement).parentElement;
		if (parent) {
			for (const c of Array.from(parent.children)) {
				if (c.classList.contains("subhead")) {
					c.removeAttribute("style");
				}
			}
		}

		openedGroups.push(type);
	}
};

const createChild = (
	parent: HTMLDivElement,
	name: string,
	onClick: () => void,
) => {
	const newChild = document.createElement("div");
	newChild.innerText = name;
	newChild.classList.add("subhead");
	newChild.style.display = "none";
	newChild.onclick = onClick;
	parent.appendChild(newChild);
};

const createHead = (parent: HTMLDivElement, name: PageType) => {
	const newChild = document.createElement("div");
	newChild.innerText = name;
	newChild.classList.add("head");
	if (!eventListenersAdded.includes(name)) {
		newChild.addEventListener("click", (evt) => {
			eventListener(name, evt);
		});
	}

	parent.appendChild(newChild);
};

export const initializeSideBarMeta = (
	headers: WadFileInfo<WadHeader>[],
	directory: WadFileInfo<WadDirectoryEntry>[],
	mapGroups: WadMapGroupList,
) => {
	const metaSection = document.getElementById("section-meta") as
		| HTMLDivElement
		| undefined;
	if (!metaSection) {
		return;
	}

	if (
		headers.some((h) => h.type !== WadType.UNKNOWN) ||
		directory.length > 0 ||
		mapGroups.length > 0
	) {
		metaSection.innerHTML = "";
		metaSection.style.removeProperty("display");
		removeFromOpened("Metadata");
		removeFromEventListenersAdded("Metadata");
	}

	createHead(metaSection, "Metadata");

	if (headers.some((h) => h.type !== WadType.UNKNOWN)) {
		createChild(metaSection, "HEADER", () => {
			switchContentModule("header");
		});
	}

	if (directory.length > 0) {
		createChild(metaSection, "DIRECTORY", () => {
			switchContentModule("directory");
		});
	}

	if (mapGroups.length > 0) {
		createChild(metaSection, "MAP GROUPS", () => {
			switchContentModule("mapgroup");
		});
	}

	createChild(metaSection, "LOG", () => {
		switchContentModule("log");
	});
};

export const initializeSideBarMisc = (
	endoom: WadFileInfo<WadEndoom>[],
	dehacked: WadDehacked | null,
) => {
	const miscSection = document.getElementById("section-misc") as
		| HTMLDivElement
		| undefined;
	if (!miscSection) {
		return;
	}

	if (endoom.length > 0 || dehacked?.dehackedString) {
		miscSection.innerHTML = "";
		miscSection.style.removeProperty("display");
		removeFromOpened("Misc");
		removeFromEventListenersAdded("Misc");
	} else {
		miscSection.style.display = "none";
	}

	createHead(miscSection, "Misc");

	if (endoom.length > 0) {
		createChild(miscSection, "ENDOOM", () => {
			switchContentModule("endoom");
		});
	}

	if (dehacked?.dehackedString) {
		createChild(miscSection, "DEHACKED", () => {
			switchContentModule("dehacked");
		});
	}
};

export const initializeSideBarColors = (
	playpals: WadFileInfo<WadPlaypal>[],
	colormaps: WadFileInfo<WadColorMap>[],
) => {
	const colorSection = document.getElementById("section-colors") as
		| HTMLDivElement
		| undefined;
	if (!colorSection) {
		return;
	}

	if (
		playpals.some((p) => p.typedPlaypal.length > 0) ||
		colormaps.some((c) => c.data.length > 0)
	) {
		colorSection.innerHTML = "";
		colorSection.style.removeProperty("display");
		removeFromOpened("Colors");
		removeFromEventListenersAdded("Colors");
	} else {
		colorSection.style.display = "none";
	}

	createHead(colorSection, "Colors");

	if (playpals.some((p) => p.typedPlaypal.length > 0)) {
		createChild(colorSection, "PLAYPAL", () => {
			switchContentModule("playpal");
		});
	}

	if (colormaps.some((c) => c.data.length > 0)) {
		createChild(colorSection, "COLORMAP", () => {
			switchContentModule("colormap");
		});
	}
};

export const initializeSideBarMaps = (maps: WadMapList) => {
	const mapSection = document.getElementById("section-maps") as
		| HTMLDivElement
		| undefined;
	if (!mapSection) {
		return;
	}

	if (maps.length > 0) {
		mapSection.innerHTML = "";
		mapSection.style.removeProperty("display");
		removeFromOpened("Maps");
		removeFromEventListenersAdded("Maps");
		createHead(mapSection, "Maps");

		for (const m of maps) {
			createChild(mapSection, m.name, () => {
				switchContentModule("map", { mapName: m.name });
			});
		}
	} else {
		mapSection.innerHTML = "";
		mapSection.style.display = "none";
	}
};

export const initializeSideBarTextures = (
	textures: WadTextures | null,
	flats: WadFlat[] | null,
	sprites: WadSprite[] | null,
	menuGraphics: WadMenuGraphic[] | null,
	stbarGraphics: WadStbarGraphic[] | null,
) => {
	const textureSection = document.getElementById("section-textures") as
		| HTMLDivElement
		| undefined;
	if (!textureSection) {
		return;
	}

	const hasTextures =
		textures &&
		(textures.patchNames.length > 0 ||
			textures.texture1.length > 0 ||
			textures.texture2.length > 0);
	const hasFlats = flats && flats.length > 0;
	const hasSprites = sprites && sprites.length > 0;
	const hasMenuGraphics = menuGraphics && menuGraphics.length > 0;
	const hasStbarGraphics = stbarGraphics && stbarGraphics.length > 0;

	if (
		hasTextures ||
		hasFlats ||
		hasSprites ||
		hasMenuGraphics ||
		hasStbarGraphics
	) {
		textureSection.innerHTML = "";
		textureSection.style.removeProperty("display");
		removeFromOpened("Images");
		removeFromEventListenersAdded("Images");
		createHead(textureSection, "Images");
	} else {
		textureSection.style.display = "none";
	}

	if (hasTextures) {
		createChild(textureSection, "PATCHES & TEXTURES", () => {
			switchContentModule("patches");
		});
	}

	if (hasFlats) {
		createChild(textureSection, "FLATS", () => {
			switchContentModule("flats");
		});
	}

	if (hasSprites) {
		createChild(textureSection, "SPRITES", () => {
			switchContentModule("sprites");
		});
	}

	if (hasMenuGraphics) {
		createChild(textureSection, "MENU GRAPHICS", () => {
			switchContentModule("menuGraphics");
		});
	}

	if (hasStbarGraphics) {
		createChild(textureSection, "STBAR GRAPHICS", () => {
			switchContentModule("stbarGraphics");
		});
	}
};

export const initializeSideBarMusic = (music: WadMusic[] | null) => {
	const musicSection = document.getElementById("section-music") as
		| HTMLDivElement
		| undefined;
	if (!musicSection) {
		return;
	}

	if (music && music.length > 0) {
		musicSection.innerHTML = "";
		musicSection.style.removeProperty("display");
		removeFromOpened("Music");
		removeFromEventListenersAdded("Music");
		createHead(musicSection, "Music");

		createChild(musicSection, "MUSIC", () => {
			switchContentModule("music");
		});
	} else {
		musicSection.innerHTML = "";
		musicSection.style.display = "none";
	}
};

export const initializeSideBarAttributions = () => {
	const attributionsSection = document.getElementById("section-attributions") as
		| HTMLDivElement
		| undefined;
	if (!attributionsSection) {
		return;
	}

	attributionsSection.innerHTML = "";
	attributionsSection.style.removeProperty("display");
	removeFromOpened("Attributions");
	removeFromEventListenersAdded("Attributions");
	createHead(attributionsSection, "Attributions");

	createChild(attributionsSection, "ATTRIBUTIONS", () => {
		switchContentModule("attributions");
	});
};
