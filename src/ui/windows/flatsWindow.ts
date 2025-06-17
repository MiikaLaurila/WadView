import { preFilledPlaypal, type WadFlat } from "wadview-lib";
import { getFlats, getPlaypals } from "../..";
import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";
import { createModal } from "../other/modal";

const containerId = "flats-window-container";
const splitContainerClass = "flats-split-container";
const dataContainerClass = "flats-data-container";
const canvasContainerClass = "flats-canvas-container";

let flats: WadFlat[];

const writeFlatToImageData = (flat: WadFlat, imageData: ImageData) => {
	const playpal = getPlaypals()[0] ?? preFilledPlaypal;
	if (!playpal) {
		console.log("no playpal to draw flat with");
		return;
	}

	for (let i = 0; i < flat.pixels.length; i++) {
		const pixelPos = i * 4;
		imageData.data[pixelPos] = playpal.typedPlaypal[0][flat.pixels[i]].r;
		imageData.data[pixelPos + 1] = playpal.typedPlaypal[0][flat.pixels[i]].g;
		imageData.data[pixelPos + 2] = playpal.typedPlaypal[0][flat.pixels[i]].b;
		imageData.data[pixelPos + 3] = 255;
	}
};

const getPreview = (flat: WadFlat, addModalListener = true, scale = 1) => {
	const cell = document.createElement("div");
	const canvas = document.createElement("canvas");
	canvas.height = flat.height * scale;
	canvas.width = flat.width * scale;
	cell.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		console.log("noctx");
		return cell;
	}

	const imageData = ctx.createImageData(flat.width, flat.height, {
		colorSpace: "srgb",
	});
	writeFlatToImageData(flat, imageData);
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
			drawFlatModal(flat);
		});
	}
	return cell;
};

export const initFlatsWindowModule = () => {
	setTopBarPageName("FLATS");
	const tempFlats = getFlats();
	if (!tempFlats) return;
	flats = tempFlats;

	const baseModule = createModule("flats");

	const container = document.createElement("div");
	container.id = containerId;
	container.classList.add("flats-container");
	baseModule.appendChild(container);

	const sortedFlats = [...flats].sort((a, b) => a.name.localeCompare(b.name));

	const getCell = (text: string | number) => {
		const cell = document.createElement("div");
		cell.innerHTML = text.toString();
		return cell;
	};

	for (const flat of sortedFlats) {
		const splitContainer = document.createElement("div");
		splitContainer.className = splitContainerClass;

		const flatNameRow = document.createElement("div");
		flatNameRow.style.fontWeight = "bold";
		flatNameRow.appendChild(getCell(flat.name));
		splitContainer.appendChild(flatNameRow);

		const dataContainer = document.createElement("div");
		dataContainer.className = dataContainerClass;

		const canvasContainer = document.createElement("div");
		canvasContainer.className = canvasContainerClass;

		canvasContainer.appendChild(getPreview(flat));

		dataContainer.appendChild(canvasContainer);

		splitContainer.appendChild(dataContainer);
		container.appendChild(splitContainer);
	}
};

const drawFlatModal = (flat: WadFlat) => {
	const flatContent = document.createElement("div");
	flatContent.style.border = "1px solid white";
	flatContent.appendChild(getPreview(flat, false, 4));
	createModal("flat-view", flatContent);
};
