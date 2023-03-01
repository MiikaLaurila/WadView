import { DSDAResponse, DSDAResponseList } from '../../interfaces/DSDAResponse';
import { IdGamesResponse, IdGamesResponseFile } from '../../interfaces/IdGamesResponse';
import { corsProxy } from '../../library/constants';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';
import { loadWadUrl } from '../main/wadInput';
import { clearLoading, getLoading } from '../other/loader';

const exSearchWindowId = 'ex-search-window';
const searchDivId = 'ex-search-window-searchdiv';
const searchButtonId = 'ex-search-window-searchbutton';
const resultsId = 'ex-search-window-results';

const idGamesMirrorList = [
    'https://www.quaddicted.com/files/idgames/',
    'https://ftpmirror1.infania.net/pub/idgames/',
    'https://youfailit.net/pub/idgames/',
    'https://www.gamers.org/pub/idgames/'
];
const idGamesApiUrl = 'https://www.doomworld.com/idgames/api/api.php?';
const dsdaBaseUrl = 'https://dsdarchive.com';

let lastIdGamesResult: IdGamesResponse | null = null;
let lastDsdaGameResult: DSDAResponseList | null = null;

export const initExternalSearchBrowser = () => {
    setTopBarPageName('external search');
    const baseModule = createModule('exsearch');
    const exSearchWindow = document.createElement('div');
    exSearchWindow.id = exSearchWindowId;
    baseModule.appendChild(exSearchWindow);

    const searchContainers = document.createElement('div');

    const idGamesSearch = createSearchDiv('idgames', executeIdGamesSearch);
    if (idGamesSearch) {
        searchContainers.appendChild(idGamesSearch);
    }

    const dsdaSearch = createSearchDiv('DSDA', executeDsdaSearch);
    if (dsdaSearch) {
        searchContainers.appendChild(dsdaSearch);
    }

    exSearchWindow.appendChild(searchContainers);
}

const executeIdGamesSearch = (val: string, loadParent: HTMLElement) => {
    clearResults();
    const urlFormatted = encodeURIComponent(val);
    loadParent.appendChild(getLoading('idgames-loader'));
    fetch(corsProxy + idGamesApiUrl + `action=search&query=${urlFormatted}&type=title&sort=date&out=json`)
        .then(async (res) => {
            lastIdGamesResult = null;
            lastIdGamesResult = await res.json();
            writeResults('idgames');
        })
        .finally(() => {
            clearLoading('idgames-loader');
        });
}

const executeDsdaSearch = (val: string, loadParent: HTMLElement) => {

    const parseWadPage = (doc: Document): DSDAResponse | null => {
        const [head] = Array.from(doc.getElementsByTagName('h1'));
        const [linkBar] = Array.from(doc.getElementsByClassName('p-short one-line'));
        if (head && linkBar) {
            const fileLink = head.firstChild as HTMLLinkElement;
            const tableLink = linkBar.firstElementChild as HTMLLinkElement;
            return {
                title: fileLink.innerText,
                fileUrl: fileLink.href.replace(window.location.origin, `${dsdaBaseUrl}/`),
                dsdaUrl: tableLink.href.replace(window.location.origin, `${dsdaBaseUrl}/`).replace('/table_view', ''),
            }
        }
        return null;
    }

    clearResults();
    const urlFormatted = encodeURIComponent(val);
    loadParent.appendChild(getLoading('dsda-loader'));
    fetch(corsProxy + dsdaBaseUrl + `/search?utf8=%E2%9C%93&search=${urlFormatted}&commit=Search`)
        .then(async (res) => {
            lastDsdaGameResult = null;
            const domParser = new DOMParser();
            const doc = domParser.parseFromString(await res.text(), 'text/html');
            const isMultiResult = doc.title === 'Search | DSDA';
            if (!isMultiResult) {
                const parsedObj = parseWadPage(doc);
                if (parsedObj) lastDsdaGameResult = [parsedObj];
            } else {
                const linksToPages = Array.from(doc.getElementsByTagName('a'))
                    .filter(a => a.href.includes('/wads/'))
                    .map(a => a.href.replace(window.location.origin, '/'));
                const promises = linksToPages.map((l) => fetch(corsProxy + dsdaBaseUrl + l)
                    .then(async (r) => parseWadPage(domParser.parseFromString(await r.text(), 'text/html'))));
                const responses = await Promise.all(promises);
                lastDsdaGameResult = responses.filter(r => r !== null) as DSDAResponseList;
            }
            writeResults('dsda');
        })
        .finally(() => {
            clearLoading('dsda-loader');
        });
}

const createSearchDiv = (host: string, onSearch: (val: string, loadParent: HTMLElement) => void) => {
    const container = document.createElement('div');
    const head = document.createElement('p');
    head.innerText = `Search by title from ${host}`;
    container.appendChild(head);

    const searchDiv = document.createElement('div');
    searchDiv.id = `${searchDivId}-${host}`;
    searchDiv.classList.add(searchDivId);
    const searchField = document.createElement('input');
    searchField.type = 'text';
    searchField.oninput = (e) => {
        const button = document.getElementById(`${searchButtonId}-${host}`) as HTMLButtonElement;
        const newVal = (e.target as HTMLInputElement).value.trim();
        if (button) {
            if (newVal.length >= 3 && button.disabled) {
                button.disabled = false;
            }
            else if (newVal.length < 3 && !button.disabled) {
                button.disabled = true;
            }
        }

    }
    searchField.onkeydown = function (e) {
        const newVal = (e.target as HTMLInputElement).value.trim();
        if (e.key === 'Enter' && newVal.length >= 3 && container.parentElement) {
            onSearch(searchField.value.trim(), container.parentElement);
        }
    }
    searchDiv.appendChild(searchField);

    const searchButton = document.createElement('button');
    searchButton.innerText = 'Search';
    searchButton.id = `${searchButtonId}-${host}`;
    searchButton.disabled = true;
    searchButton.onclick = () => { container.parentElement && onSearch(searchField.value.trim(), container.parentElement); }
    searchDiv.appendChild(searchButton);
    container.appendChild(searchDiv);
    return container;
}


const clearResults = () => {
    const resultsDiv = document.getElementById(resultsId);
    if (resultsDiv) {
        resultsDiv.parentElement?.removeChild(resultsDiv);
    }
}

const writeResults = (type: 'idgames' | 'dsda') => {
    clearResults();
    const writeNoLevels = () => {
        const head = document.createElement('p');
        head.style.fontWeight = 'bold';
        head.innerText = 'No Results';
        resultsDiv.appendChild(head);
        const msg = document.createElement('p');
        msg.innerText = 'Found some files but none were levels';
        resultsDiv.appendChild(msg);
    }

    const exSearchWindow = document.getElementById(exSearchWindowId);
    if (!exSearchWindow) return;
    const resultsDiv = document.createElement('div');
    resultsDiv.id = resultsId;
    const containerDiv = document.createElement('div');
    if (type === 'idgames') {
        if (!lastIdGamesResult) return;
        if (lastIdGamesResult.content) {
            const file = lastIdGamesResult.content.file;
            if (Array.isArray(file)) {
                if (file.length === 0) {
                    writeNoLevels();
                }
                else {
                    file.forEach((f) => {
                        containerDiv.appendChild(createIdgamesWadCard(f));
                    });
                    resultsDiv.appendChild(containerDiv);
                }
            }
            else {
                containerDiv.appendChild(createIdgamesWadCard(file));
                resultsDiv.appendChild(containerDiv);
            }
        }
        else if (lastIdGamesResult.warning) {
            const head = document.createElement('p');
            head.style.fontWeight = 'bold';
            head.innerText = lastIdGamesResult.warning.type;
            resultsDiv.appendChild(head);
            const msg = document.createElement('p');
            msg.innerText = lastIdGamesResult.warning.message;
            resultsDiv.appendChild(msg);
        }
    }
    else if (type === 'dsda') {
        if (!lastDsdaGameResult) return;
        lastDsdaGameResult.forEach((f) => {
            containerDiv.appendChild(createDsdaWadCard(f));
        });
        resultsDiv.appendChild(containerDiv);
    }
    exSearchWindow.appendChild(resultsDiv);
}


const createField = (k: string, v: string) => {
    const kEl = document.createElement('p');
    kEl.innerText = k;
    const vEl = document.createElement('span');
    vEl.innerText = v;
    kEl.appendChild(vEl);
    return kEl;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const createIdgamesWadCard = (f: IdGamesResponseFile) => {
    const cardDiv = document.createElement('div');

    const title = document.createElement('p');
    title.innerText = f.title;
    cardDiv.appendChild(title);

    cardDiv.appendChild(createField('File: ', f.filename));
    cardDiv.appendChild(createField('Dir: ', f.dir));
    cardDiv.appendChild(createField('Size: ', `${formatBytes(f.size)}`));
    cardDiv.appendChild(createField('Author: ', f.author));
    cardDiv.appendChild(createField('Email: ', f.email));

    const buttonsDiv = document.createElement('div');
    cardDiv.appendChild(buttonsDiv);

    const openIdgamesLink = document.createElement('a');
    openIdgamesLink.innerText = 'Open in idgames';
    openIdgamesLink.href = f.url;
    openIdgamesLink.target = '_blank';
    openIdgamesLink.rel = 'noopener noreferrer';
    buttonsDiv.appendChild(openIdgamesLink);

    const useAsWadButton = document.createElement('button');
    useAsWadButton.innerText = 'Load WAD';
    useAsWadButton.onclick = () => {
        const urlBase = idGamesMirrorList[Math.floor(Math.random() * idGamesMirrorList.length)];
        loadWadUrl(urlBase + f.dir + f.filename);
    }
    buttonsDiv.appendChild(useAsWadButton);

    return cardDiv;
}

const createDsdaWadCard = (f: DSDAResponse) => {
    const cardDiv = document.createElement('div');

    const title = document.createElement('p');
    title.innerText = f.title;
    cardDiv.appendChild(title);

    cardDiv.appendChild(createField('File: ', f.fileUrl.split('/').pop() ?? ''));

    const buttonsDiv = document.createElement('div');
    cardDiv.appendChild(buttonsDiv);

    const openDsdaLink = document.createElement('a');
    openDsdaLink.innerText = 'Open in DSDA';
    openDsdaLink.href = f.dsdaUrl;
    openDsdaLink.target = '_blank';
    openDsdaLink.rel = 'noopener noreferrer';
    buttonsDiv.appendChild(openDsdaLink);

    const useAsWadButton = document.createElement('button');
    useAsWadButton.innerText = 'Load WAD';
    useAsWadButton.onclick = () => {
        loadWadUrl(f.fileUrl);
    }
    buttonsDiv.appendChild(useAsWadButton);

    return cardDiv;
}