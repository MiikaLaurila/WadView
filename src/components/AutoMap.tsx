import { styled } from '@mui/material';
import React, { useEffect, useReducer, useState } from 'react';
import { type Point } from '../interfaces/Point';
import { type WadMap } from '../interfaces/wad/map/WadMap';
import {
    WadMapThingGroupHidden,
    WadThingAmmoKeys,
    WadThingArtifactKeys,
    WadThingDecorationKeys,
    WadThingMonsterKeys,
    WadThingObstacleKeys,
    WadThingOtherKeys,
    WadThingPowerupKeys,
    WadThingWeaponKeys,
    type WadMapThing,
    type WadMapThingGroupRenderable,
} from '../interfaces/wad/map/WadMapThing';
import { type WadMapVertex } from '../interfaces/wad/map/WadMapVertex';
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
    xPos: number;
    yPos: number;
    things: WadMapThing[];
}
interface LineCacheEntry {
    vStart: WadMapVertex;
    vEnd: WadMapVertex;
    color: string;
}
interface ThingCacheEntry {
    pos: WadMapVertex;
    isDot: boolean;
    color: string;
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
    const textSizeMagic = 16;
    const cirlcleSizeMagic = 16;
    const dotSizeMagic = 32;
    const maxResImage = 5000;

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
        let top = mapData.vertices[0].yPos;
        let left = mapData.vertices[0].xPos;
        let bottom = mapData.vertices[0].yPos;
        let right = mapData.vertices[0].xPos;
        for (let i = 1; i < mapData.vertices.length; i++) {
            if (mapData.vertices[i].xPos < left) left = mapData.vertices[i].xPos;
            if (mapData.vertices[i].xPos > right) right = mapData.vertices[i].xPos;
            if (mapData.vertices[i].yPos < top) top = mapData.vertices[i].yPos;
            if (mapData.vertices[i].yPos > bottom) bottom = mapData.vertices[i].yPos;
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

    const getDotSize = (size = dotSizeMagic): number => {
        return size / (diff(bounds.top, bounds.bottom) / Math.min(dim.height, dim.width));
    };

    const useDots = (): boolean => {
        return diff(bounds.top, bounds.bottom) > 5000;
    };

    const getTextSize = (size = textSizeMagic): number => {
        return Math.max(Math.round(size / getScalar()), 2);
    };

    const getCircleSize = (size = cirlcleSizeMagic): number => {
        return Math.max(Math.round(size / getScalar()), 2);
    };

    const mouseToMap = (canvasPos: Point, realPos: Point): void => {
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

        const pointInRadius = (a: number, b: number, x: number, y: number, r: number): boolean => {
            const distPoins = (a - x) * (a - x) + (b - y) * (b - y);
            r *= r;
            if (distPoins < r) {
                return true;
            }
            return false;
        };
        const circleSize = getCircleSize();
        const onlyDots = useDots();
        const dotSize = getDotSize();
        const things = mapData.things.filter(t => thingIsRenderable(t)).filter((t) => {
            const magicScalar = 194 * (onlyDots ? 3 / (dotSize * 0.5) : 3 / circleSize);
            const mapHeight = diff(bounds.top, bounds.bottom);
            if (pointInRadius(newPoint.x, newPoint.y, t.xPos, t.yPos, mapHeight / magicScalar)) {
                return true;
            } else return false;
        });
        if (things.length > 0) {
            setHoverData({ xPos: realPos.x, yPos: realPos.y, things });
        } else if (hoverData) {
            setHoverData(null);
        }
    };

    const transformMapPointToCanvas = (p: WadMapVertex, canvas: HTMLCanvasElement): WadMapVertex => {
        let xTemp = p.xPos;
        let yTemp = p.yPos;
        xTemp -= bounds.left;
        yTemp -= bounds.top;
        xTemp *= dim.scale;
        yTemp *= dim.scale;
        xTemp += dim.offset.x;
        yTemp += dim.offset.y;
        xTemp += canvasPadding;
        yTemp += canvasPadding;
        yTemp = canvas.height - yTemp;
        return { xPos: xTemp, yPos: yTemp };
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
                    ctx.moveTo(line.vStart.xPos, line.vStart.yPos);
                    ctx.lineTo(line.vEnd.xPos, line.vEnd.yPos);
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

                    let color = playPal[96].hex;
                    const frontSide = { ...mapData.sidedefs[line.frontSideDef] };
                    const frontSector = { ...mapData.sectors[frontSide.sector] };

                    const isSecretSector = frontSector.specialType === 9;
                    const isHiddenSecret = line.flagsString.includes('SECRET');
                    if (line.backSideDef !== -1 && !isHiddenSecret) {
                        const backSide = { ...mapData.sidedefs[line.backSideDef] };
                        const backSector = { ...mapData.sectors[backSide.sector] };
                        if (frontSector.floorHeight !== backSector.floorHeight) {
                            color = playPal[64].hex;
                        } else if (frontSector.ceilingHeight !== backSector.ceilingHeight) {
                            color = playPal[231].hex;
                        }
                    } else if (isSecretSector && !isHiddenSecret) {
                        color = playPal[252].hex;
                    } else {
                        color = playPal[176].hex;
                    }

                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                    ctx.beginPath();
                    ctx.moveTo(vStart.xPos, vStart.yPos);
                    ctx.lineTo(vEnd.xPos, vEnd.yPos);
                    ctx.stroke();
                    if (!lineCache[color]) lineCache[color] = [];
                    lineCache[color].push({ vStart, vEnd, color });
                });
        }
    };

    const drawThings = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        lineWidth: number,
        onlyDots: boolean,
        dotSize: number,
        textSize: number,
        circleSize: number,
        useCache: boolean,
    ): void => {
        if (useCache && Object.keys(thingCache).length > 0) {
            Object.keys(thingCache).forEach((key: string) => {
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                thingCache[key].forEach((thing, idx, arr) => {
                    const scaledDotSize = getDotSize(dotSizeMagic - idx * (dotSizeMagic / arr.length));
                    const x = thing.pos.xPos;
                    const y = thing.pos.yPos;
                    ctx.strokeStyle = thing.color;
                    ctx.fillStyle = thing.color;
                    if (thing.isDot) {
                        ctx.fillRect(x - scaledDotSize / 2, y - scaledDotSize / 2, scaledDotSize, scaledDotSize);
                    } else {
                        ctx.font = `${textSize}px arial`;
                        ctx.arc(x, y, circleSize, 0, 2 * Math.PI);
                        ctx.stroke();
                        const text = thing.text ?? '';
                        const textWidth = thing.textWidth ?? 1;
                        const maxWidth = circleSize * 1.8;
                        if (maxWidth > textWidth) {
                            ctx.strokeText(text, x - textWidth / 2, y + textSize / 3, circleSize * 1.7);
                        } else {
                            ctx.strokeText(
                                text,
                                x - textWidth / 2 + (textWidth - maxWidth) / 2,
                                y + textSize / 3,
                                maxWidth,
                            );
                        }
                    }
                });
                ctx.stroke();
            });
        } else {
            thingCache = {};
            ctx.lineWidth = lineWidth;
            mapData.things.filter(t => thingIsRenderable(t)).forEach((thing) => {
                const xy = transformMapPointToCanvas({ xPos: thing.xPos, yPos: thing.yPos }, canvas);
                const x = xy.xPos;
                const y = xy.yPos;
                const cacheKey = `${x}|${y}`;
                const color = getThingColor(thing.thingGroup as WadMapThingGroupRenderable);
                if (onlyDots) {
                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
                    ctx.stroke();
                    if (!thingCache[cacheKey]) thingCache[cacheKey] = [];
                    thingCache[cacheKey].push({ pos: { xPos: x, yPos: y }, color, isDot: true });
                } else {
                    ctx.beginPath();
                    ctx.font = `${textSize}px arial`;
                    ctx.strokeStyle = color;
                    ctx.arc(x, y, circleSize, 0, 2 * Math.PI);
                    ctx.stroke();
                    const text = thing.thingType.toString();
                    const textWidth = ctx.measureText(text).width;
                    const maxWidth = circleSize * 1.8;
                    if (maxWidth > textWidth) {
                        ctx.strokeText(text, x - textWidth / 2, y + textSize / 3, circleSize * 1.7);
                    } else {
                        ctx.strokeText(
                            text,
                            x - textWidth / 2 + (textWidth - maxWidth) / 2,
                            y + textSize / 3,
                            maxWidth,
                        );
                    }
                    if (!thingCache[cacheKey]) thingCache[cacheKey] = [];
                    thingCache[cacheKey].push({ pos: { xPos: x, yPos: y }, color, isDot: false, text, textWidth });
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
        const xy0 = transformMapPointToCanvas({ xPos: x0Orig, yPos: y0Orig }, canvas);
        const xy1 = transformMapPointToCanvas({ xPos: x1Orig, yPos: y1Orig }, canvas);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        for (let i = 0; i < rowCount + 1; i++) {
            const yStart = transformMapYToCanvas(y0Orig + i * gridSize, canvas);
            ctx.moveTo(xy0.xPos, yStart);
            ctx.lineTo(xy1.xPos, yStart);
        }

        for (let i = 0; i < colCount + 1; i++) {
            const xStart = transformMapXToCanvas(x0Orig + i * gridSize);
            ctx.moveTo(xStart, xy0.yPos);
            ctx.lineTo(xStart, xy1.yPos);
        }
        ctx.stroke();
    };

    const drawFunc = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number): boolean => {
        const bounds = getBounds();
        const scalar = getScalar();
        const lineWidth = renderFull ? 2 / scalar : 1.5 / scale;
        const onlyDots = useDots();
        const dotSize = getDotSize();
        const textSize = getTextSize();
        const circleSize = getCircleSize();
        const useCache = compareDimensions(dim);
        drawInit(canvas, ctx);
        if (showGrid) {
            drawGrid(canvas, ctx, lineWidth);
        }
        drawLines(canvas, ctx, lineWidth, useCache);
        drawThings(canvas, ctx, lineWidth, onlyDots, dotSize, textSize, circleSize, useCache);

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
        const width = 170;
        return data.things.map((t, idx) => {
            const flagRoom = t.flagsString.length * 20;
            const height = 70 + flagRoom;
            cumulativeHeight += height + 5;
            const top = data.yPos - 10 - cumulativeHeight - window.scrollY;
            let left = data.xPos - 90;
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
                        top: idx < 3 ? top : data.yPos - 85 - flagRoom,
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
                        <span style={{ fontWeight: 'normal' }}> {t.thingTypeString}</span>
                    </span>
                    <br />
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        GRP:
                        <span style={{ fontWeight: 'normal' }}> {t.thingGroup}</span>
                    </span>
                    <br />
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        ID:
                        <span style={{ fontWeight: 'normal' }}> {t.thingType}</span>
                    </span>
                    <br />
                    <span style={{ fontWeight: 'bold' }}>FLAGS: </span>
                    {t.flagsString.map((f) => {
                        return (
                            <React.Fragment key={`${t.xPos}${t.yPos}${t.thingType}${f}`}>
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
                    onCanvasMouse={mouseToMap}
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
