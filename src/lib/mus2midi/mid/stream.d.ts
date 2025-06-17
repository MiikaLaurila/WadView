/// <reference types="node" />
export declare class MemStream {
    private size;
    private position;
    private data;
    write(buffer: Buffer): void;
    read(length: number): Buffer;
}
