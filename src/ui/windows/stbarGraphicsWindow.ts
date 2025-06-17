import {
	preFilledPlaypal,
	type WadStbarGraphic,
	type WadPatch,
} from "wadview-lib";
import { getPlaypals, getStbarGraphics } from "../..";
import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";
import { createModal } from "../other/modal";

const containerId = "stbar-graphics-window-container";
const containerClass = "stbar-graphics-container";
const splitContainerClass = "stbar-graphics-split-container";
const dataContainerClass = "stbar-graphics-data-container";
const canvasContainerClass = "stbar-graphics-canvas-container";

let stbarGraphics: WadStbarGraphic[];

const writePatchToImageData = (patch: WadPatch, imageData: ImageData) => {
	const playpal = getPlaypals()[0] ?? preFilledPlaypal;
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
	stbarGraphicPatch: WadPatch,
	addModalListener = true,
	scale = 1,
) => {
	const cell = document.createElement("div");
	const canvas = document.createElement("canvas");
	canvas.height = stbarGraphicPatch.height * scale;
	canvas.width = stbarGraphicPatch.width * scale;
	cell.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		console.log("noctx");
		return cell;
	}

	const imageData = ctx.createImageData(
		stbarGraphicPatch.width,
		stbarGraphicPatch.height,
		{
			colorSpace: "srgb",
		},
	);
	writePatchToImageData(stbarGraphicPatch, imageData);
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
			drawStbarGraphicModal(stbarGraphicPatch);
		});
	}
	return cell;
};

export const initStbarGraphicsModule = () => {
	setTopBarPageName("STBAR GRAPHICS");
	const tempStbarGraphics = getStbarGraphics();
	if (!tempStbarGraphics) return;
	stbarGraphics = tempStbarGraphics;

	const baseModule = createModule("stbarGraphics");

	const container = document.createElement("div");
	container.id = containerId;
	container.classList.add(containerClass);
	baseModule.appendChild(container);

	const sortedStbarGraphics = [...stbarGraphics].sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const getCell = (text: string | number) => {
		const cell = document.createElement("div");
		cell.innerHTML = text.toString();
		return cell;
	};

	for (const stbarGraphic of sortedStbarGraphics) {
		const splitContainer = document.createElement("div");
		splitContainer.className = splitContainerClass;

		const stbarGraphicNameRow = document.createElement("div");
		stbarGraphicNameRow.style.fontWeight = "bold";
		stbarGraphicNameRow.appendChild(getCell(stbarGraphic.name));
		splitContainer.appendChild(stbarGraphicNameRow);

		const dataContainer = document.createElement("div");
		dataContainer.className = dataContainerClass;

		const canvasContainer = document.createElement("div");
		canvasContainer.className = canvasContainerClass;

		canvasContainer.appendChild(getPreview(stbarGraphic.data));

		dataContainer.appendChild(canvasContainer);

		splitContainer.appendChild(dataContainer);
		container.appendChild(splitContainer);
	}
};

const drawStbarGraphicModal = (stbarGraphicPatch: WadPatch) => {
	const stbarGraphicContent = document.createElement("div");
	stbarGraphicContent.style.border = "1px solid white";
	stbarGraphicContent.appendChild(getPreview(stbarGraphicPatch, false, 4));
	createModal("stbar-graphic-view", stbarGraphicContent);
};
