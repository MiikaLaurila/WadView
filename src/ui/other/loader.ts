export const getLoading = (id: string) => {
    const loader = document.createElement('div');
    loader.classList.add('spinner-loader');
    for (let i = 0; i < 8; i++) {
        loader.appendChild(document.createElement('div'));
    }
    loader.id = id;
    return loader;
}

export const clearLoading = (id: string) => {
    const loader = document.getElementById(id);
    if (loader) {
        loader.parentElement?.removeChild(loader);
    }
}