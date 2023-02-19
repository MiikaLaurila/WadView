import { WadMapThingGroup } from '../../interfaces/wad/map/WadMapThing';

export const getThingColor = (thingGroup: WadMapThingGroup | 'ALL' | 'DECO'): string => {
    if (thingGroup === WadMapThingGroup.OTHER) {
        return 'lime';
    } else if (thingGroup === WadMapThingGroup.MONSTER) {
        return 'red';
    } else if (thingGroup === WadMapThingGroup.POWERUP) {
        return 'blue';
    } else if (thingGroup === WadMapThingGroup.ARTIFACT) {
        return 'cyan';
    } else if (thingGroup === WadMapThingGroup.KEY) {
        return 'magenta';
    } else if (thingGroup === WadMapThingGroup.WEAPON) {
        return 'yellow';
    } else if (thingGroup === WadMapThingGroup.AMMO) {
        return '#ad7e0a';
    } else if (thingGroup === WadMapThingGroup.OBSTACLE || thingGroup === WadMapThingGroup.DECORATION || thingGroup === 'DECO') {
        return 'pink';
    } else if (thingGroup === 'ALL') {
        return 'white';
    } else return 'black';
};
