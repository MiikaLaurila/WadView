export interface WadMapLinedef {
    start: number;
    end: number;
    flags: number;
    flagsString: WadMapLinedefFlag[];
    specialType: number;
    sectorTag: number;
    frontSideDef: number;
    backSideDef: number;
}

export enum WadMapLinedefFlags {
    BLOCK_PLAYER_MONSTER = 0x0001,
    BLOCK_MONSTER = 0x0002,
    TWO_SIDED = 0x0004,
    UPPER_TEX_UNPEGGED = 0x0008,
    LOWER_TEX_UNPEGGED = 0x0010,
    SECRET = 0x0020,
    BLOCK_SOUND = 0x0040,
    HIDE_ON_MAP = 0x0080,
    ALWAYS_ON_MAP = 0x0100,
}

export type WadMapLinedefFlag = keyof typeof WadMapLinedefFlags;

export const extractWadMapLinedefFlags = (flags: number): WadMapLinedefFlag[] => {
    const foundFlags: WadMapLinedefFlag[] = [];
    const testFlag = (flag: WadMapLinedefFlags): void => {
        if (flags & flag) foundFlags.push(WadMapLinedefFlags[flag] as WadMapLinedefFlag);
    };
    for (const f in WadMapLinedefFlags) {
        testFlag(WadMapLinedefFlags[f as WadMapLinedefFlag]);
    }
    return foundFlags;
};
