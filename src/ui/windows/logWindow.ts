import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

const logWindowId = 'log-window';
const logWindowMessagesId = 'log-window-messages';
const logWindowClearId = 'log-window-clear';

let logMessages: string[] = [];

export const initLogWindowModule = () => {
    const baseModule = createModule('log');
    const logWindow = document.createElement('div');
    logWindow.id = logWindowId;
    baseModule.appendChild(logWindow);

    const logWindowMessages = document.createElement('div');
    logWindowMessages.id = logWindowMessagesId;
    logWindow.appendChild(logWindowMessages);

    const clearButton = document.createElement('button');
    clearButton.id = logWindowClearId;
    clearButton.onclick = () => {
        const tempLog = document.getElementById(logWindowMessagesId);
        if (tempLog) tempLog.innerHTML = '';
    };
    clearButton.innerText = 'Clear Log';

    logWindow.appendChild(clearButton);
    setTopBarPageName('Log');
    logMessages.forEach((l) => addLogWindowMessage(l, true));
};

export const clearLogWindow = () => {
    logMessages = [];
    const logWindowMessages = document.getElementById(logWindowMessagesId) as HTMLDivElement | null;
    if (logWindowMessages) {
        logWindowMessages.innerHTML = '';
    }
};

export const addLogWindowMessage = (message: string, skipPush = false, resetLast = false) => {
    const logWindowMessages = document.getElementById(logWindowMessagesId) as HTMLDivElement | null;
    if (logWindowMessages) {
        const newMsg = document.createElement('p') as HTMLParagraphElement;
        newMsg.textContent = message;
        if (resetLast) {
            const cArr = Array.from(logWindowMessages.children);
            cArr[cArr.length - 1].parentElement?.removeChild(cArr[cArr.length - 1]);
            logMessages.pop();
        }
        logWindowMessages.appendChild(newMsg);
        if (!skipPush) logMessages.push(message);
    }
};
