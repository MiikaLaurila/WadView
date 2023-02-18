import { getPlaypal } from '../..';
import { WadPlayPalTypedEntry, WadPlayPalColor } from '../../interfaces/wad/WadPlayPal';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';


const playpalWindowId = 'playpal-window';

export const initPlaypalWindowModule = () => {
    const baseModule = createModule('playpal');
    const playpalWindow = document.createElement('div');
    playpalWindow.id = playpalWindowId;
    baseModule.appendChild(playpalWindow);
    setTopBarPageName('PlayPal');
    const playPal = getPlaypal();
    if (playPal) {
        playPal.typedPlaypal.forEach(e => {
            createPlayPalEntry(playpalWindow, e);
        });
    }
};

const createPlayPalEntry = (parent: HTMLDivElement, pal: WadPlayPalTypedEntry) => {
    const colorBlockSize = 16;
    const container = document.createElement('div');
    container.style.margin = '20px';

    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
        return;
    }

    canvasEl.width = 16 * colorBlockSize;
    canvasEl.height = 16 * colorBlockSize;

    pal.forEach((e, idx) => {
        ctx.fillStyle = e.hex;
        ctx.fillRect(
            (idx % 16) * colorBlockSize,
            Math.floor(idx / 16) * colorBlockSize,
            colorBlockSize,
            colorBlockSize,
        );
    });
    canvasEl.onmousemove = e => {
        const rect = canvasEl.getBoundingClientRect();
        const xPos = e.clientX - rect.left;
        const yPos = e.clientY - rect.top;
        const xIndex = Math.floor(xPos / colorBlockSize);
        const yIndex = Math.floor(yPos / colorBlockSize);
        const totalIndex = yIndex * 16 + xIndex;
        const color = pal[totalIndex];
        drawHover(parent, e.x, e.y, color, totalIndex);
    };

    canvasEl.onmouseleave = () => {
        clearHover();
    };

    container.appendChild(canvasEl);
    parent.appendChild(container);
};

let hoverDiv: HTMLDivElement | null = null;

const drawHover = (parent: HTMLDivElement, x: number, y: number, color: WadPlayPalColor, colorIndex: number) => {
    const offset = 66;
    if (!hoverDiv) {
        hoverDiv = document.createElement('div');
        hoverDiv.style.fontFamily = 'Arial';
        hoverDiv.style.position = 'fixed';
        hoverDiv.style.top = `${y - offset}px`;
        hoverDiv.style.left = `${x}px`;
        hoverDiv.style.border = '1px solid black';
        hoverDiv.style.backgroundColor = 'white';
        hoverDiv.style.width = '120px';
        hoverDiv.style.height = '60px';
        hoverDiv.style.fontSize = '12px';
        hoverDiv.style.paddingLeft = '2px';
        hoverDiv.innerHTML = `
                            <span>idx: ${colorIndex}</span>
                            <br />
                            <span>hex: ${color.hex}</span>
                            <br />
                            <span>rgb: (${color.r}, ${color.g}, ${color.b})</span>
                            `;
        parent.appendChild(hoverDiv);
    } else {
        hoverDiv.style.top = `${y - offset}px`;
        hoverDiv.style.left = `${x}px`;
        hoverDiv.innerHTML = `
        <span>idx: ${colorIndex}</span>
        <br />
        <span>hex: ${color.hex}</span>
        <br />
        <span>rgb: (${color.r}, ${color.g}, ${color.b})</span>
        `;
    }
};

const clearHover = () => {
    if (hoverDiv) {
        hoverDiv.parentElement?.removeChild(hoverDiv);
        hoverDiv = null;
    }
};
