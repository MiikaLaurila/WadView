import { createModule } from '../main/contentModule';

export const initNotReadyWindowModule = () => {
    const baseModule = createModule('notImplemented');
    const text = document.createElement('p');
    text.innerHTML = 'Page not implemented';
    baseModule.appendChild(text);
};
