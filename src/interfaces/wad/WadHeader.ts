export enum WadType {
    PWAD = 'PWAD',
    IWAD = 'IWAD'
}
export interface WadHeader {
    type: WadType;
    directoryEntryCount: number;
    directoryLocation: number;
}

export const defaultWadHeader: WadHeader = {
    type: WadType.PWAD,
    directoryEntryCount: 0,
    directoryLocation: 0,
}