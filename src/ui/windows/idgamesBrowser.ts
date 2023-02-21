import { IdGamesResponse, IdGamesResponseFile } from '../../interfaces/IdGamesResponse';
import { corsProxy } from '../../library/constants';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';
import { loadWadUrl } from '../main/wadInput';
import { clearLoading, getLoading } from '../other/loader';

const idgamesWindowId = 'idgames-window';
const searchDivId = 'idgames-window-searchdiv';
const searchButtonId = 'idgames-window-searchbutton';
const resultsId = 'idgames-window-results';

const mirrorList = [
    'https://www.quaddicted.com/files/idgames/',
    'https://ftpmirror1.infania.net/pub/idgames/',
    'https://youfailit.net/pub/idgames/',
    'https://www.gamers.org/pub/idgames/'
];
const apiUrl = 'https://www.doomworld.com/idgames/api/api.php?';

let lastResult: IdGamesResponse | null = null;

export const initIdGamesBrowser = () => {
    setTopBarPageName('idgames search');
    const baseModule = createModule('idgames');
    const idgamesWindow = document.createElement('div');
    idgamesWindow.id = idgamesWindowId;
    baseModule.appendChild(idgamesWindow);

    const head = document.createElement('p');
    head.innerText = 'Search by title from idgames (max 10 results)';
    idgamesWindow.appendChild(head);

    const executeSearch = () => {
        clearResults();
        const trimmed = searchField.value.trim();
        const urlFormatted = encodeURIComponent(trimmed);
        idgamesWindow.appendChild(getLoading('idgames-loader'));
        fetch(corsProxy + apiUrl + `action=search&query=${urlFormatted}&type=title&sort=date&out=json`)
            .then(async (res) => {
                lastResult = await res.json();
                writeResults();
            })
            .finally(() => {
                clearLoading('idgames-loader');
            });
    }

    const searchDiv = document.createElement('div');
    searchDiv.id = searchDivId;
    const searchField = document.createElement('input');
    searchField.type = 'text';
    searchField.oninput = (e) => {
        const button = document.getElementById(searchButtonId) as HTMLButtonElement;
        const newVal = (e.target as HTMLInputElement).value.trim();
        if (button) {
            if (newVal.length > 3 && button.disabled) {
                button.disabled = false;
            }
            else if (newVal.length <= 3 && !button.disabled) {
                button.disabled = true;
            }
        }

    }
    searchField.onkeydown = function (e) {
        if (e.key === 'Enter') {
            executeSearch();
        }
    }
    searchDiv.appendChild(searchField);

    const searchButton = document.createElement('button');
    searchButton.innerText = 'Search';
    searchButton.id = searchButtonId;
    searchButton.disabled = true;
    searchButton.onclick = executeSearch
    searchDiv.appendChild(searchButton);
    idgamesWindow.appendChild(searchDiv);
}


const clearResults = () => {
    const resultsDiv = document.getElementById(resultsId);
    if (resultsDiv) {
        resultsDiv.parentElement?.removeChild(resultsDiv);
    }
}

const isLevel = (file: IdGamesResponseFile) => {
    return file.dir.startsWith('levels/doom');
}

const writeResults = () => {

    const writeNoLevels = () => {
        const head = document.createElement('p');
        head.style.fontWeight = 'bold';
        head.innerText = 'No Results';
        resultsDiv.appendChild(head);
        const msg = document.createElement('p');
        msg.innerText = 'Found some files but none were levels';
        resultsDiv.appendChild(msg);
    }

    const idgamesWindow = document.getElementById(idgamesWindowId);
    if (!lastResult || !idgamesWindow) return;
    const resultsDiv = document.createElement('div');
    resultsDiv.id = resultsId;
    const containerDiv = document.createElement('div');
    if (lastResult.content) {
        if (Array.isArray(lastResult.content.file)) {
            const filtered = lastResult.content.file.filter((f) => isLevel(f));
            if (filtered.length === 0) {
                writeNoLevels();
            }
            else {

                filtered.forEach((f) => {
                    if (isLevel(f)) {
                        containerDiv.appendChild(createWadCard(f));
                    }
                });
                resultsDiv.appendChild(containerDiv);
            }
        }
        else {
            if (isLevel(lastResult.content.file)) {
                containerDiv.appendChild(createWadCard(lastResult.content.file));
                resultsDiv.appendChild(containerDiv);
            }
            else {
                writeNoLevels();
            }
        }
    }
    else if (lastResult.warning) {
        const head = document.createElement('p');
        head.style.fontWeight = 'bold';
        head.innerText = lastResult.warning.type;
        resultsDiv.appendChild(head);
        const msg = document.createElement('p');
        msg.innerText = lastResult.warning.message;
        resultsDiv.appendChild(msg);
    }
    idgamesWindow.appendChild(resultsDiv);
}

const createWadCard = (f: IdGamesResponseFile) => {
    const cardDiv = document.createElement('div');

    const title = document.createElement('p');
    title.innerText = f.title;
    cardDiv.appendChild(title);

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

    cardDiv.appendChild(createField('File: ', f.filename));
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
        const urlBase = mirrorList[Math.floor(Math.random() * mirrorList.length)];
        loadWadUrl(urlBase + f.dir + f.filename);
    }
    buttonsDiv.appendChild(useAsWadButton);

    return cardDiv;
}