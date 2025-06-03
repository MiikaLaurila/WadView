import { WadMapThingGroup } from "wadview-lib";

export const getThingColor = (
	thingGroup: WadMapThingGroup | "ALL" | "DECO",
): string => {
	if (thingGroup === WadMapThingGroup.OTHER) {
		return "lime";
	}
	if (thingGroup === WadMapThingGroup.MONSTER) {
		return "red";
	}
	if (thingGroup === WadMapThingGroup.POWERUP) {
		return "blue";
	}
	if (thingGroup === WadMapThingGroup.ARTIFACT) {
		return "cyan";
	}
	if (thingGroup === WadMapThingGroup.KEY) {
		return "magenta";
	}
	if (thingGroup === WadMapThingGroup.WEAPON) {
		return "yellow";
	}
	if (thingGroup === WadMapThingGroup.AMMO) {
		return "#ad7e0a";
	}
	if (
		thingGroup === WadMapThingGroup.OBSTACLE ||
		thingGroup === WadMapThingGroup.DECORATION ||
		thingGroup === "DECO"
	) {
		return "pink";
	}
	if (thingGroup === "ALL") {
		return "white";
	}
	return "black";
};
