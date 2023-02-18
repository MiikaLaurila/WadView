import { WadMapGroupList, WadMapList } from '../../interfaces/wad/map/WadMap';
import { WadColorMap } from '../../interfaces/wad/WadColorMap';
import { WadDirectory } from '../../interfaces/wad/WadDirectory';
import { WadHeader, WadType } from '../../interfaces/wad/WadHeader';
import { WadPlayPal } from '../../interfaces/wad/WadPlayPal';
import { switchContentModule } from './contentModule';


const pages = ['Metadata', 'Colors', 'Maps'] as const;
type PageType = typeof pages[number];
let openedGroups: PageType[] = [];
let eventListenersAdded: PageType[] = [];

const removeFromOpened = (type: PageType) => {
    const idx = openedGroups.findIndex(g => g === type);
    const copy = [...openedGroups];
    copy.splice(idx, 1);
    openedGroups = copy;
};

const removeFromEventListenersAdded = (type: PageType) => {
    const idx = eventListenersAdded.findIndex(g => g === type);
    const copy = [...eventListenersAdded];
    copy.splice(idx, 1);
    eventListenersAdded = copy;
};

const eventListener = (type: PageType, evt: MouseEvent) => {
    if (!eventListenersAdded.includes(type)) {
        eventListenersAdded.push(type);
    }

    if (openedGroups.includes(type)) {
        const parent = (evt.target as HTMLDivElement).parentElement;
        if (parent) {
            Array.from(parent.children).forEach((c: Element) => {
                if (c.classList.contains('subhead')) {
                    c.setAttribute('style', 'display: none;');
                }
            });
        }

        removeFromOpened(type);
    } else {
        const parent = (evt.target as HTMLDivElement).parentElement;
        if (parent) {
            Array.from(parent.children).forEach((c: Element) => {
                if (c.classList.contains('subhead')) {
                    c.removeAttribute('style');
                }
            });
        }

        openedGroups.push(type);
    }
};

const createChild = (parent: HTMLDivElement, name: string, onClick: () => void) => {
    const newChild = document.createElement('div');
    newChild.innerText = name;
    newChild.classList.add('subhead');
    newChild.style.display = 'none';
    newChild.onclick = onClick;
    parent.appendChild(newChild);
};

const createHead = (parent: HTMLDivElement, name: PageType) => {
    const newChild = document.createElement('div');
    newChild.innerText = name;
    newChild.classList.add('head');
    if (!eventListenersAdded.includes(name)) {
        newChild.addEventListener('click', evt => {
            eventListener(name, evt);
        });
    }

    parent.appendChild(newChild);
};

export const initializeSideBarMeta = (header: WadHeader, directory: WadDirectory, mapGroups: WadMapGroupList) => {
    const metaSection = document.getElementById('section-meta') as HTMLDivElement | undefined;
    if (!metaSection) {
        return;
    }

    if (header.type !== WadType.UNKNOWN || directory.length > 0 || mapGroups.length > 0) {
        metaSection.innerHTML = '';
        metaSection.style.removeProperty('display');
        removeFromOpened('Metadata');
        removeFromEventListenersAdded('Metadata');
    }

    createHead(metaSection, 'Metadata');

    if (header.type !== WadType.UNKNOWN) {
        createChild(metaSection, 'HEADER', () => { });
    }

    if (directory.length > 0) {
        createChild(metaSection, 'DIRECTORY', () => { });
    }

    if (mapGroups.length > 0) {
        createChild(metaSection, 'MAP GROUPS', () => { });
    }

    createChild(metaSection, 'LOG', () => {
        switchContentModule('log');
    });
};

export const initializeSideBarColors = (playpal: WadPlayPal, colormap: WadColorMap) => {
    const colorSection = document.getElementById('section-colors') as HTMLDivElement | undefined;
    if (!colorSection) {
        return;
    }

    if (playpal.typedPlaypal.length > 0 || colormap.length > 0) {
        colorSection.innerHTML = '';
        colorSection.style.removeProperty('display');
        removeFromOpened('Colors');
        removeFromEventListenersAdded('Colors');
    }

    createHead(colorSection, 'Colors');

    if (playpal.typedPlaypal.length > 0) {
        createChild(colorSection, 'PLAYPAL', () => {
            switchContentModule('playpal');
        });
    }

    if (colormap.length > 0) {
        createChild(colorSection, 'COLORMAP', () => {
            switchContentModule('colormap');
        });
    }
};

export const initializeSideBarMaps = (maps: WadMapList) => {
    const mapSection = document.getElementById('section-maps') as HTMLDivElement | undefined;
    if (!mapSection) {
        return;
    }

    if (maps.length > 0) {
        mapSection.innerHTML = '';
        mapSection.style.removeProperty('display');
        removeFromOpened('Maps');
        removeFromEventListenersAdded('Maps');
        createHead(mapSection, 'Maps');

        maps.forEach(m => {
            createChild(mapSection, m.name, () => {
                switchContentModule('map', { mapName: m.name })
            });
        });
    }
};
