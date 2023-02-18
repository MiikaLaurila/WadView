let topBarFileName = '<no file selected>';
let topBarPageName = '<no page selected>';

export const setTopBarFileName = (fileName: string) => {
    topBarFileName = fileName;
    updateTopBar();
};

export const setTopBarPageName = (pageName: string) => {
    topBarPageName = pageName;
    updateTopBar();
};

const updateTopBar = () => {
    const head = document.getElementById('topbar-head');
    if (head) {
        head.innerText = `${topBarFileName} | ${topBarPageName}`;
    }
};
