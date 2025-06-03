export enum SelectedPageType {
	EMPTY = 0,
	MAP = 1,
	PLAYPAL = 2,
	COLORMAP = 3,
	HEADER = 4,
	MAPGROUPS = 5,
	DIRECTORY = 6,
}

export type SelectedPageInfo = [SelectedPageType, string];
export const initialSelectedPage: SelectedPageInfo = [
	SelectedPageType.EMPTY,
	"",
];
