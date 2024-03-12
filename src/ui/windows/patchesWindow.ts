import { getColormap, getPlaypal, getTextures } from '../..';
import { WadPatch } from '../../interfaces/wad/texture/WadPatch';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';
import { createModal } from '../other/modal';

const containerId = 'patches-window-container';
const splitContainerClass = 'patches-split-container';
const dataContainerClass = 'patches-data-container';
const infoContainerClass = 'patches-info-container';
const canvasContainerClass = 'patches-canvas-container';

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

    const playpal = getPlaypal();
    if (!playpal) {
        console.log('noplaypal');
        return cell;
    }

    const imageData = ctx.createImageData(patch.width, patch.height, { colorSpace: 'srgb' });
    patch.columns.forEach((columnData, idx) => {
        const start = patch.width * idx + columnData.yOffset;
        for (let i = 0; i < columnData.data.length; i++) {
            imageData.data[start + i * 4] = playpal.typedPlaypal[0][columnData.data[i]].r;
            imageData.data[start + i * 4 + 1] = playpal.typedPlaypal[0][columnData.data[i]].g;
            imageData.data[start + i * 4 + 2] = playpal.typedPlaypal[0][columnData.data[i]].b;
            imageData.data[start + i * 4 + 3] = 255;
        }
    });
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(imageData, 0, 0);

    if (scale !== 1) {
        const img = new Image();
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
        }
        img.src = canvas.toDataURL();
    }

    if (addModalListener) {
        canvas.addEventListener('click', () => {
            drawModal(patch);
        });
    }
    return cell;
}

export const initPatchesWindowModule = () => {
    setTopBarPageName('PATCHES');
    const textures = getTextures();
    if (!textures) return;

    const baseModule = createModule('patches');

    const container = document.createElement('div');
    container.id = containerId;
    container.classList.add('patches-container');
    baseModule.appendChild(container);

    textures.patchNames.forEach((pname, idx) => {
        const splitContainer = document.createElement('div');
        splitContainer.className = splitContainerClass;

        const getCell = (text: string | number) => {
            const cell = document.createElement('div');
            cell.innerHTML = text.toString();
            return cell;
        };

        const pnameRow = document.createElement('div');
        pnameRow.style.fontWeight = 'bold';
        pnameRow.appendChild(getCell(pname));
        splitContainer.appendChild(pnameRow);

        const dataContainer = document.createElement('div');
        dataContainer.className = dataContainerClass;

        const textures1WithPname = textures.texture1.filter((t) => t.patches.find((p) => p.patchNum === idx));
        const textures2WithPname = textures.texture2.filter((t) => t.patches.find((p) => p.patchNum === idx));

        const infoContainer = document.createElement('div');
        infoContainer.className = infoContainerClass;
        const headerRow = document.createElement('div');
        headerRow.style.fontWeight = 'bold';
        headerRow.appendChild(getCell('texture'));
        headerRow.appendChild(getCell('lump'));
        infoContainer.appendChild(headerRow);

        textures1WithPname.forEach((entry) => {
            const row = document.createElement('div');
            row.appendChild(getCell(entry.name));
            row.appendChild(getCell('TEXTURE1'));
            infoContainer.appendChild(row);
        });

        textures2WithPname.forEach((entry) => {
            const row = document.createElement('div');
            row.appendChild(getCell(entry.name));
            row.appendChild(getCell('TEXTURE2'));
            infoContainer.appendChild(row);
        });

        dataContainer.appendChild(infoContainer);

        const patch = textures.patches[pname];
        const canvasContainer = document.createElement('div');
        canvasContainer.className = canvasContainerClass;
        const canvasHeaderRow = document.createElement('div');
        canvasHeaderRow.style.fontWeight = 'bold';
        canvasHeaderRow.appendChild(getCell('preview'));
        canvasContainer.appendChild(canvasHeaderRow);

        if (patch) canvasContainer.appendChild(getPreview(patch))

        dataContainer.appendChild(canvasContainer);

        splitContainer.appendChild(dataContainer);
        container.appendChild(splitContainer);
    });
};

const drawModal = (patch: WadPatch) => {
    const patchContent = document.createElement('div');
    patchContent.style.border = '1px solid white';
    patchContent.appendChild(getPreview(patch, false, 4));
    createModal('patch-view', patchContent);
}
