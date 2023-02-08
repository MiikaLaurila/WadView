export type WadPlayPalRaw = number[][];
export interface WadPlayPalColor {
    r: number;
    g: number;
    b: number;
    hex: string;
}
export type WadPlayPalTypedEntry = Array<WadPlayPalColor>;
export type WadPlayPalTyped = Array<WadPlayPalTypedEntry>;

export interface WadPlayPal {
    rawPlaypal: WadPlayPalRaw;
    typedPlaypal: WadPlayPalTyped;
}

export const defaultPlaypal: Readonly<WadPlayPal> = {
    rawPlaypal: [],
    typedPlaypal: [],
}