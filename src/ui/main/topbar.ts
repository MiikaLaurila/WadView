let topBarFileName = "<no file>";
let topBarPageName = "<no page selected>";

let sideBarOpen = false;
let topBarOpen = false;

export const setTopBarFileName = (fileName: string) => {
	topBarFileName = fileName;
	updateTopBar();
};

export const setTopBarPageName = (pageName: string) => {
	topBarPageName = pageName;
	updateTopBar();
};

const updateTopBar = () => {
	const head = document.getElementById("topbar-head");
	if (head) {
		head.innerText = `${topBarFileName} | ${topBarPageName}`;
	}
};

export const initTopBar = () => {
	const sidebarButton = document.getElementById("sidebar-open");
	const sidebar = document.getElementById("sidebar");
	const topbarButton = document.getElementById("topbar-input-boxes-open");
	const topbar = document.getElementById("topbar-input-boxes");

	if (!sidebarButton || !topbarButton || !sidebar || !topbar) return;

	sidebarButton.addEventListener("click", () => {
		if (sideBarOpen) {
			sidebar.classList.remove("open");
			sideBarOpen = false;
		} else {
			sidebar.classList.add("open");
			sideBarOpen = true;
		}

		if (topBarOpen) {
			topbar.classList.remove("open");
			topBarOpen = false;
		}
	});

	topbarButton.addEventListener("click", () => {
		if (topBarOpen) {
			topbar.classList.remove("open");
			topBarOpen = false;
		} else {
			topbar.classList.add("open");
			topBarOpen = true;
		}

		if (sideBarOpen) {
			sidebar.classList.remove("open");
			sideBarOpen = false;
		}
	});
};

export const closeMenus = () => {
	const sidebarButton = document.getElementById("sidebar-open");
	const sidebar = document.getElementById("sidebar");
	const topbarButton = document.getElementById("topbar-input-boxes-open");
	const topbar = document.getElementById("topbar-input-boxes");

	if (!sidebarButton || !topbarButton || !sidebar || !topbar) return;
	if (sideBarOpen) {
		sidebar.classList.remove("open");
		sideBarOpen = false;
	}
	if (topBarOpen) {
		topbar.classList.remove("open");
		topBarOpen = false;
	}
};
