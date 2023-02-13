import { styled } from '@mui/material';
import React, { useEffect, useReducer, useState } from 'react';
import { type Point } from '../interfaces/Point';
import { type WadMap } from '../interfaces/wad/map/WadMap';
import { isBlueDoor, isExit, isRedDoor, isTeleporter, isYellowDoor } from '../interfaces/wad/map/WadMapLinedef';
import {
    WadMapThingGroupHidden,
    WadMapThingGroupRenderable,
    WadThingAmmoKeys,
    WadThingArtifactKeys,
    WadThingDecorationKeys,
    WadThingMonsterKeys,
    WadThingObstacleKeys,
    WadThingOtherKeys,
    WadThingPowerupKeys,
    WadThingWeaponKeys,
    type WadMapThing,
} from '../interfaces/wad/map/WadMapThing';
import { type WadPlayPalTypedEntry } from '../interfaces/wad/WadPlayPal';
import { defaultSidebarWidth, defaultTopbarHeight } from '../library/constants';
import { diff } from '../library/utilities/mathUtils';
import { getThingColor } from '../library/utilities/thingUtils';
import MovableCanvas from './MovableCanvas';

interface Props {
    mapData: WadMap;
    playPal: WadPlayPalTypedEntry;
    wadName: string;
}
interface Bounds {
    top: number;
    left: number;
    bottom: number;
    right: number;
}
interface Dimensions {
    height: number;
    width: number;
    scale: number;
    offset: {
        x: number;
        y: number;
    };
}
interface HoverData {
    x: number;
    y: number;
    things: WadMapThing[];
}
interface LineCacheEntry {
    vStart: Point;
    vEnd: Point;
    color: string;
}
interface ThingCacheEntry {
    pos: Point;
    isDot: boolean;
    color: string;
    size: number;
    trianglePoints?: [Point, Point, Point];
    text?: string;
    textWidth?: number;
}
let lineCache: Record<string, LineCacheEntry[]> = {};
let thingCache: Record<string, ThingCacheEntry[]> = {};
let lastDimensions: Dimensions = { height: 0, width: 0, scale: 0, offset: { x: 0, y: 0 } };
let lastBounds: Bounds = { left: 0, right: 0, top: 0, bottom: 0 };
let lastCanvasHeight = 0;
export const AutoMap: React.FC<Props> = (props: Props) => {
    const widthPadding = defaultSidebarWidth + 90;
    const heightPadding = defaultTopbarHeight + 160;
    const [maxWidth, setMaxWidth] = useState(window.innerWidth - widthPadding);
    const [maxHeight, setMaxHeight] = useState(window.innerHeight - heightPadding);
    const [renderFull, setRenderFull] = useState(false);
    const [toggledThingGroups, setToggledThings] = useState<WadMapThingGroupRenderable[]>([]);
    const [hoverData, setHoverData] = useState<HoverData | null>(null);
    const [showMultiPlayer, setShowMultiPlayer] = useState(0);
    const [showDifficulty, setShowDifficulty] = useState(0);
    const [hideDifficulty, setHideDifficulty] = useState(0);
    const [showGrid, setShowGrid] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, forceUpdate] = useReducer((x: number) => x + 1, 0);
    const canvasPadding = 10;
    const maxResImage = 10000;

    const { mapData, playPal, wadName } = props;

    useEffect(() => {
        const resizeListener = (): void => {
            setMaxWidth(window.innerWidth - widthPadding);
            setMaxHeight(window.innerHeight - heightPadding);
        };
        const boundListener = resizeListener.bind(this);
        window.addEventListener('resize', boundListener);
        return () => {
            window.removeEventListener('resize', boundListener);
        };
    }, [heightPadding, widthPadding]);

    useEffect(() => {
        thingCache = {};
        lineCache = {};
        forceUpdate();
    }, [toggledThingGroups, showMultiPlayer, showDifficulty, hideDifficulty, showGrid]);

    if (!playPal || !mapData) return null;

    const thingIsRenderable = (t: WadMapThing, ignoreSelectedThingGroups: boolean = false): boolean => {
        if (!toggledThingGroups.includes(t.thingGroup as WadMapThingGroupRenderable) && !ignoreSelectedThingGroups) return false;
        if (showMultiPlayer === 0 && t.flagsString.includes('NET_ONLY')) return false;
        if (showMultiPlayer === 2 && !t.flagsString.includes('NET_ONLY')) return false;
        if (showDifficulty === 1 && !t.flagsString.includes('ON_SKILL_EASY')) return false;
        if (showDifficulty === 2 && !t.flagsString.includes('ON_SKILL_MEDIUM')) return false;
        if (showDifficulty === 3 && !t.flagsString.includes('ON_SKILL_HARD')) return false;
        if (hideDifficulty === 1 && t.flagsString.includes('ON_SKILL_EASY')) return false;
        if (hideDifficulty === 2 && t.flagsString.includes('ON_SKILL_MEDIUM')) return false;
        if (hideDifficulty === 3 && t.flagsString.includes('ON_SKILL_HARD')) return false;
        return true;
    };

    const thingIsInStats = (t: WadMapThing): boolean => {
        if (t.thingGroup === WadMapThingGroupHidden.DECORATION || t.thingGroup === WadMapThingGroupHidden.OBSTACLE) {
            return true;
        } else return thingIsRenderable(t, true);
    };

    const clearHover = (): void => {
        setHoverData(null);
    };

    const getBounds = (): Bounds => {
        let top = mapData.vertices[0].y;
        let left = mapData.vertices[0].x;
        let bottom = mapData.vertices[0].y;
        let right = mapData.vertices[0].x;
        for (let i = 1; i < mapData.vertices.length; i++) {
            if (mapData.vertices[i].x < left) left = mapData.vertices[i].x;
            if (mapData.vertices[i].x > right) right = mapData.vertices[i].x;
            if (mapData.vertices[i].y < top) top = mapData.vertices[i].y;
            if (mapData.vertices[i].y > bottom) bottom = mapData.vertices[i].y;
        }
        return { top, left, bottom, right };
    };
    const bounds = getBounds();

    const getDimensions = (): Dimensions => {
        const mapWidth = bounds.right - bounds.left;
        const mapHeight = bounds.bottom - bounds.top;
        let maxW = maxWidth;
        let maxH = maxHeight;
        let scale = 1;
        if (renderFull) {
            if (mapWidth * mapHeight * 2 < maxResImage * maxResImage) {
                maxW = mapWidth * 2;
                maxH = mapHeight * 2;
            } else {
                maxW = maxResImage;
                maxH = maxResImage;
            }
        }
        if (maxW > maxH) {
            scale = maxH / mapHeight;
            if (mapWidth > mapHeight) {
                scale = maxW / mapWidth;
                if (Math.floor(mapHeight * scale - 1) > maxH) {
                    scale = maxH / mapHeight;
                }
            }
        } else if (maxH > maxW) {
            scale = maxW / mapWidth;
            if (mapHeight > mapWidth) {
                scale = maxH / mapHeight;
                if (Math.floor(mapWidth * scale - 1) > maxW) {
                    scale = maxW / mapWidth;
                }
            }
        } else {
            if (mapWidth > mapHeight) {
                scale = maxW / mapWidth;
            } else if (mapHeight > mapWidth) {
                scale = maxH / mapHeight;
            }
        }
        const offset = {
            x: (maxW - mapWidth * scale) / 2,
            y: (maxH - mapHeight * scale) / 2 - 2,
        };
        return { height: maxH, width: maxW, scale, offset };
    };
    const dim = getDimensions();

    const compareDimensions = (dim: Dimensions): boolean => {
        if (lastDimensions.height !== dim.height) return false;
        if (lastDimensions.width !== dim.width) return false;
        if (lastDimensions.scale !== dim.scale) return false;
        if (lastDimensions.offset.x !== dim.offset.x) return false;
        if (lastDimensions.offset.y !== dim.offset.y) return false;
        return true;
    };

    const getScalar = (): number => {
        return Math.min(diff(bounds.top, bounds.bottom), maxResImage) / Math.max(dim.height, dim.width);
    };

    const getDotSize = (size: number): number => {
        return (size + 5) * dim.scale;
    };

    const onMouseMove = (canvasPos: Point, realPos: Point): void => {
        const newPoint = canvasPos;
        newPoint.y *= -1;
        newPoint.x -= canvasPadding;
        newPoint.y += lastCanvasHeight - canvasPadding;
        newPoint.x -= lastDimensions.offset.x;
        newPoint.y -= lastDimensions.offset.y;
        newPoint.x /= lastDimensions.scale;
        newPoint.y /= lastDimensions.scale;
        newPoint.x += lastBounds.left;
        newPoint.y += lastBounds.top;

        const isInsideBoundingBox = (a: Point, b: Point, size: number): boolean => {
            const halfSize = size / 2;
            return (Math.abs(a.x - b.x) <= halfSize && Math.abs(a.y - b.y) <= halfSize);
        };
        const things = mapData.things
            .filter(t => thingIsRenderable(t))
            .filter(t => isInsideBoundingBox(newPoint, { x: t.x, y: t.y }, t.size + 5));
        if (things.length > 0) {
            setHoverData({ x: realPos.x, y: realPos.y, things });
        } else if (hoverData) {
            setHoverData(null);
        }
    };

    const transformMapPointToCanvas = (p: Point, canvas: HTMLCanvasElement): Point => {
        let xTemp = p.x;
        let yTemp = p.y;
        xTemp -= bounds.left;
        yTemp -= bounds.top;
        xTemp *= dim.scale;
        yTemp *= dim.scale;
        xTemp += dim.offset.x;
        yTemp += dim.offset.y;
        xTemp += canvasPadding;
        yTemp += canvasPadding;
        yTemp = canvas.height - yTemp;
        return { x: xTemp, y: yTemp };
    };
    const transformMapYToCanvas = (y: number, canvas: HTMLCanvasElement): number => {
        let yTemp = y;
        yTemp -= bounds.top;
        yTemp *= dim.scale;
        yTemp += dim.offset.y;
        yTemp += canvasPadding;
        yTemp = canvas.height - yTemp;
        return yTemp;
    };
    const transformMapXToCanvas = (x: number): number => {
        let xTemp = x;
        xTemp -= bounds.left;
        xTemp *= dim.scale;
        xTemp += dim.offset.x;
        xTemp += canvasPadding;
        return xTemp;
    };

    const drawInit = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
        ctx.fillStyle = playPal[0].hex;
        ctx.fillRect(-canvas.width * 10, -canvas.height * 10, canvas.width * 20, canvas.height * 20);
    };

    const drawLines = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        lineWidth: number,
        useCache: boolean,
    ): void => {
        if (useCache && Object.keys(lineCache).length > 0) {
            Object.keys(lineCache).forEach((key: string) => {
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = key;
                ctx.beginPath();
                lineCache[key].forEach((line) => {
                    ctx.moveTo(line.vStart.x, line.vStart.y);
                    ctx.lineTo(line.vEnd.x, line.vEnd.y);
                });
                ctx.stroke();
            });
        } else {
            lineCache = {};
            mapData.linedefs
                .sort((a, b) => {
                    const aB = a.flagsString.includes('TWO_SIDED');
                    const bB = b.flagsString.includes('TWO_SIDED');
                    if (aB === bB) return 0;
                    else if (aB) return 1;
                    else return -1;
                })
                .forEach((line) => {
                    const vStart = transformMapPointToCanvas({ ...mapData.vertices[line.start] }, canvas);
                    const vEnd = transformMapPointToCanvas({ ...mapData.vertices[line.end] }, canvas);

                    let color = 'cyan';
                    const frontSide = { ...mapData.sidedefs[line.frontSideDef] };
                    const frontSector = { ...mapData.sectors[frontSide.sector] };
                    const fSectorFloor = frontSector.floorHeight;
                    const fSectorCeil = frontSector.ceilingHeight;
                    const isSecretSector = frontSector.specialType === 9;
                    const isHiddenSecret = line.flagsString.includes('SECRET');
                    const isTwoSided = line.backSideDef !== 65535;
                    if (isBlueDoor(line.specialType)) {
                        color = playPal[200].hex;
                    } else if (isRedDoor(line.specialType)) {
                        color = playPal[176].hex;
                    } else if (isYellowDoor(line.specialType)) {
                        color = playPal[231].hex;
                    } else if (isExit(line.specialType)) {
                        color = playPal[112].hex;
                    } else if (isTeleporter(line.specialType)) {
                        color = playPal[121].hex;
                    } else if (isTwoSided && !isHiddenSecret) {
                        const backSide = { ...mapData.sidedefs[line.backSideDef] };
                        const backSector = { ...mapData.sectors[backSide.sector] };
                        const bSectorFloor = backSector.floorHeight;
                        const bSectorCeil = backSector.ceilingHeight;
                        if (fSectorFloor !== bSectorFloor) {
                            color = playPal[55].hex;
                        } else if (fSectorCeil !== bSectorCeil) {
                            color = playPal[215].hex;
                        } else if (fSectorCeil === bSectorCeil && fSectorFloor === bSectorFloor) {
                            color = playPal[100].hex;
                        }
                    } else if (isSecretSector && !isHiddenSecret) {
                        color = playPal[252].hex;
                    } else {
                        color = playPal[180].hex;
                    }

                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                    ctx.beginPath();
                    ctx.moveTo(vStart.x, vStart.y);
                    ctx.lineTo(vEnd.x, vEnd.y);
                    ctx.stroke();
                    if (!lineCache[color]) lineCache[color] = [];
                    lineCache[color].push({ vStart, vEnd, color });
                });
        }
    };

    const drawTriangle = (
        ctx: CanvasRenderingContext2D,
        centerX: number,
        centerY: number,
        size: number,
        rotation: number,
    ): [Point, Point, Point] => {
        const rot = (-rotation * Math.PI / 180) + Math.PI / 2;
        const height = Math.sin(90 * Math.PI / 180) * size;
        const width = size;

        const v1 = {
            x: centerX - (width / 2) * Math.cos(rot) - (height / 2) * Math.sin(rot),
            y: centerY - (width / 2) * Math.sin(rot) + (height / 2) * Math.cos(rot),
        };
        const v2 = {
            x: centerX + (width / 2) * Math.cos(rot) - (height / 2) * Math.sin(rot),
            y: centerY + (width / 2) * Math.sin(rot) + (height / 2) * Math.cos(rot),
        };
        const v3 = {
            x: centerX + (height / 2) * Math.sin(rot),
            y: centerY - (height / 2) * Math.cos(rot),
        };

        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.lineTo(v3.x, v3.y);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
        return [v1, v2, v3];
    };

    const drawThings = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        lineWidth: number,
        useCache: boolean,
    ): void => {
        if (useCache && Object.keys(thingCache).length > 0) {
            Object.keys(thingCache).forEach((key: string) => {
                ctx.lineWidth = lineWidth;

                thingCache[key].forEach((thing, idx, arr) => {
                    ctx.beginPath();
                    const scaledDotSize = getDotSize(thing.size - idx * (thing.size / arr.length));
                    const x = thing.pos.x;
                    const y = thing.pos.y;
                    ctx.strokeStyle = thing.color;
                    ctx.fillStyle = thing.color;
                    if (thing.isDot) {
                        ctx.fillRect(x - scaledDotSize / 2, y - scaledDotSize / 2, scaledDotSize, scaledDotSize);
                    } else if (thing.trianglePoints) {
                        const points = thing.trianglePoints;
                        ctx.moveTo(points[0].x, points[0].y);
                        ctx.lineTo(points[1].x, points[1].y);
                        ctx.lineTo(points[2].x, points[2].y);
                        ctx.closePath();
                    }
                    ctx.stroke();
                });
            });
        } else {
            thingCache = {};
            ctx.lineWidth = lineWidth;
            mapData.things
                .filter(t => thingIsRenderable(t))
                .forEach((thing) => {
                    const xy = transformMapPointToCanvas({ x: thing.x, y: thing.y }, canvas);
                    const x = xy.x;
                    const y = xy.y;
                    const cacheKey = `${x}|${y}`;
                    const color = getThingColor(thing.thingGroup as WadMapThingGroupRenderable);
                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;
                    const isDot = thing.thingGroup !== WadMapThingGroupRenderable.MONSTER;
                    const dotSize = getDotSize(thing.size);
                    if (isDot) {
                        ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
                        if (!thingCache[cacheKey]) thingCache[cacheKey] = [];
                        thingCache[cacheKey].push({ pos: { x, y }, color, isDot, size: thing.size });
                    } else {
                        const trianglePoints = drawTriangle(ctx, x, y, dotSize, thing.angle);
                        if (!thingCache[cacheKey]) thingCache[cacheKey] = [];
                        thingCache[cacheKey].push({ pos: { x, y }, color, isDot, trianglePoints, size: thing.size });
                    }
                });
        }
    };

    const drawGrid = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, lineWidth: number): void => {
        const colCount = mapData.blockMap.columns;
        const rowCount = mapData.blockMap.rows;
        const gridSize = 128;
        const gridColor = playPal[107].hex;
        const x0Orig = mapData.blockMap.xOrigin;
        const y0Orig = mapData.blockMap.yOrigin;
        const x1Orig = x0Orig + colCount * gridSize;
        const y1Orig = y0Orig + rowCount * gridSize;
        const xy0 = transformMapPointToCanvas({ x: x0Orig, y: y0Orig }, canvas);
        const xy1 = transformMapPointToCanvas({ x: x1Orig, y: y1Orig }, canvas);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        for (let i = 0; i < rowCount + 1; i++) {
            const yStart = transformMapYToCanvas(y0Orig + i * gridSize, canvas);
            ctx.moveTo(xy0.x, yStart);
            ctx.lineTo(xy1.x, yStart);
        }

        for (let i = 0; i < colCount + 1; i++) {
            const xStart = transformMapXToCanvas(x0Orig + i * gridSize);
            ctx.moveTo(xStart, xy0.y);
            ctx.lineTo(xStart, xy1.y);
        }
        ctx.stroke();
    };

    const drawFunc = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number): boolean => {
        const bounds = getBounds();
        const scalar = getScalar();
        const lineWidth = renderFull ? 2 / scalar : 1.5 / scale;
        const useCache = compareDimensions(dim);
        drawInit(canvas, ctx);
        if (showGrid) {
            drawGrid(canvas, ctx, lineWidth);
        }
        drawLines(canvas, ctx, lineWidth, useCache);
        drawThings(canvas, ctx, lineWidth, useCache);

        lastDimensions = JSON.parse(JSON.stringify(dim));
        lastBounds = JSON.parse(JSON.stringify(bounds));
        lastCanvasHeight = canvas.height;

        return renderFull;
    };

    const handleDifficulty = (type: 'show' | 'hide', state: number): void => {
        if (type === 'show') {
            if (hideDifficulty !== 0) {
                setHideDifficulty(0);
            }
            setShowDifficulty(state);
        } else {
            if (showDifficulty !== 0) {
                setShowDifficulty(0);
            }
            setHideDifficulty(state);
        }
    };

    const getHoverData = (data: HoverData): JSX.Element[] => {
        let cumulativeHeight = 0;
        const width = 220;
        return data.things.map((t, idx) => {
            const flagRoom = t.flagsString.length * 20;
            const height = 70 + flagRoom;
            cumulativeHeight += height + 5;
            const top = data.y - 10 - cumulativeHeight - window.scrollY;
            let left = data.x - 90;
            if (idx > 2 && idx % 2 === 0) {
                left += ((idx - 2) / 2) * (width + 10);
            } else if (idx > 2) {
                left -= ((idx - 2) / 2) * (width + 10) + width / 2;
            }
            return (
                <div
                    key={`${JSON.stringify(t)}${idx}`}
                    style={{
                        position: 'fixed',
                        top: idx < 3 ? top : data.y - 85 - flagRoom,
                        left,
                        border: '1px solid black',
                        backgroundColor: 'white',
                        width: `${width}px`,
                        height: `${height}px`,
                        fontSize: '12px',
                        paddingLeft: '2px',
                    }}
                >
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        TYPE:
                        <span style={{ fontWeight: 'normal' }}> {`${t.thingType} | ${t.thingTypeString}`}</span>
                    </span>
                    <br />
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        GRP:
                        <span style={{ fontWeight: 'normal' }}> {t.thingGroup}</span>
                    </span>
                    <br />
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        POS:
                        <span style={{ fontWeight: 'normal' }}> {`(${t.x},${t.y}) | ${t.angle}`}</span>
                    </span>
                    <br />
                    <span style={{ fontWeight: 'bold' }}>FLAGS: </span>
                    {t.flagsString.map((f) => {
                        return (
                            <React.Fragment key={`${t.x}${t.y}${t.thingType}${f}`}>
                                <br />
                                <span>{f}</span>
                            </React.Fragment>
                        );
                    })}
                </div>
            );
        });
    };

    const PNoMargin = styled('p')(() => ({
        margin: 0,
        padding: 0,
    }));
    const StatDiv = styled('div')(() => ({
        paddingRight: '8px',
        marginLeft: '8px',
        borderRight: '1px solid black',
        '&:first-of-type': {
            marginLeft: 0,
        },
        '&:last-of-type': {
            borderRight: 'unset',
        },
    }));

    const getStatDiv = (header: string, keys: Readonly<string[]>): JSX.Element => {
        const width = '150px';
        const thingArr = props.mapData.things.filter(t => thingIsInStats(t));
        // const thingArr = props.mapData.things;
        return (
            <StatDiv>
                <PNoMargin style={{ fontWeight: 'bold' }}>
                    <span style={{ display: 'inline-block', width }}>{header}</span>
                    {thingArr.filter((t) => keys.includes(t.thingTypeString)).length}
                </PNoMargin>
                {[...keys]
                    .sort((a, b) => a.localeCompare(b))
                    .map((k) => {
                        return (
                            <PNoMargin key={k}>
                                <span style={{ display: 'inline-block', width }}>
                                    {k.toLocaleLowerCase().replaceAll('_', ' ')}
                                </span>
                                {thingArr.filter((t) => t.thingTypeString === k).length}
                            </PNoMargin>
                        );
                    })}
            </StatDiv>
        );
    };

    const getStatsText = (): string => {
        let text = 'STATS';
        if (showMultiPlayer === 0) text += ' | without NET things';
        if (showMultiPlayer === 2) text += ' | only NET things';
        if (showDifficulty === 1) text += ' | only EASY skill things';
        if (showDifficulty === 2) text += ' | only MEDIUM skill things';
        if (showDifficulty === 3) text += ' | only HARD skill things';
        if (hideDifficulty === 1) text += ' | without EASY skill things';
        if (hideDifficulty === 2) text += ' | without MEDIUM skill things';
        if (hideDifficulty === 3) text += ' | without HARD skill things';
        if (showMultiPlayer === 1 && showDifficulty === 0 && hideDifficulty === 0) text += ' | with ALL things';
        return text;
    };

    return (
        <>
            <div style={{ margin: '20px' }}>
                <MovableCanvas
                    canvasWidth={dim.width + canvasPadding * 2}
                    canvasHeight={dim.height + canvasPadding * 2}
                    drawFunc={drawFunc}
                    imageName={`${wadName}-${mapData.name}`}
                    onFullSave={() => {
                        setRenderFull(true);
                    }}
                    onFullSaveComplete={() => {
                        setRenderFull(false);
                    }}
                    onMouseMove={onMouseMove}
                    clearHover={clearHover}
                    toggledThingGroups={toggledThingGroups}
                    onThingToggle={(toggleList, forceState?: 'on' | 'off') => {
                        let copy = [...toggledThingGroups];
                        if (forceState === 'on') {
                            setToggledThings(toggleList);
                        } else if (forceState === 'off') {
                            setToggledThings([]);
                        } else {
                            toggleList.forEach((toggle) => {
                                const index = toggledThingGroups.findIndex((t) => t === toggle);
                                if (index >= 0) {
                                    copy.splice(index, 1);
                                } else if (index < 0) {
                                    copy = [...copy, toggle];
                                }
                            });
                            setToggledThings(copy);
                        }
                    }}
                    showMultiPlayer={showMultiPlayer}
                    onMultiPlayerToggle={(state) => {
                        setShowMultiPlayer(state % 3);
                    }}
                    showDifficulty={showDifficulty}
                    onShowDifficultyToggle={(state) => {
                        handleDifficulty('show', state % 4);
                    }}
                    hideDifficulty={hideDifficulty}
                    onHideDifficultyToggle={(state) => {
                        handleDifficulty('hide', state % 4);
                    }}
                    showGrid={showGrid}
                    onShowGridToggle={setShowGrid}
                    playPal={playPal}
                />
                <p style={{ fontSize: '9px', margin: 0 }}>
                    Canvas pan/zoom component shamelessly yoinked from
                    <a
                        href="https://gist.github.com/robinovitch61/483190546bf8f0617d2cd510f3b4b86d"
                        target="_blank"
                        rel="noreferrer"
                    >
                        @robinovitch61
                    </a>
                </p>
                <div style={{ fontSize: '12px' }}>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '16px' }}>{getStatsText()}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {getStatDiv('MONSTERS', WadThingMonsterKeys)}
                        {getStatDiv('POWERUPS', WadThingPowerupKeys)}
                        {getStatDiv('ARTIFACTS', WadThingArtifactKeys)}
                        {getStatDiv('WEAPONS', WadThingWeaponKeys)}
                        {getStatDiv('AMMO', WadThingAmmoKeys)}
                        {getStatDiv('OTHER', WadThingOtherKeys)}
                        {getStatDiv('OBSTACLES', WadThingObstacleKeys)}
                        {getStatDiv('DECORATIONS', WadThingDecorationKeys)}
                    </div>
                </div>
            </div>
            {hoverData && hoverData.things.length > 0 && getHoverData(hoverData)}
        </>
    );
};
