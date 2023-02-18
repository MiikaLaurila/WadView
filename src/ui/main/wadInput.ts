import { WadFileEvent } from '../../interfaces/wad/WadFileEvent';
import { WadFile } from '../../library/wad/wadFile';
import { addLogWindowMessage, clearLogWindow } from '../windows/logWindow';
import { switchContentModule } from './contentModule';


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
    const onWadInputHidden = (evt: Event & { target: EventTarget | null }) => {
        const target = evt.target as HTMLInputElement | undefined;
        if (target?.files?.length && target.files.length > 0) {
            clearLogWindow();
            switchContentModule('log');
            wadFile.loadFile(target.files[0]);
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

    return wadFile;
};
