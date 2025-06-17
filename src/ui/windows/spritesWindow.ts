import {
	preFilledPlaypal,
	type WadPatch,
	type WadPatchPost,
	type WadSprite,
	type WadSpriteFrame,
} from "wadview-lib";
import { getPlaypals, getSprites } from "../..";
import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";
import { createModal } from "../other/modal";

const containerId = "sprites-window-container";
const splitContainerClass = "sprites-split-container";
const dataContainerClass = "sprites-data-container";
const canvasContainerClass = "sprites-canvas-container";
const sliderContainerClass = "sprites-slider-container";
const checkboxContainerClass = "sprites-checkbox-container";
const checkBoxLabelClass = "sprites-checkbox-label";

type SpriteGroupAnimation = {
	name: string;
	frames: { idx: string; data: WadPatch; mirrored: boolean }[];
};
type SpriteGroup = {
	name: string;
	scale: number;
	animations: SpriteGroupAnimation[];
};

let sprites: WadSprite[];

let checkBoxSelections: {
	spriteName: string;
	selectedBox: HTMLInputElement;
}[] = [];

let canvasContainers: {
	spriteGroup: SpriteGroup;
	canvasContainer: HTMLDivElement;
}[] = [];

let sliders: {
	spriteName: string;
	currentAnimation: SpriteGroupAnimation;
	slider: HTMLInputElement;
}[] = [];

const wantedMaxDim = 128;

const writePatchToImageData = (
	patch: WadPatch,
	imageData: ImageData,
	scale: number,
	mirrored = false,
) => {
	const playpal = getPlaypals()[0] ?? preFilledPlaypal;
	if (!playpal) {
		console.log("no playpal to draw patch with");
		return;
	}

	const scaledColumns = patch.columns
		.map((columnData) => {
			return columnData.map((col) => {
				return {
					yOffset: col.yOffset * scale,
					data: col.data.flatMap((i) => Array(scale).fill(i)),
				} as WadPatchPost;
			});
		})
		.flatMap((i) => Array(scale).fill(i) as WadPatchPost[][]);

	if (mirrored) {
		scaledColumns.reverse();
	}

	scaledColumns.forEach((columnData, idx) => {
		for (const post of columnData) {
			const width = patch.width * scale;
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
	spriteAnimation: SpriteGroupAnimation | undefined,
	frameIdx: number,
	addModalListener = true,
	scale = 1,
) => {
	if (!spriteAnimation) return null;
	if (frameIdx > spriteAnimation.frames.length - 1) return null;
	const frame = spriteAnimation.frames[frameIdx];
	if (!frame) return null;

	const trueScale = Math.floor(scale);
	const height = frame.data.height * trueScale;
	const width = frame.data.width * trueScale;

	const cell = document.createElement("div");
	const canvas = document.createElement("canvas");
	canvas.height = height;
	canvas.width = width;
	cell.appendChild(canvas);

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		console.log("noctx");
		return cell;
	}

	const imageData = ctx.createImageData(width, height, {
		colorSpace: "srgb",
	});
	writePatchToImageData(frame.data, imageData, trueScale, frame.mirrored);
	ctx.imageSmoothingEnabled = false;
	ctx.putImageData(imageData, 0, 0);

	if (addModalListener) {
		canvas.addEventListener("click", () => {
			drawPatchModal(spriteAnimation, frameIdx, trueScale);
		});
	}
	return cell;
};

const getSlider = (
	spriteName: string,
	animation: SpriteGroupAnimation,
	frameIdx: number,
): HTMLDivElement => {
	const sliderContainer = document.createElement("div");
	sliderContainer.className = sliderContainerClass;
	const slider = document.createElement("input");
	slider.type = "range";
	slider.min = "0";
	slider.max = (animation.frames.length - 1).toString() ?? "0";
	slider.value = frameIdx.toString();
	slider.addEventListener("input", (evt: Event) => {
		const sliderInfo = sliders.find((s) => s.spriteName === spriteName);
		if (!sliderInfo) return;
		updatePreview(
			spriteName,
			sliderInfo.currentAnimation.name,
			Number((evt.target as HTMLInputElement).value),
		);
	});
	sliders.push({
		spriteName,
		currentAnimation: animation,
		slider,
	});
	sliderContainer.appendChild(slider);
	return sliderContainer;
};

export const disposeSpritesWindowModule = () => {
	checkBoxSelections = [];
	canvasContainers = [];
	sliders = [];
};

export const initSpritesWindowModule = () => {
	setTopBarPageName("SPRITES");
	const tempSprites = getSprites();
	if (!tempSprites) return;
	sprites = tempSprites;

	const baseModule = createModule("sprites");

	const container = document.createElement("div");
	container.id = containerId;
	container.classList.add("sprites-container");
	baseModule.appendChild(container);

	const getCell = (text: string | number) => {
		const cell = document.createElement("div");
		cell.innerHTML = text.toString();
		return cell;
	};

	const calcScale = (frames: WadSpriteFrame[]) => {
		const maxHeight = Math.max(...frames.map((f) => f.data.height));
		const maxWidth = Math.max(...frames.map((f) => f.data.width));
		const maxDim = Math.max(maxHeight, maxWidth);
		return Math.round(Math.ceil(wantedMaxDim / maxDim));
	};

	const spriteGroups = sprites.reduce(
		(prev: SpriteGroup[], curr: WadSprite) => {
			const previousGroup = prev.find((grp) => grp.name === curr.name);
			if (previousGroup) {
				const oldScale = previousGroup.scale;
				const newScale = calcScale(curr.frames);
				if (newScale < oldScale) previousGroup.scale = newScale;
				previousGroup.animations.push({
					name: curr.animation,
					frames: curr.frames,
				});
			} else {
				prev.push({
					name: curr.name,
					scale: calcScale(curr.frames),
					animations: [
						{
							name: curr.animation,
							frames: curr.frames,
						},
					],
				});
			}
			return prev;
		},
		[] as SpriteGroup[],
	);

	const getCheckBox = (
		spriteName: string,
		animName: string,
		selected: boolean,
	) => {
		const container = document.createElement("div");

		const checkBox = document.createElement("input");
		checkBox.type = "checkbox";
		checkBox.id = `${spriteName}_${animName}`;
		checkBox.value = animName;
		checkBox.checked = selected;
		checkBox.addEventListener("click", (evt) => {
			const currentSelection = checkBoxSelections.find(
				(sel) => sel.spriteName === spriteName,
			);
			if (!currentSelection) return;
			if (evt.target === currentSelection?.selectedBox) {
				currentSelection.selectedBox.checked = true;
			} else {
				currentSelection.selectedBox.checked = false;
				currentSelection.selectedBox = evt.target as HTMLInputElement;
			}
			updatePreview(spriteName, animName);
		});

		const label = document.createElement("label");
		label.htmlFor = `${spriteName}_${animName}`;
		label.innerText = `${spriteName}${animName}`;
		label.className = checkBoxLabelClass;

		container.appendChild(checkBox);
		container.appendChild(label);

		if (selected) {
			checkBoxSelections.push({ spriteName, selectedBox: checkBox });
		}

		return container;
	};

	for (const spriteGroup of spriteGroups) {
		const splitContainer = document.createElement("div");
		splitContainer.className = splitContainerClass;

		const spriteNameRow = document.createElement("div");
		spriteNameRow.style.fontWeight = "bold";
		spriteNameRow.appendChild(getCell(spriteGroup.name));
		splitContainer.appendChild(spriteNameRow);

		const dataContainer = document.createElement("div");
		dataContainer.className = dataContainerClass;

		const checkBoxContainer = document.createElement("div");
		checkBoxContainer.className = checkboxContainerClass;
		spriteGroup.animations.forEach((anim, idx) => {
			checkBoxContainer.appendChild(
				getCheckBox(spriteGroup.name, anim.name, idx === 0),
			);
		});
		dataContainer.appendChild(checkBoxContainer);

		const canvasContainer = document.createElement("div");
		canvasContainer.className = canvasContainerClass;

		const currentSelection = checkBoxSelections.find(
			(sel) => sel.spriteName === spriteGroup.name,
		);
		const currentAnimation = spriteGroup.animations.find(
			(a) => a.name === currentSelection?.selectedBox.value,
		);

		const preview = getPreview(currentAnimation, 0, true, spriteGroup.scale);

		if (preview) {
			const canvasArr = Array.from(preview.getElementsByTagName("canvas"));
			if (canvasArr.length > 0) {
				if (canvasArr[0].width > 256)
					canvasContainer.style.width = `${canvasArr[0].width}px`;
				if (canvasArr[0].height > 256)
					canvasContainer.style.height = `${canvasArr[0].height}px`;
			}
			canvasContainer.appendChild(preview);
		}
		if (currentAnimation && currentAnimation.frames.length > 1) {
			canvasContainer.appendChild(
				getSlider(spriteGroup.name, currentAnimation, 0),
			);
		}
		canvasContainers.push({ spriteGroup, canvasContainer });

		dataContainer.appendChild(canvasContainer);
		splitContainer.appendChild(dataContainer);

		container.appendChild(splitContainer);
	}
};

const updatePreview = (
	spriteName: string,
	newAnimationName: string,
	frameIdx?: number,
) => {
	const currentCanvasContainer = canvasContainers.find(
		(c) => c.spriteGroup.name === spriteName,
	);
	if (!currentCanvasContainer) return;

	const newAnim = currentCanvasContainer.spriteGroup.animations.find(
		(a) => a.name === newAnimationName,
	);
	if (!newAnim) return;

	const newPreview = getPreview(
		newAnim,
		frameIdx ?? 0,
		true,
		currentCanvasContainer.spriteGroup.scale,
	);
	if (!newPreview) return;

	const currentCanvas = currentCanvasContainer.canvasContainer.firstChild;
	if (currentCanvas)
		currentCanvasContainer.canvasContainer.removeChild(currentCanvas);

	currentCanvasContainer.canvasContainer.prepend(newPreview);
	const currentSlider = sliders.find(
		(slider) => slider.spriteName === spriteName,
	);
	if (currentSlider && currentSlider.currentAnimation.name !== newAnim.name) {
		currentSlider.currentAnimation = newAnim;
		if (newAnim.frames.length === 1) {
			currentSlider.slider.style.visibility = "hidden";
		} else {
			currentSlider.slider.style.visibility = "initial";
		}
		currentSlider.slider.value = "0";
		currentSlider.slider.max = (newAnim.frames.length - 1).toString();
	}
};

const drawPatchModal = (
	animation: SpriteGroupAnimation,
	frameIdx: number,
	originalScale: number,
) => {
	const spriteContent = document.createElement("div");
	spriteContent.style.border = "1px solid white";
	const preview = getPreview(animation, frameIdx, false, originalScale * 2);
	if (preview) spriteContent.appendChild(preview);
	createModal("sprite-view", spriteContent);
};
