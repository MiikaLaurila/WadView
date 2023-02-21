export interface WadPatchPost {
    yOffset: number;
    data: number[];
}

export interface WadPatch {
    name: string;
    width: number;
    height: number;
    xOffset: number;
    yOffset: number;
    columns: WadPatchPost[][];
}