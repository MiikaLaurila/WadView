export enum WadType {
    PWAD = 'PWAD',
    IWAD = 'IWAD',
    UNKNOWN = 'UNKNOWN',
}
export interface WadHeader {
    type: WadType;
    directoryEntryCount: number;
    directoryLocation: number;
}

export const defaultWadHeader: Readonly<WadHeader> = {
    type: WadType.UNKNOWN,
    directoryEntryCount: 0,
    directoryLocation: 0,
};
