import { getColormap, getPlaypal } from '../..';
import { WadPlaypalTypedEntry } from '../../interfaces/wad/WadPlayPal';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';


const colormapWindowId = 'colormap-window';

export const initColormapWindowModule = () => {
    const baseModule = createModule('colormap');
    const colormapWindow = document.createElement('div');
    colormapWindow.id = colormapWindowId;
    baseModule.appendChild(colormapWindow);
    setTopBarPageName('ColorMap');
    const colormap = getColormap();
    const playpal = getPlaypal();
    if (colormap && playpal) {
        playpal.typedPlaypal.forEach(e => {
            createColormapEntry(colormapWindow, colormap, e);
        });
    }
};

const createColormapEntry = (
    parent: HTMLDivElement,
    colormap: number[][],
    playpal: WadPlaypalTypedEntry
) => {
    const colorBlockSize = 3;
    const container = document.createElement('div');
    container.style.margin = '20px';

    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
        return;
    }

    canvasEl.width = 256 * colorBlockSize;
    canvasEl.height = 34 * colorBlockSize;

    colormap.forEach((e, idx) => {
        e.forEach((colorIndex, colorPos) => {
            ctx.fillStyle = playpal[colorIndex].hex;
            const xPos = (colorPos % 256) * colorBlockSize;
            const yPos = idx * colorBlockSize;
            ctx.fillRect(xPos, yPos, colorBlockSize, colorBlockSize);
        });
    });
    container.appendChild(canvasEl);
    parent.appendChild(container);
};
