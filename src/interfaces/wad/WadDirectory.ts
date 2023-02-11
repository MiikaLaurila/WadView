export interface WadDirectoryEntry {
    lumpLocation: number;
    lumpSize: number;
    lumpName: string;
}
export type WadDirectory = WadDirectoryEntry[];
