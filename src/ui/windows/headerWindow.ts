import { getHeader } from '../..';
import { WadHeader } from '../../interfaces/wad/WadHeader';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

const containerId = 'header-window-container';

let header: WadHeader | null = null;
export const initHeaderWindowModule = () => {
    setTopBarPageName('Header');
    header = getHeader();

    const baseModule = createModule('header');

    const container = document.createElement('div');
    container.id = containerId;
    baseModule.appendChild(container);

    const createRow = (k: string, v: string) => {
        const holder = document.createElement('p');
        const kElem = document.createElement('span');
        kElem.innerText = k;
        holder.appendChild(kElem);
        const vElem = document.createElement('span');
        vElem.innerText = v;
        holder.appendChild(vElem);
        return holder;
    }

    if (header) {
        container.appendChild(createRow('Wad Type: ', header.type));
        container.appendChild(createRow('Directory Entries: ', header.directoryEntryCount.toString()));
        container.appendChild(createRow('Directory Offset: ', header.directoryLocation.toString()));
    }
}