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

export const defaultSidebarWidth = 200;
export const defaultTopbarHeight = 40;
