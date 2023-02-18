import { Viewport } from 'pixi-viewport';
import { Application, Graphics, utils } from 'pixi.js';
import { getMaps, getNiceFileName, getPlaypal } from '../..';
import { Point } from '../../interfaces/Point';
import { defaultWadMap, WadMap } from '../../interfaces/wad/map/WadMap';
import { WadMapBBox } from '../../interfaces/wad/map/WadMapBBox';
import { isBlueDoor, isRedDoor, isYellowDoor, isExit, isTeleporter } from '../../interfaces/wad/map/WadMapLinedef';
import { WadMapThing, WadMapThingGroupRenderable } from '../../interfaces/wad/map/WadMapThing';
import { WadPlayPalTypedEntry } from '../../interfaces/wad/WadPlayPal';
import { getThingColor } from '../../library/utilities/thingUtils';
import { createModule } from '../main/contentModule';
import { setTopBarPageName } from '../main/topbar';

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
    things: WadMapThing[];
}
let lineCache: Record<string, LineCacheEntry[]> = {};
let thingCache: Record<string, ThingCacheEntry[]> = {};

const mapWindowId = 'map-window';
const mapWindowCanvasId = 'map-window-canvas';
const bottomAreaId = 'map-window-bottom-area';
const toggleAreaId = 'map-window-toggle-area';
const buttonContainerId = 'map-window-button-container';
const maxResImage = 5192;
const canvasPadding = 10;
let maxWidth = (window.innerWidth - 230) - canvasPadding * 2;
let maxHeight = Math.min(1080, window.innerHeight - 180) - canvasPadding * 2;
let renderFull = false;

let mapData: WadMap = defaultWadMap;
let playpal: WadPlayPalTypedEntry | null = null;
let bounds: WadMapBBox | null = null;
let dim: Dimensions | null = null;
let app: Application | null = null;
let viewport: Viewport | null = null;
let hoverDivs: HTMLDivElement[] = [];
let enabledThingGroups: WadMapThingGroupRenderable[] = [];
let showMultiPlayer = 0;
let showDifficulty = 0;
let hideDifficulty = 0;
let showGrid = false;

window.addEventListener('resize', () => {
    maxWidth = (window.innerWidth - 230) - canvasPadding * 2;
    maxHeight = Math.min(1080, window.innerHeight - 180) - canvasPadding * 2;
    if (app && viewport && dim) {
        clearData();
        setBounds();
        setDimensions()
        app.renderer.resize(dim.width + canvasPadding * 2, dim.height + canvasPadding * 2);
        reDrawMap();
    }
})

export const disposeMapWindowModule = () => {
    if (app) {
        app.destroy(true, true);
        app = null;
    }
}

export const initMapWindowModule = (mapName: string) => {
    clearData();
    setTopBarPageName(mapName);
    const foundMap = getMaps().find((m) => m.name === mapName);
    if (foundMap) {
        mapData = foundMap;
        playpal = getPlaypal().typedPlaypal[0];
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
}

const clearData = () => {
    bounds = null;
    dim = null;
    thingCache = {};
    lineCache = {};
}

const onCanvasMouseMove = (event: MouseEvent) => {
    const canvasRef = (event.currentTarget as HTMLCanvasElement);
    if (!viewport || !bounds || !dim || !canvasRef) return;
    const diffPoints = (p1: Point, p2: Point): Point => {
        return { x: p1.x - p2.x, y: p1.y - p2.y };
    }
    const viewportMousePos = { x: event.pageX, y: event.pageY };
    const topLeftCanvasPos = {
        x: canvasRef.offsetLeft + 208,
        y: canvasRef.offsetTop + 48,
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
        return (Math.abs(a.x - b.x) <= halfSize && Math.abs(a.y - b.y) <= halfSize);
    };
    const things = mapData.things
        .filter(t => thingIsRenderable(t))
        .filter(t => isInsideBoundingBox(newPoint, { x: t.x, y: t.y }, t.size));
    if (things.length > 0) {
        drawHover({ x: viewportMousePos.x, y: viewportMousePos.y, things });
    } else if (hoverDivs.length > 0) {
        clearHover();
    }
}

const setBounds = (): void => {
    if (mapData.vertices.length === 0) {
        console.error('Can\'t set bounds of map because there are no vertices');
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
        console.error('Can\'t set dimensions of map because there are no map bounds set');
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
        }
        else if (mapWidth >= mapHeight) {
            const ratio = mapWidth / mapHeight;
            maxW = maxResImage;
            maxH = maxResImage / ratio;
        }
        else {
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
        y: (maxH - mapHeight * scale) / 2 - 2,
    };
    dim = { height: maxH, width: maxW, scale, offset };
};

const initializeMap = () => {
    if (!bounds) setBounds();
    if (!dim) setDimensions();
    if (!bounds || !dim) {
        console.error('Can\'t initialize map because dimensions or bounds are missing');
        return;
    }

    app = new Application({
        view: document.getElementById(mapWindowCanvasId) as HTMLCanvasElement,
        backgroundColor: 0x000000,
        width: dim.width + canvasPadding * 2,
        height: dim.height + canvasPadding * 2,
        antialias: true,
        preserveDrawingBuffer: true
    });

    if (viewport) {
        viewport.removeAllListeners();
    }

    viewport = new Viewport({
        screenWidth: dim.width + canvasPadding * 2,
        screenHeight: dim.height + canvasPadding * 2,
        worldWidth: dim.width + canvasPadding * 2,
        worldHeight: dim.height + canvasPadding * 2,
        interaction: app.renderer.plugins.interaction
    });

    app.stage.addChild(viewport);
    viewport.drag().wheel();

    const graphy: Graphics = new Graphics();
    drawMap(graphy, renderFull ? 3 : 1);
    viewport.addChild(graphy);
    if (renderFull) {
        viewport.fitWorld()
    }

    const debounceTime = 500;
    let timeout: NodeJS.Timeout | null = null;
    viewport.on('zoomed-end', () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            if (viewport) {
                const lineWidth = Math.max(1 / viewport.scale.x, 0.05);
                reDrawMap(lineWidth);
            }
        }, debounceTime);
    });
}

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
        viewport.children[0].destroy();
        const graphy: Graphics = new Graphics();
        drawMap(graphy, lineWidth);
        viewport.addChild(graphy);
    }
}

const drawMap = (graphy: Graphics, lineWidth = 1) => {
    drawLines(graphy, lineWidth);
    drawThings(graphy, lineWidth);
    if (showGrid) drawGrid(graphy, lineWidth);
}

const drawLines = (graphy: Graphics, lineWidth = 1) => {
    if (!app || !playpal) return;
    const ppal = playpal;
    if (Object.keys(lineCache).length > 0) {
        Object.keys(lineCache).forEach((key: string) => {
            lineCache[key].forEach((line) => {
                graphy.lineStyle(lineWidth, utils.string2hex(key));
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
                const vStart = transformMapPointToCanvas({ ...mapData.vertices[line.start] });
                const vEnd = transformMapPointToCanvas({ ...mapData.vertices[line.end] });

                let color = 'cyan';
                const frontSide = { ...mapData.sidedefs[line.frontSideDef] };
                const frontSector = { ...mapData.sectors[frontSide.sector] };
                const fSectorFloor = frontSector.floorHeight;
                const fSectorCeil = frontSector.ceilingHeight;
                const isSecretSector = frontSector.specialType === 9;
                const isHiddenSecret = line.flagsString.includes('SECRET');
                const isTwoSided = line.backSideDef !== 65535;
                if (isBlueDoor(line.specialType)) {
                    color = ppal[200].hex;
                } else if (isRedDoor(line.specialType)) {
                    color = ppal[176].hex;
                } else if (isYellowDoor(line.specialType)) {
                    color = ppal[231].hex;
                } else if (isExit(line.specialType)) {
                    color = ppal[112].hex;
                } else if (isTeleporter(line.specialType)) {
                    color = ppal[121].hex;
                } else if (isTwoSided && !isHiddenSecret) {
                    const backSide = { ...mapData.sidedefs[line.backSideDef] };
                    const backSector = { ...mapData.sectors[backSide.sector] };
                    const bSectorFloor = backSector.floorHeight;
                    const bSectorCeil = backSector.ceilingHeight;
                    if (fSectorFloor !== bSectorFloor) {
                        color = ppal[55].hex;
                    } else if (fSectorCeil !== bSectorCeil) {
                        color = ppal[215].hex;
                    } else if (fSectorCeil === bSectorCeil && fSectorFloor === bSectorFloor) {
                        color = ppal[100].hex;
                    }
                } else if (isSecretSector && !isHiddenSecret) {
                    color = ppal[252].hex;
                } else {
                    color = ppal[180].hex;
                }

                graphy.lineStyle(lineWidth, utils.string2hex(color));
                graphy.drawPolygon([vStart, vEnd]);
                if (!lineCache[color]) lineCache[color] = [];
                lineCache[color].push({ vStart, vEnd, color });
            });
    }
}

const thingIsRenderable = (t: WadMapThing): boolean => {
    if (!enabledThingGroups.includes(t.thingGroup as WadMapThingGroupRenderable)) return false;
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

    graphy.drawPolygon(v1, v2, v3);
    return [v1, v2, v3];
};

const getDotSize = (size: number): number => {
    if (!dim) return size;
    return (size + 5) * dim.scale;
};

const drawThings = (graphy: Graphics, lineWidth = 1) => {
    if (Object.keys(thingCache).length > 0) {
        Object.keys(thingCache).forEach((key: string) => {
            thingCache[key].forEach((thing, idx, arr) => {
                const scaledDotSize = getDotSize(thing.size - idx * (thing.size / arr.length));
                const x = thing.pos.x;
                const y = thing.pos.y;

                if (thing.isDot) {
                    graphy.lineStyle(0, utils.string2hex(thing.color))
                    graphy.beginFill(utils.string2hex(thing.color));
                    graphy.drawRect(x - scaledDotSize / 2, y - scaledDotSize / 2, scaledDotSize, scaledDotSize);
                    graphy.endFill();
                } else if (thing.trianglePoints) {
                    const points = thing.trianglePoints;
                    graphy.lineStyle(lineWidth, utils.string2hex(thing.color));
                    graphy.drawPolygon(points[0], points[1], points[2]);
                }
            });
        });
    } else {
        mapData.things
            .filter(t => thingIsRenderable(t))
            .forEach((thing) => {
                const xy = transformMapPointToCanvas({ x: thing.x, y: thing.y });
                const x = xy.x;
                const y = xy.y;
                const cacheKey = `${x}|${y}`;
                const color = getThingColor(thing.thingGroup as WadMapThingGroupRenderable);
                const isDot = thing.thingGroup !== WadMapThingGroupRenderable.MONSTER;
                const dotSize = getDotSize(thing.size);
                if (isDot) {
                    graphy.lineStyle(0, utils.string2hex(color))
                    graphy.beginFill(utils.string2hex(color));
                    graphy.drawRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
                    graphy.endFill();
                    if (!thingCache[cacheKey]) thingCache[cacheKey] = [];
                    thingCache[cacheKey].push({ pos: { x, y }, color, isDot, size: thing.size });
                } else {
                    graphy.lineStyle(lineWidth, utils.string2hex(color));
                    const trianglePoints = drawTriangle(graphy, x, y, dotSize, thing.angle);
                    if (!thingCache[cacheKey]) thingCache[cacheKey] = [];
                    thingCache[cacheKey].push({ pos: { x, y }, color, isDot, trianglePoints, size: thing.size });
                }
            });
    }
}

const drawGrid = (graphy: Graphics, lineWidth: number): void => {
    if (!app || !playpal) return;
    const ppal = playpal;
    const colCount = mapData.blockMap.columns;
    const rowCount = mapData.blockMap.rows;
    const gridSize = 128;
    const gridColor = ppal[107].hex;
    const x0Orig = mapData.blockMap.xOrigin;
    const y0Orig = mapData.blockMap.yOrigin;
    const x1Orig = x0Orig + colCount * gridSize;
    const y1Orig = y0Orig + rowCount * gridSize;
    const xy0 = transformMapPointToCanvas({ x: x0Orig, y: y0Orig });
    const xy1 = transformMapPointToCanvas({ x: x1Orig, y: y1Orig });
    graphy.lineStyle(lineWidth / 2, utils.string2hex(gridColor));
    for (let i = 0; i < rowCount + 1; i++) {
        const yStart = transformMapYToCanvas(y0Orig + i * gridSize);
        graphy.drawPolygon([{ x: xy0.x, y: yStart }, { x: xy1.x, y: yStart }]);
    }

    for (let i = 0; i < colCount + 1; i++) {
        const xStart = transformMapXToCanvas(x0Orig + i * gridSize);
        graphy.drawPolygon([{ x: xStart, y: xy0.y }, { x: xStart, y: xy1.y }]);
    }
};

const getHoverSpan = (head: string, txt: string) => {
    const headSpan = document.createElement('span');
    headSpan.innerText = head;
    headSpan.classList.add('map-hover-span-head');
    const txtSpan = document.createElement('span');
    txtSpan.classList.add('map-hover-span-text');
    txtSpan.innerHTML = txt;
    headSpan.appendChild(txtSpan);
    return headSpan;
}

const drawHover = (data: HoverData) => {
    clearHover();
    const parent = document.getElementById('map');
    if (!parent) return;
    let cumulativeHeight = 0;
    const width = 220;

    data.things.forEach((t, idx) => {
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

        const hoverDiv = document.createElement('div');
        hoverDiv.classList.add('map-hover-div')
        hoverDiv.style.top = `${idx < 3 ? top : data.y - 85 - flagRoom}px`;
        hoverDiv.style.left = `${left}px`;
        hoverDiv.style.width = `${width}px`;
        hoverDiv.style.height = `${height}px`;
        hoverDiv.appendChild(getHoverSpan('TYPE: ', `${t.thingType} | ${t.thingTypeString}`));
        hoverDiv.appendChild(document.createElement('br'));
        hoverDiv.appendChild(getHoverSpan('GRP: ', `${t.thingGroup}`));
        hoverDiv.appendChild(document.createElement('br'));
        hoverDiv.appendChild(getHoverSpan('POS: ', `(${t.x},${t.y}) | ${t.angle}`));
        hoverDiv.appendChild(document.createElement('br'));
        hoverDiv.appendChild(getHoverSpan('FLAGS:', `${t.flagsString.map(f => `<br/><span>${f}</span>`).join('\n')}`));
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

const getButtonArea = (mapName: string) => {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = buttonContainerId;

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
    buttonContainer.appendChild(saveFullButton);

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
    buttonContainer.appendChild(saveCurrButton);

    const resetButton = document.createElement('button');
    resetButton.innerText = 'Reset';
    resetButton.onclick = () => {
        initMapWindowModule(mapName);
    };
    buttonContainer.appendChild(resetButton);
    return buttonContainer;
}

const getBottomArea = (mapName: string) => {
    const bottomArea = document.createElement('div');
    bottomArea.id = bottomAreaId;

    bottomArea.appendChild(getToggleArea(mapName));
    bottomArea.appendChild(getButtonArea(mapName));
    return bottomArea;
}

const refreshBottomAreaAndMap = (mapName: string) => {
    const windowArea = document.getElementById(mapWindowId);
    const bottomArea = document.getElementById(bottomAreaId);
    if (windowArea && bottomArea) {
        windowArea.removeChild(bottomArea);
        windowArea.appendChild(getBottomArea(mapName))
    }
    if (viewport) {
        thingCache = {};
        reDrawMap(Math.max(1 / viewport.scale.x, 0.05));
    }
}


const getToggleArea = (mapName: string) => {
    const toggleAreaParent = document.createElement('div');
    toggleAreaParent.id = toggleAreaId;

    const thingHead = document.createElement('p');
    thingHead.innerText = 'Toggle thing types';
    toggleAreaParent.appendChild(thingHead);

    const thingButtonContainer = document.createElement('div');
    toggleAreaParent.appendChild(thingButtonContainer);

    const generateThingToggleButton = (toggle: WadMapThingGroupRenderable | 'ALL') => {
        const container = document.createElement('div');
        const isSelected = () => {
            if (toggle === 'ALL' && enabledThingGroups.length === 7) return true;
            else return enabledThingGroups.includes(toggle as WadMapThingGroupRenderable);
        }
        container.style.opacity = isSelected() ? '1.0 ' : '0.5';
        const square = document.createElement('div');
        square.style.backgroundColor = getThingColor(toggle);
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = toggle;

        container.onclick = () => {
            if (toggle !== 'ALL') {
                let copy = [...enabledThingGroups];
                if (isSelected()) {
                    copy = copy.filter(t => t !== toggle);
                }
                else {
                    copy.push(toggle);
                }
                enabledThingGroups = copy;
            }
            else {
                if (isSelected()) {
                    enabledThingGroups = [];
                }
                else {
                    enabledThingGroups = Object.keys(WadMapThingGroupRenderable) as WadMapThingGroupRenderable[];
                }
            }
            refreshBottomAreaAndMap(mapName);
        }

        container.appendChild(textEl);
        return container;
    }

    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.MONSTER));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.ARTIFACT));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.POWERUP));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.WEAPON));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.AMMO));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.KEY));
    thingButtonContainer.appendChild(generateThingToggleButton(WadMapThingGroupRenderable.OTHER));
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
        }
        square.style.backgroundImage = getImg();
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = 'Net Play';

        container.onclick = () => {
            showMultiPlayer = (showMultiPlayer + 1) % 3;
            refreshBottomAreaAndMap(mapName);
        }

        container.appendChild(textEl);
        return container;
    }

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
        }
        square.style.backgroundImage = getImg();
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = `${dir === 'hide' ? 'Hide' : 'Show'} Skill`

        container.onclick = () => {
            if (dir === 'hide') {
                hideDifficulty = (hideDifficulty + 1) % 4;
            }
            else {
                showDifficulty = (showDifficulty + 1) % 4;
            }
            refreshBottomAreaAndMap(mapName);
        }

        container.appendChild(textEl);
        return container;
    }

    const generateGridButton = () => {
        const container = document.createElement('div');
        const square = document.createElement('div');
        square.style.backgroundColor = 'white';
        square.style.backgroundImage = showGrid ? 'url("x.png")' : '';
        container.appendChild(square);
        const textEl = document.createElement('p');
        textEl.innerText = 'Grid';

        container.onclick = () => {
            showGrid = !showGrid;
            refreshBottomAreaAndMap(mapName);
        }

        container.appendChild(textEl);
        return container;
    }

    flagAreaContainer.appendChild(generateNetToggleButton())
    flagAreaContainer.appendChild(generateDifficultyButton('show'))
    flagAreaContainer.appendChild(generateDifficultyButton('hide'))
    flagAreaContainer.appendChild(generateGridButton())


    return toggleAreaParent;
}
