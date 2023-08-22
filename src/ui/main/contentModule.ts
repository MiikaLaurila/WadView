import { initColormapWindowModule } from '../windows/colormapWindow';
import { initDirectoryWindowModule } from '../windows/directoryWindow';
import { disposeEndoomModule, initEndoomWindowModule } from '../windows/endoomWindow';
import { initHeaderWindowModule } from '../windows/headerWindow';
import { initExternalSearchBrowser } from '../windows/externalSearchBrowser';
import { initLogWindowModule } from '../windows/logWindow';
import { initMapGroupWindowModule } from '../windows/mapGroupWindow';
import { disposeMapWindowModule, initMapWindowModule } from '../windows/mapWindow';
import { initNotReadyWindowModule } from '../windows/notreadyWindow';
import { initPlaypalWindowModule } from '../windows/playpalWindow';
import { initDehackedWindowModule } from '../windows/dehackedWindow';

//prettier-ignore
export const contentModule = [
    'log', 'map', 'playpal', 'colormap',
    'notImplemented', 'directory', 'mapgroup',
    'header', 'endoom', 'exsearch', 'dehacked'
] as const;
export type ContentModuleType = (typeof contentModule)[number];

let selectedModule: ContentModuleType = 'log';

export interface ModuleOptions {
    mapName?: string;
}

export const createModule = (id: ContentModuleType) => {
    const existingModules = document.getElementsByClassName('module');
    if (existingModules.length > 0) {
        Array.from(existingModules).forEach((m) => {
            const id = m.id as ContentModuleType;
            if (id === 'map') {
                disposeMapWindowModule();
            }
            if (id === 'endoom') {
                disposeEndoomModule();
            }
            m.parentElement?.removeChild(m);
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
        case 'exsearch':
            initExternalSearchBrowser();
            break;
        case 'dehacked':
            initDehackedWindowModule();
            break;
        case 'notImplemented':
            initNotReadyWindowModule();
            break;
        default:
            console.log('No implementation for', id);
            break;
    }
};
