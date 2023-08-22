import { getEndoom } from '../..';
import { WadEndoom } from '../../interfaces/wad/WadEndoom';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

const containerId = 'endoom-window-container';
const endoomBlockClass = 'endoom-block';

let endoom: WadEndoom = [];
let blinkCycle: number | null = null;
export const initEndoomWindowModule = () => {
    setTopBarPageName('Endoom');
    endoom = getEndoom();

    const baseModule = createModule('endoom');

    const container = document.createElement('div');
    container.id = containerId;
    baseModule.appendChild(container);

    endoom.forEach((c, idx) => {
        const block = document.createElement('div');
        block.style.backgroundColor = c.backgroundColor;
        block.style.color = c.foregroundColor;
        block.setAttribute('blink', c.blink ? '1' : '0');
        block.setAttribute('blink-phase', '0');
        block.setAttribute('fg', c.foregroundColor);
        block.setAttribute('bg', c.backgroundColor);
        block.className = endoomBlockClass;
        const txt = document.createElement('span');
        txt.innerText = c.char;
        block.appendChild(txt);
        container.appendChild(block);
        if ((idx + 1) % 80 === 0) container.appendChild(document.createElement('br'));
    });

    if (blinkCycle === null) {
        blinkCycle = window.setInterval(() => {
            const blocks = document.getElementsByClassName(endoomBlockClass) as HTMLCollectionOf<HTMLDivElement>;
            Array.from(blocks).forEach((block: HTMLDivElement) => {
                const blink = block.getAttribute('blink');
                if (blink !== '1') return;
                const blinkPhase = block.getAttribute('blink-phase');
                const fgColor = block.getAttribute('fg');
                const bgColor = block.getAttribute('bg');
                if (bgColor && fgColor) {
                    if (blinkPhase === '0') {
                        block.style.color = bgColor;
                        block.setAttribute('blink-phase', '1');
                    } else {
                        block.style.color = fgColor;
                        block.setAttribute('blink-phase', '0');
                    }
                }
            });
        }, 250);
    }
};

export const disposeEndoomModule = () => {
    if (blinkCycle !== null) {
        clearInterval(blinkCycle);
        blinkCycle = null;
    }
};
