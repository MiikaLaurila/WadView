import type { WadMenuGraphic, WadPatch } from "wadview-lib";
import { getMenuGraphics, getPlaypal } from "../..";
import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";
import { createModal } from "../other/modal";

const containerId = "menu-graphics-window-container";
const splitContainerClass = "menu-graphics-split-container";
const dataContainerClass = "menu-graphics-data-container";
const canvasContainerClass = "menu-graphics-canvas-container";

let menuGraphics: WadMenuGraphic[];

const writePatchToImageData = (patch: WadPatch, imageData: ImageData) => {
	const playpal = getPlaypal();
	if (!playpal) {
		console.log("no playpal to draw patch with");
		return;
	}

	patch.columns.forEach((columnData, idx) => {
		for (const post of columnData) {
			const width = patch.width;
			const columnStart = idx * 4 + post.yOffset * width * 4;

			for (let i = 0; i < post.data.length; i++) {
				const pixelPos = columnStart + i * width * 4;
				imageData.data[pixelPos] = playpal.typedPlaypal[0][post.data[i]].r;
				imageData.data[pixelPos + 1] = playpal.typedPlaypal[0][post.data[i]].g;
				imageData.data[pixelPos + 2] = playpal.typedPlaypal[0][post.data[i]].b;
				imageData.data[pixelPos + 3] = 255;
			}
		}
	});
};

const getPreview = (
	menuGraphicPatch: WadPatch,
	addModalListener = true,
	scale = 1,
) => {
	const cell = document.createElement("div");
	const canvas = document.createElement("canvas");
	canvas.height = menuGraphicPatch.height * scale;
	canvas.width = menuGraphicPatch.width * scale;
	cell.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		console.log("noctx");
		return cell;
	}

	const imageData = ctx.createImageData(
		menuGraphicPatch.width,
		menuGraphicPatch.height,
		{
			colorSpace: "srgb",
		},
	);
	writePatchToImageData(menuGraphicPatch, imageData);
	ctx.imageSmoothingEnabled = false;
	ctx.putImageData(imageData, 0, 0);

	if (scale !== 1) {
		const img = new Image();
		img.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.scale(scale, scale);
			ctx.drawImage(img, 0, 0);
		};
		img.src = canvas.toDataURL();
	}

	if (addModalListener) {
		canvas.addEventListener("click", () => {
			drawMenuGraphicModal(menuGraphicPatch);
		});
	}
	return cell;
};

export const initMenuGraphicsModule = () => {
	setTopBarPageName("MENU GRAPHICS");
	const tempMenuGraphics = getMenuGraphics();
	if (!tempMenuGraphics) return;
	menuGraphics = tempMenuGraphics;

	const baseModule = createModule("menuGraphics");

	const container = document.createElement("div");
	container.id = containerId;
	container.classList.add("menu-graphics-container");
	baseModule.appendChild(container);

	const sortedMenuGraphics = [...menuGraphics].sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const getCell = (text: string | number) => {
		const cell = document.createElement("div");
		cell.innerHTML = text.toString();
		return cell;
	};

	for (const menuGraphic of sortedMenuGraphics) {
		const splitContainer = document.createElement("div");
		splitContainer.className = splitContainerClass;

		const menuGraphicNameRow = document.createElement("div");
		menuGraphicNameRow.style.fontWeight = "bold";
		menuGraphicNameRow.appendChild(getCell(menuGraphic.name));
		splitContainer.appendChild(menuGraphicNameRow);

		const dataContainer = document.createElement("div");
		dataContainer.className = dataContainerClass;

		const canvasContainer = document.createElement("div");
		canvasContainer.className = canvasContainerClass;

		canvasContainer.appendChild(getPreview(menuGraphic.data));

		dataContainer.appendChild(canvasContainer);

		splitContainer.appendChild(dataContainer);
		container.appendChild(splitContainer);
	}
};

const drawMenuGraphicModal = (menuGraphicPatch: WadPatch) => {
	const menuGraphicContent = document.createElement("div");
	menuGraphicContent.style.border = "1px solid white";
	menuGraphicContent.appendChild(getPreview(menuGraphicPatch, false, 4));
	createModal("menu-graphic-view", menuGraphicContent);
};
