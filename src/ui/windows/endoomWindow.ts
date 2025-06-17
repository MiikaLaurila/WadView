import type { WadEndoom, WadFileInfo } from "wadview-lib";
import { getEndooms } from "../..";
import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";

const containerId = "endoom-window-container";

let endooms: WadFileInfo<WadEndoom>[] = [];
let blinkCycles: number[] = [];
let blinkPhase: "on" | "off" = "on";
const scale = 1;
const charW = 8 * scale;
const charH = 16 * scale;
const fontSize = 16 * scale;
export const initEndoomWindowModule = () => {
	setTopBarPageName("Endoom");
	endooms = getEndooms();

	const baseModule = createModule("endoom");

	const container = document.createElement("div");
	container.id = containerId;
	baseModule.appendChild(container);

	for (const endoom of endooms) {
		const endoomCanvas = document.createElement("canvas");
		endoomCanvas.width = 640;
		endoomCanvas.height = 400;

		const ctx = endoomCanvas.getContext("2d");
		if (!ctx) return;
		ctx.imageSmoothingEnabled = false;
		ctx.textRendering = "geometricPrecision";
		ctx.font = `lighter ${fontSize}px DOS`;
		ctx.textBaseline = "bottom";

		const w = charW;
		const h = charH;

		const drawCanvas = (blinkPhase: "on" | "off") => {
			endoom.data.forEach((c, idx) => {
				const col = idx % 80;
				const row = Math.floor(idx / 80);
				const x = col * w;
				const y = (row + 1) * h;

				ctx.fillStyle = c.backgroundColor;
				ctx.fillRect(x, row * h, w, h);
			});
			endoom.data.forEach((c, idx) => {
				const col = idx % 80;
				const row = Math.floor(idx / 80);
				const x = col * w;
				const y = (row + 1) * h;
				if (c.blink && blinkPhase === "off") {
					ctx.fillStyle = c.backgroundColor;
				} else {
					ctx.fillStyle = c.foregroundColor;
				}
				ctx.fillText(c.char, x, y);
			});
		};

		drawCanvas(blinkPhase);

		blinkCycles.push(
			window.setInterval(() => {
				if (blinkPhase === "on") blinkPhase = "off";
				else blinkPhase = "on";
				drawCanvas(blinkPhase);
			}, 1000),
		);

		container.appendChild(endoomCanvas);
	}
};

export const disposeEndoomModule = () => {
	for (const c of blinkCycles) {
		clearInterval(c);
	}
	blinkCycles = [];
};
