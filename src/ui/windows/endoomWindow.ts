import { getEndoom } from '../..';
import { WadEndoom } from '../../interfaces/wad/WadEndoom';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

const containerId = 'endoom-window-container';

let endoom: WadEndoom = [];
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
        const txt = document.createElement('span');
        txt.innerText = c.char;
        block.appendChild(txt);
        container.appendChild(block);
        if ((idx + 1) % 80 === 0) container.appendChild(document.createElement('br'));
    });
}