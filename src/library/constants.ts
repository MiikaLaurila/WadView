export const mapLumps = [
    'THINGS',
    'LINEDEFS',
    'SIDEDEFS',
    'VERTEXES',
    'SEGS',
    'SSECTORS',
    'NODES',
    'SECTORS',
    'REJECT',
    'BLOCKMAP',
] as const;
export type MapLump = (typeof mapLumps)[number];
export const isMapLump = (lumpName: unknown): lumpName is MapLump => {
    return mapLumps.includes(lumpName as MapLump);
};

export const playpalLumpName = 'PLAYPAL';
export const colormapLumpName = 'COLORMAP';
export const endoomLumpName = 'ENDOOM';
export const dehackedLumpName = 'DEHACKED';
export const texture1LumpName = 'TEXTURE1';
export const texture2LumpName = 'TEXTURE2';
export const pnamesLumpName = 'PNAMES';

export const defaultSidebarWidth = 200;
export const defaultTopbarHeight = 40;

export const corsProxy = 'https://wadviewproxy.servegame.com/';
