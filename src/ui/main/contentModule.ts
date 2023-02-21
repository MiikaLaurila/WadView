import { initColormapWindowModule } from '../windows/colormapWindow';
import { initDirectoryWindowModule } from '../windows/directoryWindow';
import { initEndoomWindowModule } from '../windows/endoomWindow';
import { initHeaderWindowModule } from '../windows/headerWindow';
import { initIdGamesBrowser } from '../windows/idgamesBrowser';
import { initLogWindowModule } from '../windows/logWindow';
import { initMapGroupWindowModule } from '../windows/mapGroupWindow';
import { disposeMapWindowModule, initMapWindowModule } from '../windows/mapWindow';
import { initNotReadyWindowModule } from '../windows/notreadyWindow';
import { initPlaypalWindowModule } from '../windows/playpalWindow';

export const contentModule = [
    'log', 'map', 'playpal', 'colormap',
    'notImplemented', 'directory', 'mapgroup',
    'header', 'endoom', 'idgames'
] as const;
export type ContentModuleType = typeof contentModule[number];

let selectedModule: ContentModuleType = 'log';

export interface ModuleOptions {
    mapName?: string;

}

export const createModule = (id: ContentModuleType) => {
    const existingModules = document.getElementsByClassName('module');
    if (existingModules.length > 0) {
        Array.from(existingModules).forEach((m) => {
            if (m.id === 'map') {
                disposeMapWindowModule();
            }
            m.parentElement?.removeChild(m)
        });
    }

    const mod = document.createElement('div');
    mod.id = id;
    mod.classList.add('module');
    document.getElementById('content')?.appendChild(mod);
    return mod;
};

export const initContentModule = () => {
    switchContentModule('log');
};

export const switchContentModule = (id: ContentModuleType, options?: ModuleOptions) => {
    selectedModule = id;
    switch (selectedModule) {
        case 'log':
            initLogWindowModule();
            break;
        case 'playpal':
            initPlaypalWindowModule();
            break;
        case 'colormap':
            initColormapWindowModule();
            break;
        case 'map':
            if (options?.mapName) {
                initMapWindowModule(options.mapName);
            }
            break;
        case 'directory':
            initDirectoryWindowModule();
            break;
        case 'mapgroup':
            initMapGroupWindowModule();
            break;
        case 'header':
            initHeaderWindowModule();
            break;
        case 'endoom':
            initEndoomWindowModule();
            break;
        case 'idgames':
            initIdGamesBrowser();
            break;
        case 'notImplemented':
            initNotReadyWindowModule();
            break;
        default:
            console.log('No implementation for', id);
            break;
    }
};
