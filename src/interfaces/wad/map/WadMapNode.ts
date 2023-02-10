import { type WadMapBBox } from './WadMapBBox';

export enum WadMapNodeChildType {
    SUBNODE = 'SUBNODE',
    SUBSECTOR = 'SUBSECTOR',
}

export interface WadMapNode {
    xPartStart: number;
    yPartStart: number;
    xPartChange: number;
    yPartChange: number;
    rightBBoxRaw: number[];
    rightBBox: WadMapBBox;
    leftBBoxRaw: number[];
    leftBBox: WadMapBBox;
    rightChildRaw: number;
    rightChild: number;
    rightChildType: WadMapNodeChildType;
    leftChildRaw: number;
    leftChild: number;
    leftChildType: WadMapNodeChildType;
}
