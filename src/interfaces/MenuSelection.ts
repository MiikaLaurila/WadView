export enum SelectedPageType {
    EMPTY,
    MAP,
    PLAYPAL,
    COLORMAP,
    HEADER,
    MAPGROUPS,
    DIRECTORY
}

export type SelectedPageInfo = [SelectedPageType, string];
export const initialSelectedPage: SelectedPageInfo = [SelectedPageType.EMPTY, ''];