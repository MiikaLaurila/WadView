export enum WadThingMonster {
    ARACHNOTRON = 68,
    ARCHVILE = 64,
    BARON_OF_HELL = 3003,
    CACODEMON = 3005,
    COMMANDER_KEEN = 72,
    CYBERDEMON = 16,
    DEMON = 3002,
    HEAVY_WEAPON_DUDE = 65,
    HELL_KNIGHT = 69,
    IMP = 3001,
    LOST_SOUL = 3006,
    MANCUBUS = 67,
    PAIN_ELEMENTAL = 71,
    REVENANT = 66,
    SHOTGUN_GUY = 9,
    SPECTRE = 58,
    SPIDERDEMON = 7,
    WOLFENSTEIN_SS = 84,
    ZOMBIEMAN = 3004,
}

export enum WadThingWeapon {
    BFG_9000 = 2006,
    CHAINGUN = 2002,
    CHAINSAW = 2005,
    PLASMA_GUN = 2004,
    ROCKET_LAUNCHER = 2003,
    SHOTGUN = 2001,
    SUPER_SHOTGUN = 82,
}

export enum WadThingAmmo {
    SHOTGUN_SHELLS = 2008,
    BOX_OF_BULLETS = 2048,
    BOX_OF_ROCKETS = 2046,
    BOX_OF_SHELLS = 2049,
    CLIP = 2007,
    ENERGY_CELL = 2047,
    ENERGY_CELL_PACK = 17,
    ROCKET = 2010,
}

export enum WadThingArtifact {
    ARMOR_BONUS = 2015,
    BERSERK = 2023,
    COMPUTER_AREA_MAP = 2026,
    HEALTH_BONUS = 2014,
    INVULNERABILITY = 2022,
    LIGHT_VISOR = 2045,
    MEGASPHERE = 83,
    PARTIAL_INVISIBILITY = 2024,
    SUPERCHARGE = 2013,
}

export enum WadThingPowerup {
    ARMOR = 2018,
    BACKPACK = 8,
    MEDIKIT = 2012,
    MEGAARMOR = 2019,
    RADIATION_SUIT = 2025,
    STIMPACK = 2011,
}

export enum WadThingKey {
    BLUE_KEY_CARD = 5,
    BLUE_KEY_SKULL = 40,
    RED_KEY_CARD = 13,
    RED_KEY_SKULL = 38,
    YELLOW_KEY_CARD = 6,
    YELLOW_KEY_SKULL = 39,
}

export const WadThing = { ...WadThingMonster, ...WadThingWeapon, ...WadThingAmmo, ...WadThingPowerup, ...WadThingKey };
export type WadThingType = WadThingMonster | WadThingWeapon | WadThingAmmo | WadThingPowerup | WadThingKey;

export interface WadMapThing {
    xPos: number;
    yPos: number;
    angle: number;
    thingType: WadThingType;
    thingTypeString: string;
    flags: number;
}