import React, { useEffect, useState } from 'react';
import { type Point } from '../interfaces/Point';
import { type WadMap } from '../interfaces/wad/map/WadMap';
import { type WadMapThing, type WadMapThingGroupRenderable } from '../interfaces/wad/map/WadMapThing';
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
interface Line {
    vStart: WadMapVertex;
    vEnd: WadMapVertex;
    color: string;
}
let lineCache: Record<string, Line[]> = {};
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
    const canvasPadding = 10;

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

    if (!playPal || !mapData) return null;

    const thingIsRenderable = (t: WadMapThing): boolean => {
        if (!toggledThingGroups.includes(t.thingGroup as WadMapThingGroupRenderable)) return false;
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
        const scalar = Math.min(diff(bounds.top, bounds.bottom), 5000) / lastDimensions.height;
        const circleSize = Math.max(Math.round(16 / scalar), 2);
        const things = mapData.things.filter(thingIsRenderable).filter((t) => {
            const magicScalar = 194 * (3 / circleSize);
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
            if (mapWidth * mapHeight * 2 < 56250000) {
                maxW = mapWidth * 2;
                maxH = mapHeight * 2;
            } else {
                maxW = 7500;
                maxH = 7500;
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

    const drawFunc = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number): boolean => {
        const bounds = getBounds();
        const sameDimensions = compareDimensions(dim);
        const scalar = Math.min(diff(bounds.top, bounds.bottom), 5000) / Math.min(dim.height, dim.width);
        const lineWidth = renderFull ? Math.round(1 / scalar) : 1 / scale;
        ctx.fillStyle = playPal[0].hex;
        ctx.fillRect(-canvas.width * 10, -canvas.height * 10, canvas.width * 20, canvas.height * 20);
        if (sameDimensions && Object.keys(lineCache).length > 0) {
            Object.keys(lineCache).forEach((key: string) => {
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = key;
                ctx.beginPath();
                lineCache[key].forEach((line) => {
                    ctx.moveTo(line.vStart.xPos + canvasPadding, canvas.height - line.vStart.yPos - canvasPadding);
                    ctx.lineTo(line.vEnd.xPos + canvasPadding, canvas.height - line.vEnd.yPos - canvasPadding);
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
                    const vStart = { ...mapData.vertices[line.start] };
                    const vEnd = { ...mapData.vertices[line.end] };

                    vStart.xPos -= bounds.left;
                    vStart.yPos -= bounds.top;
                    vEnd.xPos -= bounds.left;
                    vEnd.yPos -= bounds.top;

                    vStart.xPos *= dim.scale;
                    vStart.yPos *= dim.scale;
                    vEnd.xPos *= dim.scale;
                    vEnd.yPos *= dim.scale;

                    vStart.xPos += dim.offset.x;
                    vStart.yPos += dim.offset.y;
                    vEnd.xPos += dim.offset.x;
                    vEnd.yPos += dim.offset.y;

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
                        color = playPal[251].hex;
                    } else {
                        color = playPal[176].hex;
                    }

                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                    ctx.beginPath();
                    ctx.moveTo(vStart.xPos + canvasPadding, canvas.height - vStart.yPos - canvasPadding);
                    ctx.lineTo(vEnd.xPos + canvasPadding, canvas.height - vEnd.yPos - canvasPadding);
                    ctx.stroke();
                    if (!lineCache[color]) lineCache[color] = [];
                    lineCache[color].push({ vStart, vEnd, color });
                });

            lastDimensions = JSON.parse(JSON.stringify(dim));
            lastBounds = JSON.parse(JSON.stringify(bounds));
            lastCanvasHeight = canvas.height;
        }
        const textSize = Math.max(Math.round(16 / scalar), 2);
        const circleSize = Math.max(Math.round(16 / scalar), 2);
        ctx.lineWidth = lineWidth;
        mapData.things.filter(thingIsRenderable).forEach((thing) => {
            let x = thing.xPos;
            let y = thing.yPos;
            x -= bounds.left;
            y -= bounds.top;
            x *= dim.scale;
            y *= dim.scale;
            x += dim.offset.x;
            y += dim.offset.y;
            x += canvasPadding;
            y += canvasPadding;

            const color = getThingColor(thing.thingGroup as WadMapThingGroupRenderable);
            ctx.beginPath();
            ctx.font = `${textSize}px arial`;
            ctx.strokeStyle = color;
            ctx.arc(x, canvas.height - y, circleSize, 0, 2 * Math.PI);
            ctx.stroke();
            const text = thing.thingType.toString();
            const textWidth = ctx.measureText(text).width;
            const maxWidth = circleSize * 1.8;
            if (maxWidth > textWidth) {
                ctx.strokeText(text, x - textWidth / 2, canvas.height - y + textSize / 3, circleSize * 1.7);
            } else {
                ctx.strokeText(
                    text,
                    x - textWidth / 2 + (textWidth - maxWidth) / 2,
                    canvas.height - y + textSize / 3,
                    maxWidth,
                );
            }
        });
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
            const top = data.yPos - 10 - cumulativeHeight;
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
                />
                <p style={{ fontSize: '9px', margin: 0 }}>
                    Shamelessly yoinked from
                    <a
                        href="https://gist.github.com/robinovitch61/483190546bf8f0617d2cd510f3b4b86d"
                        target="_blank"
                        rel="noreferrer"
                    >
                        @robinovitch61
                    </a>
                </p>
            </div>
            {hoverData && hoverData.things.length > 0 && getHoverData(hoverData)}
        </>
    );
};
