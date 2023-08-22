import { getPlaypal } from '../../..';
import { IntRange } from '../../IntRange';
import { WadMap } from './WadMap';
import { WadMapLinedef, isBlueDoor, isExit, isRedDoor, isTeleporter, isYellowDoor } from './WadMapLinedef';

export interface MapWindowPalette {
    name: string;
    getBackground: (palette: MapWindowPalette) => string;
    getLineColor: (palette: MapWindowPalette, line: WadMapLinedef, mapData: WadMap) => string;
    getGridColor: (palette: MapWindowPalette) => [string, string];
    getBlockmapColor: (palette: MapWindowPalette) => string;
    background: IntRange<0, 256>;
    grid32: IntRange<0, 256>;
    grid64: IntRange<0, 256>;
    blockmap: IntRange<0, 256>;
    oneSidedWall: IntRange<0, 256>;
    teleporter: IntRange<0, 256>;
    secretArea: IntRange<0, 256>;
    changeFloorHeight: IntRange<0, 256>;
    changeCeilHeight: IntRange<0, 256>;
    floorAndCeilEqual: IntRange<0, 256>;
    noChangeInHeight: IntRange<0, 256>;
    redDoor: IntRange<0, 256>;
    yellowDoor: IntRange<0, 256>;
    blueDoor: IntRange<0, 256>;
    exit: IntRange<0, 256>;
}

const automapLineColor = (palette: MapWindowPalette, line: WadMapLinedef, mapData: WadMap): string => {
    const ppal = getPlaypal().typedPlaypal[0];
    let color = 'cyan';

    const frontSide = { ...mapData.sidedefs[line.frontSideDef] };
    const frontSector = { ...mapData.sectors[frontSide.sector] };
    const fSectorFloor = frontSector.floorHeight;
    const fSectorCeil = frontSector.ceilingHeight;
    const backSide = { ...mapData.sidedefs[line.backSideDef] };
    const backSector = { ...mapData.sectors[backSide.sector] };
    const bSectorFloor = backSector.floorHeight;
    const bSectorCeil = backSector.ceilingHeight;

    const isSecretSector = frontSector.specialType === 9 || backSector.specialType === 9;
    const isHiddenSecret = line.flagsString.includes('SECRET');
    const isTwoSided = line.flagsString.includes('TWO_SIDED');
    if (isBlueDoor(line.specialType)) {
        color = ppal[palette.blueDoor].hex;
    } else if (isRedDoor(line.specialType)) {
        color = ppal[palette.redDoor].hex;
    } else if (isYellowDoor(line.specialType)) {
        color = ppal[palette.yellowDoor].hex;
    } else if (isExit(line.specialType)) {
        color = ppal[palette.exit].hex;
    } else if (isTeleporter(line.specialType)) {
        color = ppal[palette.teleporter].hex;
    } else if (isTwoSided && !isHiddenSecret) {
        if (isSecretSector && !isHiddenSecret) {
            color = ppal[palette.secretArea].hex;
        } else if (fSectorFloor !== bSectorFloor) {
            color = ppal[palette.changeFloorHeight].hex;
        } else if (fSectorCeil !== bSectorCeil) {
            color = ppal[palette.changeCeilHeight].hex;
        } else if (fSectorCeil === bSectorCeil && fSectorFloor === bSectorFloor) {
            color = ppal[palette.noChangeInHeight].hex;
        } else if (fSectorCeil === fSectorFloor && bSectorCeil === bSectorFloor) {
            color = ppal[palette.floorAndCeilEqual].hex;
        }
    } else if (isSecretSector && !isHiddenSecret) {
        color = ppal[palette.secretArea].hex;
    } else {
        color = ppal[palette.oneSidedWall].hex;
    }
    return color;
};

const automapGridColor = (palette: MapWindowPalette): [string, string] => {
    const ppal = getPlaypal().typedPlaypal[0];
    return [ppal[palette.grid32].hex, ppal[195].hex];
};

const automapBlockmapColor = (palette: MapWindowPalette): string => {
    const ppal = getPlaypal().typedPlaypal[0];
    return ppal[palette.blockmap].hex;
};

const automapBackgroundColor = (palette: MapWindowPalette): string => {
    const ppal = getPlaypal().typedPlaypal[0];
    return ppal[palette.background].hex;
};

export const eternityPalette: MapWindowPalette = {
    name: 'Eternity Engine',
    getBackground: automapBackgroundColor,
    getLineColor: automapLineColor,
    getGridColor: automapGridColor,
    getBlockmapColor: automapBlockmapColor,
    background: 0,
    grid32: 104,
    grid64: 195,
    blockmap: 107,
    oneSidedWall: 181,
    changeFloorHeight: 166,
    changeCeilHeight: 231,
    floorAndCeilEqual: 231,
    noChangeInHeight: 88,
    redDoor: 175,
    blueDoor: 204,
    yellowDoor: 231,
    teleporter: 119,
    secretArea: 176,
    exit: 112,
};

export const dsdaPalette: MapWindowPalette = {
    name: 'DSDA Doom',
    getBackground: automapBackgroundColor,
    getLineColor: automapLineColor,
    getGridColor: automapGridColor,
    getBlockmapColor: automapBlockmapColor,
    background: 247,
    grid32: 104,
    grid64: 195,
    blockmap: 107,
    oneSidedWall: 23,
    changeFloorHeight: 55,
    changeCeilHeight: 215,
    floorAndCeilEqual: 208,
    noChangeInHeight: 88,
    redDoor: 175,
    blueDoor: 204,
    yellowDoor: 231,
    teleporter: 119,
    secretArea: 252,
    exit: 112,
};

export const omgifolPalette: MapWindowPalette = {
    name: 'omgifol',
    getBackground: () => '#ffffff',
    getLineColor: (_, line) => {
        let color = '#000000';
        if (line.flagsString.includes('TWO_SIDED')) color = '#909090';
        if (line.specialType !== 0) color = '#DC8232';
        return color;
    },
    getGridColor: automapGridColor,
    getBlockmapColor: automapBlockmapColor,
    background: 0,
    grid32: 0,
    grid64: 0,
    blockmap: 0,
    oneSidedWall: 0,
    changeFloorHeight: 0,
    changeCeilHeight: 0,
    floorAndCeilEqual: 0,
    noChangeInHeight: 0,
    redDoor: 0,
    blueDoor: 0,
    yellowDoor: 0,
    teleporter: 0,
    secretArea: 0,
    exit: 0,
};

export const mapPalettes = [dsdaPalette, eternityPalette, omgifolPalette] as const;
