export interface WadMapBlockMap {
    xOrigin: number;
    yOrigin: number;
    columns: number;
    rows: number;
    offsets: number[];
    blockList: number[][];
}

export const defaultWadMapBlockmap: Readonly<WadMapBlockMap> = {
    xOrigin: 0,
    yOrigin: 0,
    columns: 0,
    rows: 0,
    offsets: [],
    blockList: []
}