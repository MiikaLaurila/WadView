import { WadFileEvent } from '../../interfaces/wad/WadFileEvent';
import { WadFile } from '../../library/wad/wadFile';
import { addLogWindowMessage, clearLogWindow } from '../windows/logWindow';
import { switchContentModule } from './contentModule';
import { unzip } from 'unzipit';


export const initWadInput = (eventListener?: (evt: WadFileEvent, msg?: string) => void): WadFile => {
    const onWadEvent = (evt: WadFileEvent, msg?: string) => {
        addLogWindowMessage(msg ? msg : evt);
        if (eventListener) {
            eventListener(evt, msg);
        }
    };

    const wadFile = new WadFile({ debugLog: false, eventListener: onWadEvent, breatheInLog: true });

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
                const wads = Object.entries(entries).filter((e) => e[0].endsWith('.wad'));
                if (wads.length === 0) {
                    addLogWindowMessage('No wad files found in zip');
                    return;
                }
                const entry = wads.sort(([, e0], [, e1]) => e1.size - e0.size)[0][1];
                addLogWindowMessage(`Selecting ${entry.name}`);
                wadFile.loadArrayBuffer(await entry.arrayBuffer(), entry.name);
            }
            else {
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
        wadFile.loadFileFromUrl('./DOOM1.WAD');
    };

    const wadSelectDoomElem: HTMLButtonElement | undefined = document.getElementById('wad-input-doom') as HTMLButtonElement;
    if (wadSelectDoomElem) {
        wadSelectDoomElem.addEventListener('click', onSelectDoomElem);
    }

    const wadOpenUrlButton: HTMLButtonElement | undefined = document.getElementById('wad-input-text-loader') as HTMLButtonElement;
    const wadOpenUrlText: HTMLInputElement | undefined = document.getElementById('wad-input-text') as HTMLInputElement;

    const onSelectOpenUrl = async () => {
        clearLogWindow();
        switchContentModule('log');
        if (wadOpenUrlText) {
            const url = wadOpenUrlText.value;
            addLogWindowMessage(`Trying to load ${url}`);
            if (url.endsWith('.zip')) {
                try {
                    addLogWindowMessage(`Loading ${url}`);
                    const { entries } = await unzip(url);
                    const wads = Object.entries(entries).filter((e) => e[0].endsWith('.wad'));
                    if (wads.length === 0) {
                        addLogWindowMessage('No wad files found in zip');
                        return;
                    }
                    const entry = wads.sort(([, e0], [, e1]) => e1.size - e0.size)[0][1];
                    addLogWindowMessage(`Selecting ${entry.name}`);
                    wadFile.loadArrayBuffer(await entry.arrayBuffer(), entry.name);
                }
                catch (err) {
                    // eslint-disable-next-line @typescript-eslint/quotes
                    addLogWindowMessage(`
                    Failed to fetch the zip from provided URL.
                    Source probably doesn't allow cors requests ¯\\_(ツ)_/¯
                    Check the browser console (F12 usually)
                    `);
                }
            }
        }
    }
    if (wadOpenUrlButton && wadOpenUrlText) {
        wadOpenUrlButton.addEventListener('click', onSelectOpenUrl);
    }

    return wadFile;
};
