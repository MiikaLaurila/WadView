import { WadPatch } from './WadPatch';

export interface WadTexturePatch {
    xOffset: number;
    yOffset: number;
    patchNum: number;
    stepDir: number;
    colormap: number;
}

export interface WadTexture {
    name: string;
    masked: boolean;
    width: number;
    height: number;
    colDir: number;
    patchCount: number;
    patches: WadTexturePatch[];
}

export interface WadTextures {
    patchNames: string[];
    patches: Record<string, WadPatch>;
    texture1: WadTexture[];
    texture2: WadTexture[];
}
