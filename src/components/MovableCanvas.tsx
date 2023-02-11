/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useEffect, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type * as React from 'react';
import styled from '@emotion/styled';
import { WadMapThingGroupRenderable } from '../interfaces/wad/map/WadMapThing';
import { getThingColor } from '../library/utilities/thingUtils';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

interface CanvasProps {
    canvasWidth: number;
    canvasHeight: number;
    drawFunc: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number) => boolean;
    imageName: string;
    onFullSave: () => void;
    onFullSaveComplete: () => void;
    onCanvasMouse: (canvasPos: Point, realPos: Point) => void;
    onThingToggle: (toggled: WadMapThingGroupRenderable[], forceEnable?: 'on' | 'off') => void;
    clearHover: () => void;
    toggledThingGroups: WadMapThingGroupRenderable[];
    onMultiPlayerToggle: (toggled: number) => void;
    showMultiPlayer: number;
    onShowDifficultyToggle: (toggled: number) => void;
    showDifficulty: number;
    onHideDifficultyToggle: (toggled: number) => void;
    hideDifficulty: number;
    onShowGridToggle: (toggle: boolean) => void;
    showGrid: boolean;
}

interface Point {
    x: number;
    y: number;
}

const ORIGIN = Object.freeze({ x: 0, y: 0 });

// adjust to device to avoid blur
const { devicePixelRatio: ratio = 1 } = window;

function diffPoints(p1: Point, p2: Point) {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function addPoints(p1: Point, p2: Point) {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function scalePoint(p1: Point, scale: number) {
    return { x: p1.x / scale, y: p1.y / scale };
}

const ZOOM_SENSITIVITY = 0.25; // bigger for lower zoom per scroll

export default function MovableCanvas(props: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [offset, setOffset] = useState<Point>(ORIGIN);
    const [mousePos, setMousePos] = useState<Point>(ORIGIN);
    const [readyForRender, setReadyForRender] = useState(false);
    const viewportTopLeft = useRef<Point>(ORIGIN);
    const isResetRef = useRef<boolean>(false);
    const lastMousePosRef = useRef<Point>(ORIGIN);
    const lastOffsetRef = useRef<Point>(ORIGIN);
    const zoomReady = useRef<boolean>(false);
    const scale = useRef<number>(1);

    const {
        canvasHeight,
        canvasWidth,
        drawFunc,
        imageName,
        onFullSave,
        onFullSaveComplete,
        onCanvasMouse,
        onThingToggle,
        clearHover,
        toggledThingGroups,
        onMultiPlayerToggle,
        showMultiPlayer,
        onShowDifficultyToggle,
        showDifficulty,
        onHideDifficultyToggle,
        hideDifficulty,
        onShowGridToggle: onDrawGridToggle,
        showGrid: drawGrid,
    } = props;

    // update last offset
    useEffect(() => {
        lastOffsetRef.current = offset;
    }, [offset]);

    useEffect(() => {
        setReadyForRender(true);
    }, [toggledThingGroups, showMultiPlayer, showDifficulty, hideDifficulty, drawGrid]);

    const saveCanvas = (fullRender: boolean) => {
        if (context) {
            const fileName = fullRender ? `${imageName}-full.png` : `${imageName}-view.png`;
            const image = context.canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            const link = document.createElement('a');
            link.href = image;
            link.download = fileName;
            link.target = '_blank';
            link.click();
            onFullSaveComplete();
        }
    };

    // reset
    const reset = useCallback(
        (context: CanvasRenderingContext2D) => {
            if (context && !isResetRef.current) {
                // adjust for device pixel density
                context.canvas.width = canvasWidth * ratio;
                context.canvas.height = canvasHeight * ratio;
                context.scale(ratio, ratio);

                scale.current = 1;

                // reset state and refs
                setContext(context);
                setOffset(ORIGIN);
                setMousePos(ORIGIN);
                viewportTopLeft.current = ORIGIN;
                lastOffsetRef.current = ORIGIN;
                lastMousePosRef.current = ORIGIN;

                // this thing is so multiple resets in a row don't clear canvas
                isResetRef.current = true;
                setReadyForRender(true);
            }
        },
        [canvasWidth, canvasHeight],
    );

    // functions for panning
    const mouseMove = useCallback(
        (event: MouseEvent) => {
            if (context) {
                const lastMousePos = lastMousePosRef.current;
                const currentMousePos = { x: event.pageX, y: event.pageY }; // use document so can pan off element
                lastMousePosRef.current = currentMousePos;

                const mouseDiff = diffPoints(currentMousePos, lastMousePos);
                setOffset((prevOffset) => addPoints(prevOffset, mouseDiff));
            }
        },
        [context],
    );

    const mouseUp = useCallback(() => {
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
    }, [mouseMove]);

    const startPan = useCallback(
        (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('mouseup', mouseUp);
            lastMousePosRef.current = { x: event.pageX, y: event.pageY };
        },
        [mouseMove, mouseUp],
    );

    // setup canvas and set context
    useLayoutEffect(() => {
        if (canvasRef.current) {
            // get new drawing context
            const renderCtx = canvasRef.current.getContext('2d');

            if (renderCtx) {
                reset(renderCtx);
            }
        }
    }, [reset, canvasHeight, canvasWidth]);

    // pan when offset or scale changes
    useLayoutEffect(() => {
        if (context && lastOffsetRef.current) {
            const offsetDiff = scalePoint(diffPoints(offset, lastOffsetRef.current), scale.current);
            context.translate(offsetDiff.x, offsetDiff.y);
            viewportTopLeft.current = diffPoints(viewportTopLeft.current, offsetDiff);
            isResetRef.current = false;
        }
    }, [context, offset, scale]);

    // draw
    useLayoutEffect(() => {
        if (context) {
            // clear canvas but maintain transform
            const storedTransform = context.getTransform();
            // eslint-disable-next-line no-self-assign
            context.canvas.width = context.canvas.width;
            context.setTransform(storedTransform);
            const fullRender = drawFunc(context.canvas, context, context.getTransform().a);
            if (fullRender) {
                saveCanvas(fullRender);
            }
            zoomReady.current = true;
            setReadyForRender(false);
        }
    }, [canvasWidth, canvasHeight, context, offset, readyForRender]);

    // add event listener on canvas for mouse position
    useEffect(() => {
        const canvasElem = canvasRef.current;
        if (canvasElem === null) {
            return;
        }

        function handleUpdateMouse(event: MouseEvent) {
            event.preventDefault();
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    const viewportMousePos = { x: event.pageX, y: event.pageY };
                    const topLeftCanvasPos = {
                        x: canvasRef.current.offsetLeft + 200,
                        y: canvasRef.current.offsetTop + 40,
                    };
                    setMousePos(diffPoints(viewportMousePos, topLeftCanvasPos));

                    const canvasCoord = diffPoints(viewportMousePos, topLeftCanvasPos);
                    const transform = ctx.getTransform();
                    const transformedX = (canvasCoord.x - transform.e) / transform.a;
                    const transformedY = (canvasCoord.y - transform.f) / transform.d;
                    onCanvasMouse(
                        { x: transformedX, y: transformedY },
                        { x: viewportMousePos.x, y: viewportMousePos.y },
                    );
                }
            }
        }

        function onLeave() {
            clearHover();
        }

        canvasElem.addEventListener('mousemove', handleUpdateMouse);
        canvasElem.addEventListener('wheel', handleUpdateMouse);
        canvasElem.addEventListener('mouseleave', onLeave);
        return () => {
            canvasElem.removeEventListener('mousemove', handleUpdateMouse);
            canvasElem.removeEventListener('wheel', handleUpdateMouse);
            canvasElem.addEventListener('mouseleave', onLeave);
        };
    }, [onCanvasMouse, clearHover]);

    // add event listener on canvas for zoom
    useEffect(() => {
        const canvasElem = canvasRef.current;
        if (canvasElem === null) {
            return;
        }

        // this is tricky. Update the viewport's "origin" such that
        // the mouse doesn't move during scale - the 'zoom point' of the mouse
        // before and after zoom is relatively the same position on the viewport
        function handleWheel(event: WheelEvent) {
            event.preventDefault();
            if (context && zoomReady.current) {
                const zoom = 1 - Math.sign(event.deltaY) * ZOOM_SENSITIVITY;
                const viewportTopLeftDelta = {
                    x: (mousePos.x / scale.current) * (1 - 1 / zoom),
                    y: (mousePos.y / scale.current) * (1 - 1 / zoom),
                };
                const newViewportTopLeft = addPoints(viewportTopLeft.current, viewportTopLeftDelta);

                context.translate(viewportTopLeft.current.x, viewportTopLeft.current.y);
                context.scale(zoom, zoom);
                context.translate(-newViewportTopLeft.x, -newViewportTopLeft.y);

                viewportTopLeft.current = newViewportTopLeft;
                scale.current *= zoom;
                isResetRef.current = false;
                zoomReady.current = false;
                setReadyForRender(true);
            }
        }

        canvasElem.addEventListener('wheel', handleWheel);
        return () => {
            canvasElem.removeEventListener('wheel', handleWheel);
        };
    }, [context, mousePos.x, mousePos.y, viewportTopLeft, scale]);

    const ColorDivParent = styled('div')(() => ({
        height: '20px',
        display: 'flex',
        position: 'relative',
        minWidth: '60px',
    }));
    const ColorDiv = styled('div')(() => ({
        display: 'inline-block',
        position: 'relative',
        left: '10px',
        width: '20px',
        height: '20px',
        '&:hover': {
            cursor: 'pointer',
        },
    }));
    const ColorText = styled('span')(() => ({
        color: 'white',
        position: 'relative',
        top: '20px',
        fontSize: '10px',
        width: '0px',
        whiteSpace: 'nowrap',
        '&:hover': {
            cursor: 'pointer',
        },
    }));

    const toggleThingType = (textOffset: number, text: string, thingGroup: WadMapThingGroupRenderable) => {
        const backgroundColor = getThingColor(thingGroup);
        const enabled = toggledThingGroups.includes(thingGroup);
        const opacity = enabled ? 1 : 0.5;
        const textDecoration = enabled ? 'initial' : 'line-through';
        return (
            <ColorDivParent>
                <ColorDiv
                    style={{ backgroundColor, opacity }}
                    onClick={() => {
                        onThingToggle([thingGroup]);
                    }}
                />
                <ColorText
                    style={{ left: `${textOffset}px`, textDecoration }}
                    onClick={() => {
                        onThingToggle([thingGroup]);
                    }}
                >
                    {text}
                </ColorText>
            </ColorDivParent>
        );
    };

    const toggleAllThings = () => {
        const backgroundColor = 'white';
        const enabled = Object.keys(WadMapThingGroupRenderable).length === toggledThingGroups.length;
        const opacity = enabled ? 1 : 0.5;
        const textDecoration = enabled ? 'initial' : 'line-through';
        const renderables = Object.keys(WadMapThingGroupRenderable) as WadMapThingGroupRenderable[];
        return (
            <ColorDivParent>
                <ColorDiv
                    style={{ backgroundColor, opacity }}
                    onClick={() => {
                        onThingToggle(renderables, enabled ? 'off' : 'on');
                    }}
                />
                <ColorText
                    style={{ left: '-7px', textDecoration }}
                    onClick={() => {
                        onThingToggle(renderables, enabled ? 'off' : 'on');
                    }}
                >
                    {'All'}
                </ColorText>
            </ColorDivParent>
        );
    };

    const toggleBoolState = (text: string, state: boolean, offset: number, toggleFunc: (t: boolean) => void) => {
        const backgroundColor = 'white';
        const textDecoration = state ? 'initial' : 'line-through';
        const style: React.CSSProperties = { height: '14px', width: '14px', left: '3px', position: 'relative' };
        const getIcon = () => {
            if (!state) {
                return <ClearIcon style={style} />;
            }
            return <CheckIcon style={style} />;
        };
        return (
            <ColorDivParent>
                <ColorDiv
                    style={{ backgroundColor }}
                    onClick={() => {
                        toggleFunc(!state);
                    }}
                >
                    {getIcon()}
                </ColorDiv>
                <ColorText
                    style={{ left: `${offset}px`, textDecoration }}
                    onClick={() => {
                        toggleFunc(!state);
                    }}
                >
                    {text}
                </ColorText>
            </ColorDivParent>
        );
    };

    const toggleTriState = (text: string, state: number, offset: number, toggleFunc: (t: number) => void) => {
        const backgroundColor = 'white';
        const textDecoration = state !== 0 ? 'initial' : 'line-through';
        const style: React.CSSProperties = { height: '14px', width: '14px', left: '3px', position: 'relative' };
        const getIcon = () => {
            if (state === 0) {
                return <ClearIcon style={style} />;
            } else if (state === 1) {
                return <CheckIcon style={style} />;
            } else if (state === 2) {
                return <RadioButtonUncheckedIcon style={style} />;
            }
        };
        return (
            <ColorDivParent>
                <ColorDiv
                    style={{ backgroundColor }}
                    onClick={() => {
                        toggleFunc(state + 1);
                    }}
                >
                    {getIcon()}
                </ColorDiv>
                <ColorText
                    style={{ left: `${offset}px`, textDecoration }}
                    onClick={() => {
                        toggleFunc(state + 1);
                    }}
                >
                    {text}
                </ColorText>
            </ColorDivParent>
        );
    };

    const getDiffString = (diff: number, type: 'hide' | 'show'): [string, number] => {
        if (diff === 0) {
            return type === 'hide' ? ['None', -26] : ['All', -22];
        } else if (diff === 1) {
            return ['Easy', -26];
        } else if (diff === 2) {
            return ['Med', -25];
        } else if (diff === 3) {
            return ['Hard', -26];
        }
        return ['', 0];
    };

    const toggleDifficulty = (type: 'hide' | 'show', state: number, toggleFunc: (t: number) => void) => {
        const backgroundColor = 'white';
        const style: React.CSSProperties = { height: '14px', width: '14px', left: '3px', position: 'relative' };
        const getIcon = () => {
            if (type === 'hide') {
                if (state === 0) {
                    return <CheckIcon style={style} />;
                }
                return <ClearIcon style={style} />;
            } else {
                if (state === 0) {
                    return <CheckIcon style={style} />;
                }
                return <RadioButtonUncheckedIcon style={style} />;
            }
        };
        const [text, textOffset] = getDiffString(state, type);
        return (
            <ColorDivParent>
                <ColorDiv
                    style={{ backgroundColor }}
                    onClick={() => {
                        toggleFunc(state + 1);
                    }}
                >
                    {getIcon()}
                </ColorDiv>
                <ColorText
                    style={{ left: `${textOffset}px` }}
                    onClick={() => {
                        toggleFunc(state + 1);
                    }}
                >
                    {type === 'hide' ? 'Hide ' : 'Show '}
                    {text}
                </ColorText>
            </ColorDivParent>
        );
    };

    return (
        <>
            <canvas
                onMouseDown={startPan}
                ref={canvasRef}
                width={canvasWidth * ratio}
                height={canvasHeight * ratio}
                style={{
                    border: '2px solid #000',
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                }}
            />
            <br />
            <div
                style={{
                    display: 'inline-block',
                    backgroundColor: 'black',
                    height: '55px',
                    position: 'relative',
                    top: '-7px',
                    marginRight: '8px',
                    width: '465px',
                }}
            >
                <p
                    style={{
                        color: 'white',
                        margin: 0,
                        padding: 0,
                        fontSize: '12px',
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    Toggle thing types
                </p>
                <div style={{ display: 'inline-flex' }}>
                    {toggleThingType(-13, 'Other', WadMapThingGroupRenderable.OTHER)}
                    {toggleThingType(-20, 'Monster', WadMapThingGroupRenderable.MONSTER)}
                    {toggleThingType(-22, 'Powerup', WadMapThingGroupRenderable.POWERUP)}
                    {toggleThingType(-17, 'Artifact', WadMapThingGroupRenderable.ARTIFACT)}
                    {toggleThingType(-9, 'Key', WadMapThingGroupRenderable.KEY)}
                    {toggleThingType(-20, 'Weapon', WadMapThingGroupRenderable.WEAPON)}
                    {toggleThingType(-15, 'Ammo', WadMapThingGroupRenderable.AMMO)}
                    {toggleAllThings()}
                </div>
            </div>
            <br />
            <div
                style={{
                    display: 'inline-block',
                    backgroundColor: 'black',
                    height: '55px',
                    position: 'relative',
                    top: '-7px',
                    marginRight: '8px',
                    width: '465px',
                }}
            >
                <p
                    style={{
                        color: 'white',
                        margin: 0,
                        padding: 0,
                        fontSize: '12px',
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    Flags/Other
                </p>
                <div style={{ display: 'inline-flex' }}>
                    {toggleTriState('Net', showMultiPlayer, -8, onMultiPlayerToggle)}
                    {toggleDifficulty('show', showDifficulty, onShowDifficultyToggle)}
                    {toggleDifficulty('hide', hideDifficulty, onHideDifficultyToggle)}
                    {toggleBoolState('Grid', drawGrid, -10, onDrawGridToggle)}
                </div>
            </div>
            <button
                onClick={() => {
                    if (context) {
                        reset(context);
                    }
                    onFullSaveComplete();
                }}
            >
                Reset
            </button>
            <button
                style={{ marginLeft: '8px' }}
                onClick={() => {
                    saveCanvas(false);
                }}
            >
                Save View
            </button>
            <button
                style={{ marginLeft: '8px', marginRight: '8px' }}
                onClick={() => {
                    onFullSave();
                }}
            >
                Save Full
            </button>
        </>
    );
}
