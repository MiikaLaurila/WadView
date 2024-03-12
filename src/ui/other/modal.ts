export const createModal = (id: string, content: HTMLDivElement) => {
    const modal = document.createElement('div');
    modal.id = id;
    modal.onclick = () => { closeModal(id); }
    modal.className = 'full-screen-modal';

    const closeButton = document.createElement('button');
    closeButton.innerText = 'CLOSE';
    closeButton.className = 'full-screen-modal-close';
    closeButton.onclick = () => { closeModal(id); }
    modal.appendChild(closeButton);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'full-screen-modal-content';
    contentDiv.appendChild(content);
    contentDiv.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
    })
    modal.appendChild(contentDiv);

    document.body.appendChild(modal);
}

export const closeModal = (id: string) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.parentElement?.removeChild(modal);
    }
    else {
        console.log('No modal with id:', id)
    }
}