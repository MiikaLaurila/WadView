import { getDehacked } from '../..';
import { WadDehacked } from '../../interfaces/wad/WadDehacked';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

const containerId = 'dehacked-window';
const textAreaId = 'dehacked-window-textarea';

let dehacked: WadDehacked | null = null;
export const initDehackedWindowModule = () => {
    setTopBarPageName('Dehacked');
    dehacked = getDehacked();
    if (!dehacked) return;

    const baseModule = createModule('dehacked');

    const container = document.createElement('div');
    container.id = containerId;
    baseModule.appendChild(container);

    const textBox = document.createElement('textarea');
    textBox.id = textAreaId;
    textBox.value = dehacked.dehackedString;
    textBox.readOnly = true;
    container.appendChild(textBox);
};
