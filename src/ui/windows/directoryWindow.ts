import type { WadDirectory, WadDirectoryEntry, WadFileInfo } from "wadview-lib";
import { getDirectories } from "../..";
import { createModule } from "../main/contentModule";
import { setTopBarPageName } from "../main/topbar";

const containerId = "dir-window-container";
const rowHeight = 17;
let directoryEntrySplitCount = Math.floor(
	(window.innerHeight - 80) / rowHeight,
);
window.addEventListener("resize", () => {
	if (document.getElementById(containerId)) {
		directoryEntrySplitCount = Math.floor(
			(window.innerHeight - 80) / rowHeight,
		);
		initDirectoryWindowModule();
	}
});

let directories: WadFileInfo<WadDirectoryEntry>[] = [];
export const initDirectoryWindowModule = () => {
	setTopBarPageName("Directory");
	directories = getDirectories();
	directories.sort((a, b) => a.wadIdx - b.wadIdx);

	const baseModule = createModule("directory");

	const container = document.createElement("div");
	container.id = containerId;
	container.classList.add("dir-container");
	baseModule.appendChild(container);

	const splitDirectory: WadFileInfo<WadDirectoryEntry>[][] = [];
	let temp: WadFileInfo<WadDirectoryEntry>[] = [];
	directories.forEach((entry, idx) => {
		temp.push(entry);
		if ((idx + 1) % directoryEntrySplitCount === 0) {
			splitDirectory.push(temp);
			temp = [];
		}
	});
	splitDirectory.push(temp);

	splitDirectory.forEach((dir, dirIdx) => {
		const splitContainer = document.createElement("div");

		const getCell = (text: string | number) => {
			const cell = document.createElement("div");
			cell.innerHTML = text.toString();
			return cell;
		};
		const headerRow = document.createElement("div");
		headerRow.style.fontWeight = "bold";
		headerRow.appendChild(getCell("idx"));
		headerRow.appendChild(getCell("name"));
		headerRow.appendChild(getCell("location"));
		headerRow.appendChild(getCell("size"));
		headerRow.appendChild(getCell("type"));
		headerRow.appendChild(getCell("wad"));
		splitContainer.appendChild(headerRow);

		dir.forEach((entry, entryIdx) => {
			const row = document.createElement("div");
			row.appendChild(getCell(dirIdx * directoryEntrySplitCount + entryIdx));
			row.appendChild(getCell(entry.lumpName));
			row.appendChild(getCell(entry.lumpLocation));
			row.appendChild(getCell(entry.lumpSize));
			row.appendChild(getCell(entry.type));
			row.appendChild(getCell(entry.wadFileName));
			splitContainer.appendChild(row);
		});
		container.appendChild(splitContainer);
	});
};
