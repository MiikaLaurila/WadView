import { WadFileEvent } from '../../interfaces/wad/WadFileEvent';
import { WadFile } from '../../library/wad/wadFile';
import { addLogWindowMessage, clearLogWindow } from '../windows/logWindow';
import { switchContentModule } from './contentModule';
import { unzip, ZipEntry } from 'unzipit';
import { corsProxy } from '../../library/constants';

let wadFile: WadFile | null = null;

export const initWadInput = (eventListener?: (evt: WadFileEvent, msg?: string) => void): WadFile => {
    const onWadEvent = (evt: WadFileEvent, msg?: string) => {
        addLogWindowMessage(msg ? msg : evt);
        if (eventListener) {
            eventListener(evt, msg);
        }
    };

    wadFile = new WadFile({ debugLog: false, eventListener: onWadEvent, breatheInLog: true });

    const wadInputElemVisible = document.getElementById('wad-input') as HTMLButtonElement | undefined;
    const wadInputElemHidden = document.getElementById('wad-input-hidden') as HTMLInputElement | undefined;
    const onWadInputHidden = async (evt: Event & { target: EventTarget | null }) => {
        const target = evt.target as HTMLInputElement | undefined;
        if (target?.files?.length && target.files.length > 0) {
            clearLogWindow();
            switchContentModule('log');
            if (target.files[0].name.endsWith('.zip')) {
                addLogWindowMessage(`Unzipping ${target.files[0].name}`);
                const { entries } = await unzip(target.files[0]);
                await parseZipEntries(entries);

            }
            else if (wadFile) {
                wadFile.loadFile(target.files[0]);
            }
        }
    };

    const onWadInputVisible = (evt: Event) => {
        evt.preventDefault();
        if (wadInputElemHidden) {
            wadInputElemHidden.click();
        }
    };

    if (wadInputElemVisible && wadInputElemHidden) {
        wadInputElemHidden.addEventListener('change', onWadInputHidden);
        wadInputElemVisible.addEventListener('click', onWadInputVisible);
    }

    const onSelectDoomElem = () => {
        clearLogWindow();
        switchContentModule('log');
        if (wadFile) {
            wadFile.loadFileFromUrl('./DOOM1.WAD');
        }
    };

    const wadSelectDoomElem: HTMLButtonElement | undefined = document.getElementById('wad-input-doom') as HTMLButtonElement;
    if (wadSelectDoomElem) {
        wadSelectDoomElem.addEventListener('click', onSelectDoomElem);
    }

    const wadOpenUrlButton: HTMLButtonElement | undefined = document.getElementById('wad-input-text-loader') as HTMLButtonElement;
    const wadOpenUrlText: HTMLInputElement | undefined = document.getElementById('wad-input-text') as HTMLInputElement;

    const onSelectOpenUrl = async () => {
        if (wadOpenUrlText) {
            const url = wadOpenUrlText.value.trim();
            if (url) {
                loadWadUrl(url);
            }
            else {
                addLogWindowMessage('Please input the URL in the text box.')
            }
        }
    }
    if (wadOpenUrlButton && wadOpenUrlText) {
        wadOpenUrlButton.addEventListener('click', onSelectOpenUrl);
    }

    const wadBrowseIdgamesElem: HTMLButtonElement | undefined = document.getElementById('wad-input-idgames') as HTMLButtonElement;
    if (wadBrowseIdgamesElem) {
        wadBrowseIdgamesElem.addEventListener('click', () => { switchContentModule('idgames'); });
    }

    return wadFile;
};

export const loadWadUrl = async (url: string) => {
    clearLogWindow();
    switchContentModule('log');
    addLogWindowMessage(`Trying to load ${url}`);


    if (url.toLowerCase().split(/(?=.zip)/g).pop()?.startsWith('.zip')) {
        try {
            addLogWindowMessage(`Loading ${url}`);
            const file = await dlFile(corsProxy + url);
            if (file) {
                const { entries } = await unzip(file);
                await parseZipEntries(entries);
            }
        }
        catch (err) {
            console.error(err);
            addLogWindowMessage('Failed to fetch the zip from provided URL.¯\\_(ツ)_/¯');
        }
    }
    else if (url.toLowerCase().split(/(?=.wad)/g).pop()?.startsWith('.wad')) {
        const file = await dlFile(corsProxy + url);
        if (wadFile && file) {
            wadFile.loadArrayBuffer(file, url);
        }
    }
    else {
        addLogWindowMessage('Cannot determine if it is zip or wad from the URL. Or maybe it was not a file at all ¯\\_(ツ)_/¯')
    }
}

const parseZipEntries = async (entries: { [key: string]: ZipEntry }) => {
    const wads = Object.entries(entries).filter((e) => e[0].toLowerCase().endsWith('.wad'));
    if (wads.length === 0) {
        addLogWindowMessage('No wad files found in zip');
        return;
    }
    const entry = wads.sort(([, e0], [, e1]) => e1.size - e0.size)[0][1];
    addLogWindowMessage(`Selecting ${entry.name}`);
    if (wadFile) {
        wadFile.loadArrayBuffer(await entry.arrayBuffer(), entry.name);
    }
}

const dlFile = async (url: string): Promise<ArrayBuffer | null> => {
    const response = await fetch(url);
    if (!response.body || !response.headers) return null;

    const reader = response.body.getReader();

    const len = response.headers.get('Content-Length');
    const contentLength = len ? +len : 0;

    let receivedLength = 0;
    let readerInProgress = true;
    let firstMsg = true;
    const chunks = [];
    while (readerInProgress) {
        const { done, value } = await reader.read();

        if (done) {
            readerInProgress = false;
            break;
        }
        chunks.push(value);
        receivedLength += value.length;

        addLogWindowMessage(`Received ${receivedLength} of ${contentLength} (${(receivedLength / contentLength * 100).toFixed(2)}%)`, false, !firstMsg);
        firstMsg = false;
    }

    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    return chunksAll.buffer;
}
