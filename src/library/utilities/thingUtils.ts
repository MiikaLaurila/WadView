import { WadMapThingGroupRenderable } from '../../interfaces/wad/map/WadMapThing';

export const getThingColor = (thingGroup: WadMapThingGroupRenderable): string => {
    if (thingGroup === WadMapThingGroupRenderable.OTHER) {
        return 'lime';
    } else if (thingGroup === WadMapThingGroupRenderable.MONSTER) {
        return 'red';
    } else if (thingGroup === WadMapThingGroupRenderable.POWERUP) {
        return 'cyan';
    } else if (thingGroup === WadMapThingGroupRenderable.ARTIFACT) {
        return 'magenta';
    } else if (thingGroup === WadMapThingGroupRenderable.KEY) {
        return 'yellow';
    } else if (thingGroup === WadMapThingGroupRenderable.WEAPON) {
        return 'blue';
    } else if (thingGroup === WadMapThingGroupRenderable.AMMO) {
        return 'navy';
    } else return 'white';
};
