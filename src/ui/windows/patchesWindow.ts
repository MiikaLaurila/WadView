import { getPlaypal, getTextures } from '../..';
import { WadPatch } from '../../interfaces/wad/texture/WadPatch';
import { WadTexture, WadTexturePatch, WadTextures } from '../../interfaces/wad/texture/WadTextures';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';
import { createModal } from '../other/modal';

const containerId = 'patches-window-container';
const splitContainerClass = 'patches-split-container';
const dataContainerClass = 'patches-data-container';
const infoContainerClass = 'patches-info-container';
const canvasContainerClass = 'patches-canvas-container';
const textureCellText = 'patches-texture-cell';

let textures: WadTextures;

const writePatchToImageData = (patch: WadPatch, imageData: ImageData) => {
    const playpal = getPlaypal();
    if (!playpal) {
        console.log('no playpal to draw patch with');
        return;
    }

    patch.columns.forEach((columnData, idx) => {
        columnData.forEach((post) => {
            const width = patch.width;
            const columnStart = idx * 4 + post.yOffset * width * 4;

            for (let i = 0; i < post.data.length; i++) {
                const pixelPos = columnStart + i * width * 4;
                imageData.data[pixelPos] = playpal.typedPlaypal[0][post.data[i]].r;
                imageData.data[pixelPos + 1] = playpal.typedPlaypal[0][post.data[i]].g;
                imageData.data[pixelPos + 2] = playpal.typedPlaypal[0][post.data[i]].b;
                imageData.data[pixelPos + 3] = 255;
            }
        });
    });
};

const writePatchToTextureImageData = (
    patch: WadPatch,
    imageData: ImageData,
    texture: WadTexture,
    texturePatch: WadTexturePatch,
) => {
    const playpal = getPlaypal();
    if (!playpal) {
        console.log('no playpal to draw patch with');
        return;
    }

    patch.columns.forEach((columnData, idx) => {
        columnData.forEach((post) => {
            const width = imageData.width;
            const texOffsetX = texturePatch.xOffset * 4;
            const texOffsetY = texturePatch.yOffset * 4;

            // Basic column start pos for image
            // Then move start pos to centered cell of the 3x3 grid of image data
            const columnStart =
                texOffsetX +
                texOffsetY * width +
                idx * 4 +
                post.yOffset * width * 4 +
                width * 4 * texture.height +
                texture.width * 4;

            for (let i = 0; i < post.data.length; i++) {
                const pixelPos = columnStart + i * width * 4;
                imageData.data[pixelPos] = playpal.typedPlaypal[0][post.data[i]].r;
                imageData.data[pixelPos + 1] = playpal.typedPlaypal[0][post.data[i]].g;
                imageData.data[pixelPos + 2] = playpal.typedPlaypal[0][post.data[i]].b;
                imageData.data[pixelPos + 3] = 255;
            }
        });
    });
};

const getPreview = (patch: WadPatch, addModalListener = true, scale = 1) => {
    const cell = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.height = patch.height * scale;
    canvas.width = patch.width * scale;
    cell.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.log('noctx');
        return cell;
    }

    const imageData = ctx.createImageData(patch.width, patch.height, { colorSpace: 'srgb' });
    writePatchToImageData(patch, imageData);
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(imageData, 0, 0);

    if (scale !== 1) {
        const img = new Image();
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
        };
        img.src = canvas.toDataURL();
    }

    if (addModalListener) {
        canvas.addEventListener('click', () => {
            drawPatchModal(patch);
        });
    }
    return cell;
};

const getTexture = (texture: WadTexture) => {
    const cell = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.height = texture.height * 4;
    canvas.width = texture.width * 4;
    cell.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.log('noctx');
        return cell;
    }

    const imageData = ctx.createImageData(texture.width * 3, texture.height * 3, { colorSpace: 'srgb' });

    texture.patches.forEach((texPatch) => {
        const patchName = textures.patchNames[texPatch.patchNum];
        const patch = textures.patches[patchName];
        if (patch) writePatchToTextureImageData(patch, imageData, texture, texPatch);
    });

    ctx.imageSmoothingEnabled = false;

    ctx.putImageData(
        imageData,
        -texture.width,
        -texture.height,
        texture.width,
        texture.height,
        texture.width,
        texture.height,
    );

    const img = new Image();
    img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(4, 4);
        ctx.drawImage(img, 0, 0);
    };
    img.src = canvas.toDataURL();

    return cell;
};

export const initPatchesWindowModule = () => {
    setTopBarPageName('PATCHES');
    const tempTextures = getTextures();
    if (!tempTextures) return;
    textures = tempTextures;

    const baseModule = createModule('patches');

    const infoText = document.createElement('h1');
    infoText.innerText = `Patch names in PNAMES that don't have a corresponding patch entry in the WAD are omitted`;
    infoText.style.paddingLeft = '8px';
    infoText.style.textDecoration = 'underline';
    baseModule.appendChild(infoText);

    const container = document.createElement('div');
    container.id = containerId;
    container.classList.add('patches-container');
    baseModule.appendChild(container);

    [...textures.patchNames]
        .map((n, i) => {
            return { name: n, idx: i };
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((pname) => {
            const patch = textures.patches[pname.name];
            if (!patch) return;

            const splitContainer = document.createElement('div');
            splitContainer.className = splitContainerClass;

            const getCell = (text: string | number) => {
                const cell = document.createElement('div');
                cell.innerHTML = text.toString();
                return cell;
            };

            const getTextureCell = (text: string | number, texture: WadTexture) => {
                const cell = document.createElement('div');
                const textSpan = document.createElement('span');
                textSpan.className = textureCellText;
                textSpan.onclick = () => {
                    drawTextureModal(texture);
                };
                textSpan.innerText = text.toString();
                cell.appendChild(textSpan);
                return cell;
            };

            const pnameRow = document.createElement('div');
            pnameRow.style.fontWeight = 'bold';
            pnameRow.appendChild(getCell(pname.name));
            splitContainer.appendChild(pnameRow);

            const dataContainer = document.createElement('div');
            dataContainer.className = dataContainerClass;

            const textures1WithPname = textures.texture1.filter((t) => t.patches.find((p) => p.patchNum === pname.idx));
            const textures2WithPname = textures.texture2.filter((t) => t.patches.find((p) => p.patchNum === pname.idx));

            const infoContainer = document.createElement('div');
            infoContainer.className = infoContainerClass;
            const headerRow = document.createElement('div');
            headerRow.style.fontWeight = 'bold';
            headerRow.appendChild(getCell('texture'));
            headerRow.appendChild(getCell('lump'));
            infoContainer.appendChild(headerRow);

            textures1WithPname.forEach((entry) => {
                const row = document.createElement('div');
                row.appendChild(getTextureCell(entry.name, entry));
                row.appendChild(getCell('TEXTURE1'));
                infoContainer.appendChild(row);
            });

            textures2WithPname.forEach((entry) => {
                const row = document.createElement('div');
                row.appendChild(getTextureCell(entry.name, entry));
                row.appendChild(getCell('TEXTURE2'));
                infoContainer.appendChild(row);
            });

            dataContainer.appendChild(infoContainer);

            const canvasContainer = document.createElement('div');
            canvasContainer.className = canvasContainerClass;
            const canvasHeaderRow = document.createElement('div');
            canvasHeaderRow.style.fontWeight = 'bold';
            canvasHeaderRow.appendChild(getCell('preview'));
            canvasContainer.appendChild(canvasHeaderRow);

            if (patch) canvasContainer.appendChild(getPreview(patch));

            dataContainer.appendChild(canvasContainer);

            splitContainer.appendChild(dataContainer);
            container.appendChild(splitContainer);
        });
};

const drawPatchModal = (patch: WadPatch) => {
    const patchContent = document.createElement('div');
    patchContent.style.border = '1px solid white';
    patchContent.appendChild(getPreview(patch, false, 4));
    createModal('patch-view', patchContent);
};

const drawTextureModal = (texture: WadTexture) => {
    const textureContent = document.createElement('div');
    textureContent.style.border = '1px solid white';
    textureContent.appendChild(getTexture(texture));
    createModal('texture-view', textureContent);
};
