import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";

interface Attribution {
	project: string;
	author: string;
	text: string;
	link: string;
	license: string;
	modificationsMade: string[] | string;
}

const attributions: Attribution[] = [
	{
		project: "js-mod-player",
		author: "Anders Tornblad (atornblad)",
		text: "",
		link: "https://github.com/atornblad/js-mod-player",
		license: "https://github.com/atornblad/js-mod-player/blob/main/LICENSE.md",
		modificationsMade: [
			"- Added type definitions",
			"- Added functionality to load straight from a buffer",
			"- Added global CustomEvent dispatchers to row and stop messages from AudioWorklet",
			"- Added ability to enable subscriptions by default to allow listening to CustomEvents",
			"- Modified default behaviour to stop playback after mod ends",
		],
	},
	{
		project: "mus2midi",
		author: "Gareth Williams (gareththegeek)",
		text: "",
		link: "https://github.com/gareththegeek/mus2midi",
		license: "https://github.com/gareththegeek/mus2midi/blob/main/LICENSE",
		modificationsMade: [
			"- Modified event generation to log errors instead of throwing an error",
		],
	},
	{
		project: "timidity (not affiliated with timidity++)",
		author: "Feross Aboukhadijeh (feross)",
		text: "",
		link: "https://github.com/feross/timidity",
		license: "https://github.com/feross/timidity/blob/master/LICENSE",
		modificationsMade: [
			"- Added partial typings to libtimidity.js and bindings of libtimidity.wasm",
			"- Took original timidity.js and converted it to TypeScript",
			"- Changed (badly) the way Audio is played to use AudioWorklets and created " +
				"midiAudioProcessor.js to consume and play buffers created by timidity.ts",
			"- Modified original timidity.cfg to one used by eawpats and hard coded loading " +
				"of additional .cfg files used by the master config",
		],
	},
	{
		project: "eawpats",
		author: "Eric A. Welsh (for compiling the package)",
		text:
			"I can't find sources for the original patches, so attribution goes to Eric A. Welsh " +
			"for compiling the package. Most of the patches are in public domain, but ones detailed in the " +
			"email from Andrew Suffield (license link) define the ones that are for non-commercial use only. " +
			"The actual license for these patches is unknown.",
		link: "https://www.doomworld.com/idgames/sounds/eawpats",
		license: "https://lists.debian.org/debian-legal/2002/09/msg00137.html",
		modificationsMade: "",
	},
	{
		project: "pixijs v6",
		author: "pixijs",
		text: "",
		link: "https://github.com/pixijs/pixijs",
		license: "https://github.com/pixijs/pixijs/blob/dev/LICENSE",
		modificationsMade: "",
	},
	{
		project: "ttf-moderndos",
		author: "Jayvee Enaguas (HarvettFox96)",
		text: "",
		link: "https://notabug.org/HarvettFox96/ttf-moderndos",
		license:
			"https://notabug.org/HarvettFox96/ttf-moderndos/src/master/LICENSE",
		modificationsMade: "",
	},
	{
		project: "RobotoMono-Regular",
		author: "Christian Robertson",
		text: "",
		link: "https://fonts.google.com/specimen/Roboto+Mono",
		license: "https://fonts.google.com/specimen/Roboto+Mono/license",
		modificationsMade: "",
	},
	{
		project: "DOOM1.WAD",
		author: "id Software",
		text: "Distributed as shareware",
		link: "",
		license: "",
		modificationsMade: "",
	},
];

const attributionsContainerId = "attributions-container";
const attributionItemClassName = "attribution-item";
const attributionLabelClassName = "attribution-label";
const attributionValueClassName = "attribution-value";

function renderAttributions(windowContainer: HTMLDivElement) {
	for (const attr of attributions) {
		const item = document.createElement("div");
		item.className = attributionItemClassName;

		const createItem = (label: string, value: string | string[]) => {
			if (value === "") return null;

			const p = document.createElement("p");
			if (label) {
				const labelSpan = document.createElement("span");
				labelSpan.className = attributionLabelClassName;
				labelSpan.textContent = `${label}: `;
				p.appendChild(labelSpan);
			}

			const valueSpan = document.createElement("span");
			valueSpan.className = attributionValueClassName;
			if (typeof value === "string") {
				valueSpan.textContent = value;
			} else {
				valueSpan.textContent = `\n${value.join("\n")}`;
			}

			p.appendChild(valueSpan);
			return p;
		};

		const createLinkItem = (label: string, value: string) => {
			if (value === "") return null;
			const p = document.createElement("p");
			const labelSpan = document.createElement("span");
			labelSpan.className = attributionLabelClassName;
			labelSpan.textContent = `${label}: `;

			const link = document.createElement("a");
			link.href = value;
			link.textContent = value;
			link.target = "_blank";
			link.rel = "noopener noreferrer";

			p.appendChild(labelSpan);
			p.appendChild(link);
			item.appendChild(p);
			return p;
		};

		const project = createItem("Project", attr.project);
		if (project) item.appendChild(project);

		const author = createItem("Author", attr.author);
		if (author) item.appendChild(author);

		const link = createLinkItem("Link", attr.link);
		if (link) item.appendChild(link);

		const license = createLinkItem("License", attr.license);
		if (license) item.appendChild(license);

		const mods = createItem("Modifications", attr.modificationsMade);
		if (mods) item.appendChild(mods);

		const text = createItem("", attr.text);
		if (text) item.appendChild(text);
		windowContainer.appendChild(item);
	}
}

export function initAttributionsWindow() {
	setTopBarPageName("Attributions");

	const baseModule = createModule("attributions");

	const attributionsContainer = document.createElement("div");
	attributionsContainer.id = attributionsContainerId;

	renderAttributions(attributionsContainer);
	baseModule.appendChild(attributionsContainer);
}
