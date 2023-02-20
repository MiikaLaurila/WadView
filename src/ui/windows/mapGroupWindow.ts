import { getMapGroups } from '../..';
import { WadMapGroupList } from '../../interfaces/wad/map/WadMap';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

const containerId = 'mapgroup-window-container';

let mapGroups: WadMapGroupList = [];
export const initMapGroupWindowModule = () => {
    setTopBarPageName('MapGroups');
    mapGroups = getMapGroups();

    const baseModule = createModule('mapgroup');

    const container = document.createElement('div');
    container.id = containerId;
    container.classList.add('dir-container');
    baseModule.appendChild(container);

    mapGroups.forEach((mapGroup) => {
        const splitContainer = document.createElement('div');

        const getCell = (text: string | number) => {
            const cell = document.createElement('div');
            cell.innerHTML = text.toString();
            return cell;
        }

        const mapNameRow = document.createElement('div');
        mapNameRow.style.fontWeight = 'bold';
        mapNameRow.appendChild(getCell(mapGroup.name));
        splitContainer.appendChild(mapNameRow);

        const headerRow = document.createElement('div');
        headerRow.style.fontWeight = 'bold';
        headerRow.appendChild(getCell('idx'));
        headerRow.appendChild(getCell('name'));
        headerRow.appendChild(getCell('location'));
        headerRow.appendChild(getCell('size'));
        splitContainer.appendChild(headerRow);

        mapGroup.lumps.forEach((entry, entryIdx) => {
            const row = document.createElement('div');
            row.appendChild(getCell(entryIdx));
            row.appendChild(getCell(entry.lumpName));
            row.appendChild(getCell(entry.lumpLocation));
            row.appendChild(getCell(entry.lumpSize));
            splitContainer.appendChild(row);
        });
        container.appendChild(splitContainer);
    });
}