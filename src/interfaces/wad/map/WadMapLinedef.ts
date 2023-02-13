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

export const isBlueDoor = (special: number): boolean => {
    return [26, 32, 99, 133].includes(special);
};

export const isRedDoor = (special: number): boolean => {
    return [28, 33, 134, 135].includes(special);
};

export const isYellowDoor = (special: number): boolean => {
    return [27, 34, 136, 137].includes(special);
};

export const isExit = (special: number): boolean => {
    return [11, 52, 197, 51, 124, 198].includes(special);
};
export const isTeleporter = (special: number): boolean => {
    return [
        195, 174, 97, 39, 126,
        125, 269, 268, 210, 209,
        208, 207, 244, 243, 263,
        262, 267, 266, 265, 264,
    ].includes(special);
};
