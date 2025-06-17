import type { Mod } from "./mod";

declare function loadMod(url: string): Promise<Mod>;

export = loadMod;
