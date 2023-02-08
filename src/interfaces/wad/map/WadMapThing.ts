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

export enum WadThingObstacle {
    BROWN_STUMP = 47,
    BURNING_BARREL = 70,
    BURNT_TREE = 43,
    CANDELABRA = 35,
    EVIL_EYE = 41,
    EXPLODING_BARREL = 2035,
    FIVE_SKULLS_SHISH_KEBAB = 28,
    FLOATING_SKULL = 42,
    FLOOR_LAMP = 2028,
    HANGING_LEG = 53,
    HANGING_PAIR_OF_LEGS = 52,
    HANGING_TORSO_BRAIN_REMOVED = 78,
    HANGING_TORSO_LOOKING_DOWN = 75,
    HANGING_TORSO_LOOKING_UP = 77,
    HANGING_TORSO_OPEN_SKULL = 76,
    HANGING_VICTIM_ARMS_OUT = 50,
    HANGING_VICTIM_GUTS_AND_BRAIN_REMOVED = 74,
    HANGING_VICTIM_GUTS_REMOVED = 73,
    HANGING_VICTIM_ONE_LEGGED = 51,
    HANGING_VICTIM_TWITCHING = 49,
    IMPALED_HUMAN = 25,
    LARGE_BROWN_TREE = 54,
    PILE_OF_SKULLS_AND_CANDLES = 29,
    SHORT_BLUE_FIRESTICK = 55,
    SHORT_GREEN_FIRESTICK = 56,
    SHORT_GREEN_PILLAR = 31,
    SHORT_GREEN_PILLAR_WITH_BEATING_HEART = 36,
    SHORT_RED_FIRESTICK = 57,
    SHORT_RED_PILLAR = 33,
    SHORT_RED_PILLAR_WITH_SKULL = 37,
    SHORT_TECHNO_FLOOR_LAMP = 86,
    SKULL_ON_A_POLE = 27,
    TALL_BLUE_FIRESTICK = 44,
    TALL_GREEN_FIRESTICK = 45,
    TALL_GREEN_PILLAR = 30,
    TALL_RED_FIRESTICK = 46,
    TALL_RED_PILLAR = 32,
    TALL_TECHNO_COLUMN = 48,
    TALL_TECHNO_FLOOR_LAMP = 85,
    TWITCHING_IMPALED_HUMAN = 26,
}

export enum WadThingDecoration {
    BLOODY_MESS = 10,
    BLOODY_MESS_2 = 12,
    CANDLE = 34,
    DEAD_CACODEMON = 22,
    DEAD_DEMON = 21,
    DEAD_FORMER_HUMAN = 18,
    DEAD_FORMER_SERGEANT = 19,
    DEAD_IMP = 20,
    DEAD_LOST_SOUL = 23,
    DEAD_PLAYER = 15,
    HANGING_LEG = 62,
    HANGING_PAIR_OF_LEGS = 60,
    HANGING_VICTIM_ARMS_OUT = 59,
    HANGING_VICTIM_ONE_LEGGED = 61,
    HANGING_VICTIM_TWITCHING = 63,
    POOL_OF_BLOOD = 79,
    POOL_OF_BLOOD_2 = 80,
    POOL_OF_BLOOD_AND_FLESH = 24,
    POOL_OF_BRAINS = 81,
}

export enum WadThingOther {
    DEATHMATCH_START = 11,
    MONSTER_SPAWNER = 89,
    PLAYER_1_START = 1,
    PLAYER_2_START = 2,
    PLAYER_3_START = 3,
    PLAYER_4_START = 4,
    ROMEROS_HEAD = 88,
    SPAWN_SPOT = 87,
    TELEPORT_LANDING = 14,
}

export const WadThing = {
    ...WadThingMonster,
    ...WadThingWeapon,
    ...WadThingAmmo,
    ...WadThingArtifact,
    ...WadThingPowerup,
    ...WadThingKey,
    ...WadThingObstacle,
    ...WadThingDecoration,
    ...WadThingOther
};
export type WadThingType =
    WadThingMonster
    | WadThingWeapon
    | WadThingAmmo
    | WadThingArtifact
    | WadThingPowerup
    | WadThingKey
    | WadThingObstacle
    | WadThingDecoration
    | WadThingOther;

export enum WadMapThingFlag {
    ON_SKILL_EASY = 0x0001,
    ON_SKILL_MEDIUM = 0x0002,
    ON_SKILL_HARD = 0x0004,
    AMBUSH = 0x0008,
    NET_ONLY = 0x0010,
}

export const extractWadMapThingFlags = (flags: number) => {
    const foundFlags: string[] = [];
    const testFlag = (flag: WadMapThingFlag) => {
        if (flags & flag) foundFlags.push(WadMapThingFlag[flag]);
    }
    for (let f in WadMapThingFlag) {
        testFlag(WadMapThingFlag[f as keyof typeof WadMapThingFlag])
    }
    return foundFlags;
}

export interface WadMapThing {
    xPos: number;
    yPos: number;
    angle: number;
    thingType: WadThingType;
    thingTypeString: string;
    flags: number;
    flagsString: string[];
}