import { Viewport } from 'pixi-viewport';
import { Application, Graphics, utils } from 'pixi.js';
import { getDehacked, getMaps, getNiceFileName } from '../..';
import { Point } from '../../interfaces/Point';
import { defaultWadMap, WadMap } from '../../interfaces/wad/map/WadMap';
import { WadMapBBox } from '../../interfaces/wad/map/WadMapBBox';
import { WadMapBlockMap } from '../../interfaces/wad/map/WadMapBlockmap';
import { WadMapThing, WadMapThingDehacked, WadMapThingGroup } from '../../interfaces/wad/map/WadMapThing';
import { WadDehacked } from '../../interfaces/wad/WadDehacked';
import { getThingColor } from '../../library/utilities/thingUtils';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';
import { MapWindowPalette, mapPalettes } from '../../interfaces/wad/map/MapWindowPalettes';
import { WadMapLinedef } from '../../interfaces/wad/map/WadMapLinedef';

interface Dimensions {
    height: number;
    width: number;
    scale: number;
    offset: {
        x: number;
        y: number;
    };
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
interface HoverData {
    x: number;
    y: number;
    things: WadMapThingDehacked[];
}

const mapWindowId = 'map-window';
const mapWindowCanvasId = 'map-window-canvas';
const bottomAreaId = 'map-window-bottom-area';
const toggleAreaId = 'map-window-toggle-area';
const buttonContainerId = 'map-window-button-container';
const debounceCheckId = 'map-window-button-debounce-check';
const maxResId = 'map-window-input-maxres';
const paletteOptionId = 'map-window-input-palette';
const canvasPadding = 10;
const widthOffset = 216;
const heightOffset = 190;

let maxWidth = window.innerWidth - widthOffset - canvasPadding * 2;
let maxHeight = Math.min(1080, window.innerHeight - heightOffset) - canvasPadding * 2;
let renderFull = false;
let mapData: WadMap = defaultWadMap;
let dehacked: WadDehacked | null = null;
let bounds: WadMapBBox | null = null;
let dim: Dimensions | null = null;
let app: Application | null = null;
let viewport: Viewport | null = null;
let hoverDivs: HTMLDivElement[] = [];
let enabledThingGroups: WadMapThingGroup[] = [];
let showMultiPlayer = 0;
let showDifficulty = 0;
let hideDifficulty = 0;
let showBlockmap = false;
let showGrid = false;
let automapMode = false;
let debounceZoomEvts = false;
let maxResImage = 5192;
let lineCache: Record<string, LineCacheEntry[]> | null = null;
let otherThingCache: ThingCacheEntry[] | null = null;
let monsterThingCache: ThingCacheEntry[] | null = null;
let selectedPalette: MapWindowPalette = mapPalettes[0];

window.addEventListener('resize', () => {
    maxWidth = window.innerWidth - widthOffset - canvasPadding * 2;
    maxHeight = Math.min(1080, window.innerHeight - heightOffset) - canvasPadding * 2;
    if (app && viewport && dim) {
        clearData();
        setBounds();
        setDimensions();
        app.renderer.resize(dim.width + canvasPadding * 2, dim.height + canvasPadding * 2);
        reDrawMap();
    }
});

export const disposeMapWindowModule = () => {
    if (app) {
        app.destroy(true, true);
        app = null;
    }
};

export const initMapWindowModule = (mapName: string) => {
    clearData();
    setTopBarPageName(mapName);
    const foundMap = getMaps().find((m) => m.name === mapName);
    if (foundMap) {
        mapData = foundMap;
        dehacked = getDehacked();
    }

    disposeMapWindowModule();

    const baseModule = createModule('map');
    const mapWindow = document.createElement('div');
    mapWindow.id = mapWindowId;
    baseModule.appendChild(mapWindow);

    const mapCanvas = document.createElement('canvas');
    mapCanvas.id = mapWindowCanvasId;
    mapCanvas.getContext('webgl', { preserveDrawingBuffer: true });
    mapCanvas.addEventListener('mousemove', onCanvasMouseMove);
    mapWindow.appendChild(mapCanvas);

    mapWindow.appendChild(getBottomArea(mapName));

    initializeMap();
};

const clearData = () => {
    bounds = null;
    dim = null;
    otherThingCache = null;
    monsterThingCache = null;
    lineCache = null;
};

const onCanvasMouseMove = (event: MouseEvent) => {
    const canvasRef = event.currentTarget as HTMLCanvasElement;
    if (!viewport || !bounds || !dim || !canvasRef) return;
    const diffPoints = (p1: Point, p2: Point): Point => {
        return { x: p1.x - p2.x, y: p1.y - p2.y };
    };
    const viewportMousePos = { x: event.pageX, y: event.pageY };
    const topLeftCanvasPos = {
        x: canvasRef.offsetLeft + 208,
        y: canvasRef.offsetTop + 43,
    };

    const canvasCoord = diffPoints(viewportMousePos, topLeftCanvasPos);
    const transform = viewport.transform;
    const transformedX = (canvasCoord.x - transform.position.x) / transform.scale.x;
    const transformedY = (canvasCoord.y - transform.position.y) / transform.scale.y;
    const canvasPoint = { x: transformedX, y: transformedY };

    const newPoint = canvasPoint;
    newPoint.y *= -1;
    newPoint.x -= canvasPadding;
    newPoint.y += canvasRef.height - canvasPadding;
    newPoint.x -= dim.offset.x;
    newPoint.y -= dim.offset.y;
    newPoint.x /= dim.scale;
    newPoint.y /= dim.scale;
    newPoint.x += bounds.left;
    newPoint.y += bounds.top;

    const isInsideBoundingBox = (a: Point, b: Point, size: number): boolean => {
        const halfSize = size / 2;
        return Math.abs(a.x - b.x) <= halfSize && Math.abs(a.y - b.y) <= halfSize;
    };
    const things = applyDehacked(mapData.things)
        .filter((t) => thingIsRenderable(t))
        .filter((t) => isInsideBoundingBox(newPoint, { x: t.x, y: t.y }, t.size * 2));
    if (things.length > 0) {
        drawHover({ x: viewportMousePos.x, y: viewportMousePos.y, things });
    } else if (hoverDivs.length > 0) {
        clearHover();
    }
};

const setBounds = (): void => {
    if (mapData.vertices.length === 0) {
        console.error("Can't set bounds of map because there are no vertices");
        return;
    }

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

    bounds = { top, left, bottom, right };
};

const setDimensions = (): void => {
    if (!bounds) {
        console.error("Can't set dimensions of map because there are no map bounds set");
        return;
    }

    const mapWidth = bounds.right - bounds.left;
    const mapHeight = bounds.bottom - bounds.top;
    let maxW = maxWidth;
    let maxH = maxHeight;
    let scale = 1;
    if (renderFull) {
        if (mapWidth < maxResImage && mapHeight < maxResImage) {
            maxW = mapWidth;
            maxH = mapHeight;
        } else if (mapWidth >= mapHeight) {
            const ratio = mapWidth / mapHeight;
            maxW = maxResImage;
            maxH = maxResImage / ratio;
        } else {
            const ratio = mapHeight / mapWidth;
            maxW = maxResImage / ratio;
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
        y: (maxH - mapHeight * scale) / 2,
    };
    dim = { height: maxH, width: maxW, scale, offset };
};

const initializeMap = () => {
    if (!bounds) setBounds();
    if (!dim) setDimensions();
    if (!bounds || !dim) {
        console.error("Can't initialize map because dimensions or bounds are missing");
        return;
    }

    app = new Application({
        view: document.getElementById(mapWindowCanvasId) as HTMLCanvasElement,
        backgroundColor: utils.string2hex(selectedPalette.getBackground(selectedPalette)),
        width: dim.width + canvasPadding * 2,
        height: dim.height + canvasPadding * 2,
        antialias: !renderFull,
        preserveDrawingBuffer: true,
    });

    if (viewport) {
        viewport.removeAllListeners();
    }

    viewport = new Viewport({
        screenWidth: dim.width + canvasPadding * 2,
        screenHeight: dim.height + canvasPadding * 2,
        worldWidth: dim.width + canvasPadding * 2,
        worldHeight: dim.height + canvasPadding * 2,
        interaction: app.renderer.plugins.interaction,
    });

    app.stage.addChild(viewport);
    viewport.drag().wheel();

    const graphy: Graphics = new Graphics();
    drawMap(graphy, renderFull ? 3 : 1);
    viewport.addChild(graphy);
    if (renderFull) {
        viewport.fitWorld();
    }

    const debounceTime = 500;
    let timeout: NodeJS.Timeout | null = null;
    viewport.on('zoomed-end', () => {
        if (debounceZoomEvts) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                if (viewport) {
                    const lineWidth = Math.max(1 / viewport.scale.x, 0.05);
                    reDrawMap(lineWidth);
                }
            }, debounceTime);
        } else {
            if (viewport) {
                const lineWidth = Math.max(1 / viewport.scale.x, 0.05);
                reDrawMap(lineWidth);
            }
        }
    });
};

const transformMapPointToCanvas = (p: Point): Point => {
    if (!bounds || !dim) return p;
    let xTemp = p.x;
    let yTemp = p.y;
    xTemp -= bounds.left;
    yTemp -= bounds.top;
    xTemp *= dim.scale;
    yTemp *= dim.scale;
    xTemp += dim.offset.x;
    yTemp += dim.offset.y;
    yTemp = dim.height - yTemp;
    xTemp += canvasPadding;
    yTemp += canvasPadding;
    return { x: xTemp, y: yTemp };
};

const transformMapYToCanvas = (y: number): number => {
    if (!bounds || !dim) return y;
    let yTemp = y;
    yTemp -= bounds.top;
    yTemp *= dim.scale;
    yTemp += dim.offset.y;
    yTemp = dim.height - yTemp;
    yTemp += canvasPadding;
    return yTemp;
};

const transformMapXToCanvas = (x: number): number => {
    if (!bounds || !dim) return x;
    let xTemp = x;
    xTemp -= bounds.left;
    xTemp *= dim.scale;
    xTemp += dim.offset.x;
    xTemp += canvasPadding;
    return xTemp;
};

const reDrawMap = (lineWidth = 1) => {
    if (viewport) {
        const oldGraphics: Graphics | undefined = viewport.children[0] as Graphics;
        if (oldGraphics) {
            oldGraphics.clear();
            drawMap(oldGraphics, lineWidth);
        }
    }
};

const drawMap = (graphy: Graphics, lineWidth = 1) => {
    graphy.lineStyle({ width: lineWidth });
    drawLines(graphy);
    drawThings(graphy);
    if (showBlockmap) drawBlockmap(graphy);
    if (showGrid) drawGrid(graphy);
};

const shouldBeDrawnOnAutomap = (line: WadMapLinedef) => {
    const frontSide = { ...mapData.sidedefs[line.frontSideDef] };
    const frontSector = { ...mapData.sectors[frontSide.sector] };
    const fSectorFloor = frontSector.floorHeight;
    const fSectorCeil = frontSector.ceilingHeight;
    const backSide = { ...mapData.sidedefs[line.backSideDef] };
    const backSector = { ...mapData.sectors[backSide.sector] };
    const bSectorFloor = backSector.floorHeight;
    const bSectorCeil = backSector.ceilingHeight;
    if (
        line.flagsString.includes('TWO_SIDED') &&
        !line.flagsString.includes('SECRET') &&
        frontSector.specialType !== 9 &&
        backSector.specialType !== 9 &&
        fSectorCeil === bSectorCeil &&
        fSectorFloor === bSectorFloor
    )
        return false;
    if (line.flagsString.includes('HIDE_ON_MAP')) return false;
    return true;
};

const drawLines = (graphy: Graphics) => {
    if (!app) return;
    if (lineCache && Object.keys(lineCache).length > 0) {
        Object.keys(lineCache).forEach((key: string) => {
            lineCache?.[key].forEach((line) => {
                graphy.lineStyle({ color: utils.string2hex(key), width: graphy.line.width });
                graphy.drawPolygon([line.vStart, line.vEnd]);
            });
        });
    } else {
        mapData.linedefs
            .sort((a, b) => {
                const aB = a.flagsString.includes('TWO_SIDED');
                const bB = b.flagsString.includes('TWO_SIDED');
                if (aB === bB) return 0;
                else if (aB) return 1;
                else return -1;
            })
            .forEach((line) => {
                if (automapMode && !shouldBeDrawnOnAutomap(line)) return;

                const vStart = transformMapPointToCanvas({ ...mapData.vertices[line.start] });
                const vEnd = transformMapPointToCanvas({ ...mapData.vertices[line.end] });
                const color = selectedPalette.getLineColor(selectedPalette, line, mapData);

                graphy.lineStyle({ color: utils.string2hex(color), width: graphy.line.width });
                graphy.drawPolygon([vStart, vEnd]);
                if (!lineCache) lineCache = {};
                if (!lineCache[color]) lineCache[color] = [];
                lineCache[color].push({ vStart, vEnd, color });
            });
    }
};

const thingIsRenderable = (t: WadMapThingDehacked): boolean => {
    if (!enabledThingGroups.includes(t.thingGroup as WadMapThingGroup)) return false;
    if (showMultiPlayer === 1 && t.flagsString.includes('NET_ONLY')) return false;
    if (showMultiPlayer === 2 && !t.flagsString.includes('NET_ONLY')) return false;
    if (showDifficulty === 1 && !t.flagsString.includes('ON_SKILL_EASY')) return false;
    if (showDifficulty === 2 && !t.flagsString.includes('ON_SKILL_MEDIUM')) return false;
    if (showDifficulty === 3 && !t.flagsString.includes('ON_SKILL_HARD')) return false;
    if (hideDifficulty === 1 && t.flagsString.includes('ON_SKILL_EASY')) return false;
    if (hideDifficulty === 2 && t.flagsString.includes('ON_SKILL_MEDIUM')) return false;
    if (hideDifficulty === 3 && t.flagsString.includes('ON_SKILL_HARD')) return false;
    return true;
};

const drawTriangle = (
    graphy: Graphics,
    centerX: number,
    centerY: number,
    size: number,
    rotation: number,
): [Point, Point, Point] => {
    const rot = (-rotation * Math.PI) / 180 + Math.PI / 2;
    const height = Math.sin((90 * Math.PI) / 180) * size;
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

    graphy.drawPolygon(v1, v2, v3);
    return [v1, v2, v3];
};

const getDotSize = (size: number): number => {
    if (!dim) return size;
    return size * dim.scale;
};

const applyDehacked = (things: WadMapThing[]): WadMapThingDehacked[] => {
    if (!dehacked) return things;

    return things.map((thing) => {
        if (!dehacked) return thing;
        const dehackedThing = dehacked.things.find((dt) => dt.from === thing.thingType);
        if (!dehackedThing) return thing;
        const modifiedThing: WadMapThingDehacked = { ...thing };
        modifiedThing.thingTypeString = dehackedThing.to.name;
        modifiedThing.thingGroup = dehackedThing.to.group;
        return modifiedThing;
    });
};

const drawThings = (graphy: Graphics) => {
    if (otherThingCache && monsterThingCache) {
        otherThingCache.forEach((thing) => {
            const dotSize = getDotSize(thing.size * 2);
            const x = thing.pos.x;
            const y = thing.pos.y;
            const ogLineW = graphy.line.width;
            graphy.lineStyle({ color: utils.string2hex(thing.color), alignment: 1, width: 0 });
            graphy.beginFill(utils.string2hex(thing.color));
            graphy.drawRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
            graphy.endFill();
            graphy.lineStyle({ width: ogLineW });
        });

        monsterThingCache.forEach((thing) => {
            if (thing.trianglePoints) {
                const points = thing.trianglePoints;
                graphy.lineStyle({ color: utils.string2hex(thing.color), alignment: 1, width: graphy.line.width });
                graphy.drawPolygon(points[0], points[1], points[2]);
            }
        });
    } else {
        applyDehacked(mapData.things)
            .filter((t) => thingIsRenderable(t))
            .sort((a, b) => b.size - a.size)
            .sort((a, b) => {
                if (a.thingGroup === WadMapThingGroup.MONSTER && b.thingGroup !== WadMapThingGroup.MONSTER) {
                    return 1;
                } else {
                    return -1;
                }
            })
            .forEach((thing) => {
                const xy = transformMapPointToCanvas({ x: thing.x, y: thing.y });
                const x = xy.x;
                const y = xy.y;
                const color = getThingColor(thing.thingGroup as WadMapThingGroup);
                const isMonster = thing.thingGroup === WadMapThingGroup.MONSTER;
                const dotSize = getDotSize(thing.size * 2);
                if (!monsterThingCache) monsterThingCache = [];
                if (!otherThingCache) otherThingCache = [];
                if (!isMonster) {
                    const ogLineW = graphy.line.width;
                    graphy.lineStyle({ color: utils.string2hex(color), alignment: 1, width: graphy.line.width * 0 });
                    graphy.beginFill(utils.string2hex(color));
                    graphy.drawRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
                    graphy.endFill();
                    graphy.lineStyle({ width: ogLineW });
                    otherThingCache.push({ pos: { x, y }, color, isDot: isMonster, size: thing.size });
                } else {
                    graphy.lineStyle({ color: utils.string2hex(color), alignment: 1, width: graphy.line.width });
                    const trianglePoints = drawTriangle(graphy, x, y, dotSize, thing.angle);
                    monsterThingCache.push({
                        pos: { x, y },
                        color,
                        isDot: isMonster,
                        trianglePoints,
                        size: thing.size,
                    });
                }
            });
    }
};

const drawBlockmap = (graphy: Graphics): void => {
    if (!app || !bounds) return;
    const blockMap = JSON.parse(JSON.stringify(mapData.blockMap)) as WadMapBlockMap;
    const gridSize = 128;
    if (blockMap.xOrigin === undefined) {
        blockMap.xOrigin = bounds.left;
        blockMap.yOrigin = bounds.top;
        blockMap.columns = Math.abs((blockMap.xOrigin - bounds.right) / gridSize);
        blockMap.rows = Math.abs((blockMap.yOrigin - bounds.bottom) / gridSize);
    }
    const colCount = blockMap.columns;
    const rowCount = blockMap.rows;
    const gridColor = selectedPalette.getBlockmapColor(selectedPalette);
    const x0Orig = blockMap.xOrigin;
    const y0Orig = blockMap.yOrigin;
    const x1Orig = x0Orig + colCount * gridSize;
    const y1Orig = y0Orig + rowCount * gridSize;
    const xy0 = transformMapPointToCanvas({ x: x0Orig, y: y0Orig });
    const xy1 = transformMapPointToCanvas({ x: x1Orig, y: y1Orig });
    const ogLineW = graphy.line.width;
    graphy.lineStyle({ color: utils.string2hex(gridColor), alignment: 1, width: graphy.line.width * 0.5 });
    for (let i = 0; i < rowCount + 1; i++) {
        const yStart = transformMapYToCanvas(y0Orig + i * gridSize);
        graphy.drawPolygon([
            { x: xy0.x, y: yStart },
            { x: xy1.x, y: yStart },
        ]);
    }

    for (let i = 0; i < colCount + 1; i++) {
        const xStart = transformMapXToCanvas(x0Orig + i * gridSize);
        graphy.drawPolygon([
            { x: xStart, y: xy0.y },
            { x: xStart, y: xy1.y },
        ]);
    }
    graphy.lineStyle({ width: ogLineW });
};

const drawGrid = (graphy: Graphics): void => {
    if (!app || !bounds) return;
    const round32 = (num: number) => {
        return Math.round(num / 32) * 32;
    };

    const gridSize = 32;
    const [gridColor32, gridColor64] = selectedPalette.getGridColor(selectedPalette);
    const x0Orig = round32(bounds.left);
    const y0Orig = round32(bounds.top);
    const x1Orig = round32(bounds.right);
    const y1Orig = round32(bounds.bottom);
    const colCount = Math.abs((x0Orig - x1Orig) / gridSize);
    const rowCount = Math.abs((y0Orig - y1Orig) / gridSize);
    const xy0 = transformMapPointToCanvas({ x: x0Orig, y: y0Orig });
    const xy1 = transformMapPointToCanvas({ x: x1Orig, y: y1Orig });
    const ogLineW = graphy.line.width;
    for (let i = 0; i < rowCount + 1; i++) {
        const is64 = i % 2 === 0;
        graphy.lineStyle({ color: utils.string2hex(is64 ? gridColor64 : gridColor32), width: ogLineW * 0.3 });
        const yStart = transformMapYToCanvas(y0Orig + i * gridSize);
        graphy.drawPolygon([
            { x: xy0.x, y: yStart },
            { x: xy1.x, y: yStart },
        ]);
    }

    for (let i = 0; i < colCount + 1; i++) {
        const is64 = i % 2 === 0;
        graphy.lineStyle({ color: utils.string2hex(is64 ? gridColor64 : gridColor32), width: ogLineW * 0.3 });
        const xStart = transformMapXToCanvas(x0Orig + i * gridSize);
        graphy.drawPolygon([
            { x: xStart, y: xy0.y },
            { x: xStart, y: xy1.y },
        ]);
    }
    graphy.lineStyle({ width: ogLineW });
};

const getHoverRow = (head: string, txt: string) => {
    const row = document.createElement('p');
    row.innerText = head;
    row.classList.add('map-hover-row');
    const txtSpan = document.createElement('span');
    txtSpan.classList.add('map-hover-span-text');
    txtSpan.innerHTML = txt;
    row.appendChild(txtSpan);
    return row;
};

const drawHover = (data: HoverData) => {
    clearHover();
    const parent = document.getElementById('map');
    if (!parent) return;
    let cumulativeHeight = 0;
    const rowHeight = 13;
    const width = 220;

    data.things.forEach((t, idx) => {
        const flagRoom = t.flagsString.length * rowHeight;
        const height = 4 * rowHeight + flagRoom;
        cumulativeHeight += height + 5;
        const top = data.y - 10 - cumulativeHeight - window.scrollY;
        let left = data.x - 90;
        if (idx > 2 && idx % 2 === 0) {
            left += ((idx - 2) / 2) * (width + 10);
        } else if (idx > 2) {
            left -= ((idx - 2) / 2) * (width + 10) + width / 2;
        }

        const hoverDiv = document.createElement('div');
        hoverDiv.classList.add('map-hover-div');
        hoverDiv.style.top = `${idx < 3 ? top : data.y - 85 - flagRoom}px`;
        hoverDiv.style.left = `${left}px`;
        hoverDiv.style.width = `${width}px`;
        hoverDiv.style.height = `${height}px`;
        hoverDiv.appendChild(getHoverRow('TYPE: ', `${t.thingType} | ${t.thingTypeString}`));
        hoverDiv.appendChild(getHoverRow('GRP: ', `${t.thingGroup}`));
        hoverDiv.appendChild(getHoverRow('POS: ', `(${t.x},${t.y}) | ${t.angle} | ${t.size}`));
        hoverDiv.appendChild(getHoverRow('FLAGS:', `${t.flagsString.map((f) => `<br/><span>${f}</span>`).join('\n')}`));
        parent.appendChild(hoverDiv);
        hoverDivs.push(hoverDiv);
    });
};

const clearHover = () => {
    if (hoverDivs.length > 0) {
        hoverDivs.forEach((hoverDiv) => {
            hoverDiv.parentElement?.removeChild(hoverDiv);
        });
    }
    hoverDivs = [];
};

const refreshBottomAreaAndMap = (mapName: string) => {
    const windowArea = document.getElementById(mapWindowId);
    const bottomArea = document.getElementById(bottomAreaId);
    if (windowArea && bottomArea) {
        windowArea.removeChild(bottomArea);
        windowArea.appendChild(getBottomArea(mapName));
    }
    if (viewport) {
        otherThingCache = null;
        monsterThingCache = null;
        const lineWidth = Math.max(1 / viewport.scale.x, 0.05);
        reDrawMap(lineWidth);
    }
};

const getButtonArea = (mapName: string) => {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = buttonContainerId;
    const upperButtons = document.createElement('div');
    const lowerSettings = document.createElement('div');
    lowerSettings.style.display = 'block';

    const saveFullButton = document.createElement('button');
    saveFullButton.innerText = 'Save Full';
    saveFullButton.onclick = () => {
        if (app) {
            renderFull = true;
            initMapWindowModule(mapName);
            app.render();
            const fileName = `${getNiceFileName()}-${mapName}-full.png`;
            app.view.toBlob((blob) => {
                if (blob) {
                    const link = document.createElement('a');
                    const url = window.URL.createObjectURL(blob);
                    link.href = url;
                    link.download = fileName;
                    link.target = '_blank';
                    link.click();
                }
                renderFull = false;
                initMapWindowModule(mapName);
            });
        }
    };
    upperButtons.appendChild(saveFullButton);

    const saveCurrButton = document.createElement('button');
    saveCurrButton.innerText = 'Save Current View';
    saveCurrButton.onclick = () => {
        if (app) {
            const fileName = `${getNiceFileName()}-${mapName}-view.png`;
            const image = app.view.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            const link = document.createElement('a');
            link.href = image;
            link.download = fileName;
            link.target = '_blank';
            link.click();
        }
    };
    upperButtons.appendChild(saveCurrButton);

    const resetButton = document.createElement('button');
    resetButton.innerText = 'Reset';
    resetButton.onclick = () => {
        initMapWindowModule(mapName);
    };
    upperButtons.appendChild(resetButton);

    const maxResParent = document.createElement('div');
    const maxRes = document.createElement('input');
    maxRes.type = 'text';
    maxRes.id = maxResId;
    maxRes.value = maxResImage.toString();
    maxRes.oninput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const nan = isNaN(Number(target.value));
        if (!nan) {
            maxResImage = Number(target.value);
        }
        target.value = maxResImage.toString();
    };
    const maxResText = document.createElement('label');
    maxResText.innerHTML = 'Maximum resolution';
    maxResText.htmlFor = maxResId;
    maxResParent.appendChild(maxResText);
    maxResParent.appendChild(maxRes);
    lowerSettings.appendChild(maxResParent);

    const debounceCheckParent = document.createElement('div');
    const debounceCheck = document.createElement('input');
    debounceCheck.type = 'checkbox';
    debounceCheck.id = debounceCheckId;
    debounceCheck.checked = debounceZoomEvts;
    debounceCheck.onclick = () => {
        debounceZoomEvts = !debounceZoomEvts;
        debounceCheck.checked = debounceZoomEvts;
    };
    const debounceCheckText = document.createElement('label');
    debounceCheckText.innerHTML = 'Debounce zoom events';
    debounceCheckText.htmlFor = debounceCheckId;
    debounceCheckParent.appendChild(debounceCheckText);
    debounceCheckParent.appendChild(debounceCheck);
    lowerSettings.appendChild(debounceCheckParent);

    const paletteSelectParent = document.createElement('div');
    const paletteSelect = document.createElement('select');
    paletteSelect.id = paletteOptionId;
    paletteSelect.name = 'map-palette-select';
    mapPalettes.forEach((palette) => {
        const option = document.createElement('option');
        option.value = palette.name;
        option.innerText = palette.name;
        paletteSelect.appendChild(option);
    });
    paletteSelect.value = selectedPalette.name;
    paletteSelect.onchange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const newPalette = mapPalettes.find((p) => p.name === target.value);
        if (newPalette) {
            selectedPalette = newPalette;
            paletteSelect.value = target.value;
            initMapWindowModule(mapName);
        }
    };
    const paletteSelectText = document.createElement('label');
    paletteSelectText.innerHTML = 'Select map palette';
    paletteSelectText.htmlFor = paletteOptionId;
    paletteSelectParent.appendChild(paletteSelectText);
    paletteSelectParent.appendChild(paletteSelect);
    lowerSettings.appendChild(paletteSelectParent);

    buttonContainer.appendChild(upperButtons);
    buttonContainer.appendChild(lowerSettings);
    return buttonContainer;
};

const getBottomArea = (mapName: string) => {
    const bottomArea = document.createElement('div');
    bottomArea.id = bottomAreaId;

    bottomArea.appendChild(getToggleArea(mapName));
    bottomArea.appendChild(getButtonArea(mapName));
    return bottomArea;
};

const getToggleArea = (mapName: string) => {
    const toggleAreaParent = document.createElement('div');
    toggleAreaParent.id = toggleAreaId;

    const thingHead = document.createElement('p');
    thingHead.innerText = 'Toggle thing types';
    toggleAreaParent.appendChild(thingHead);

    const thingButtonContainer = document.createElement('div');
    toggleAreaParent.appendChild(thingButtonContainer);

    const generateThingToggleButton = (toggle: WadMapThingGroup | 'ALL' | 'DECO') => {
        const container = document.createElement('div');
        const isSelected = () => {
            if (toggle === 'ALL' && enabledThingGroups.length === 9) {
                return true;
            } else if (
                toggle === 'DECO' &&
                enabledThingGroups.includes(WadMapThingGroup.DECORATION) &&
                enabledThingGroups.includes(WadMapThingGroup.OBSTACLE)
            ) {
                return true;
            } else if (toggle !== 'ALL' && toggle !== 'DECO') {
                return enabledThingGroups.includes(toggle as WadMapThingGroup);
            }
            return false;
        };
        container.style.opacity = isSelected() ? '1.0 ' : '0.5';
        const square = document.createElement('div');
        square.style.backgroundColor = getThingColor(toggle);
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = toggle;

        const removeOrAddToggle = (groups: WadMapThingGroup[]) => {
            let copy = [...enabledThingGroups];
            if (isSelected()) {
                copy = copy.filter((t) => !groups.includes(t));
            } else {
                copy.push(...groups);
            }
            enabledThingGroups = copy;
        };

        container.onclick = () => {
            if (toggle === 'ALL') {
                if (isSelected()) {
                    enabledThingGroups = [];
                } else {
                    enabledThingGroups = Object.keys(WadMapThingGroup).filter(
                        (k) => k !== WadMapThingGroup.UNKNOWN,
                    ) as WadMapThingGroup[];
                }
            } else if (toggle === 'DECO') {
                removeOrAddToggle([WadMapThingGroup.OBSTACLE, WadMapThingGroup.DECORATION]);
            } else {
                removeOrAddToggle([toggle]);
            }
            refreshBottomAreaAndMap(mapName);
        };

        container.appendChild(textEl);
        return container;
    };

    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.MONSTER));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.ARTIFACT));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.POWERUP));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.WEAPON));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.AMMO));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.KEY));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroup.OTHER));
    thingButtonContainer.appendChild(generateThingToggleButton('DECO'));
    thingButtonContainer.appendChild(generateThingToggleButton('ALL'));

    const flagsHead = document.createElement('p');
    flagsHead.innerText = 'Flags / Other';
    toggleAreaParent.appendChild(flagsHead);

    const flagAreaContainer = document.createElement('div');
    toggleAreaParent.appendChild(flagAreaContainer);

    const generateNetToggleButton = () => {
        const container = document.createElement('div');
        const square = document.createElement('div');
        square.style.backgroundColor = 'white';
        const getImg = () => {
            if (showMultiPlayer === 1) return 'url("without.png")';
            else if (showMultiPlayer === 2) return 'url("only.png")';
            else return '';
        };
        square.style.backgroundImage = getImg();
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = 'Net Play';

        container.onclick = () => {
            showMultiPlayer = (showMultiPlayer + 1) % 3;
            refreshBottomAreaAndMap(mapName);
        };

        container.appendChild(textEl);
        return container;
    };

    const generateDifficultyButton = (dir: 'hide' | 'show') => {
        const container = document.createElement('div');
        const square = document.createElement('div');
        square.style.backgroundColor = 'white';
        const getImg = () => {
            const diff = dir === 'hide' ? hideDifficulty : showDifficulty;
            if (dir === 'hide' && diff === 0) return 'url("none.png")';
            else if (dir === 'show' && diff === 0) return 'url("all.png")';
            else if (diff === 1) return 'url("easy.png")';
            else if (diff === 2) return 'url("medium.png")';
            else if (diff === 3) return 'url("hard.png")';
            else return '';
        };
        square.style.backgroundImage = getImg();
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = `${dir === 'hide' ? 'Hide' : 'Show'} Skill`;

        container.onclick = () => {
            if (dir === 'hide') {
                hideDifficulty = (hideDifficulty + 1) % 4;
            } else {
                showDifficulty = (showDifficulty + 1) % 4;
            }
            refreshBottomAreaAndMap(mapName);
        };

        container.appendChild(textEl);
        return container;
    };

    const generateBoolButton = (text: string, onToggle: () => void, state: boolean) => {
        const container = document.createElement('div');
        const square = document.createElement('div');
        square.style.backgroundColor = 'white';
        square.style.backgroundImage = state ? 'url("x.png")' : '';
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = text;

        container.onclick = () => {
            onToggle();
            refreshBottomAreaAndMap(mapName);
        };

        container.appendChild(textEl);
        return container;
    };

    flagAreaContainer.appendChild(generateNetToggleButton());
    flagAreaContainer.appendChild(generateDifficultyButton('show'));
    flagAreaContainer.appendChild(generateDifficultyButton('hide'));
    flagAreaContainer.appendChild(generateBoolButton('Blockmap', () => (showBlockmap = !showBlockmap), showBlockmap));
    flagAreaContainer.appendChild(generateBoolButton('Grid', () => (showGrid = !showGrid), showGrid));
    flagAreaContainer.appendChild(
        generateBoolButton(
            'Automap',
            () => {
                lineCache = null;
                automapMode = !automapMode;
            },
            automapMode,
        ),
    );

    return toggleAreaParent;
};
