import { useEffect, useRef, useState } from "react";
import { WadColorMap } from "../interfaces/wad/WadColorMap";
import { WadPlayPalColor, WadPlayPalTypedEntry } from "../interfaces/wad/WadPlayPal";

interface Props {
    colorMap: WadColorMap;
    playPal: WadPlayPalTypedEntry;
}

interface HoverData {
    xPos: number;
    yPos: number;
    color: WadPlayPalColor;
    colorIndex: number;
}

export const ColorMap: React.FC<Props> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const colorBlockSize = 3;
    const [hoverData, setHoverData] = useState<HoverData | null>(null);

    useEffect(() => {
        if (!props.colorMap || !props.playPal) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 256 * colorBlockSize;
        canvas.height = 34 * colorBlockSize;

        props.colorMap.forEach((e, idx) => {
            e.forEach((colorIndex, colorPos) => {
                ctx.fillStyle = props.playPal[colorIndex].hex;
                const xPos = (colorPos % 256) * colorBlockSize;
                const yPos = idx * colorBlockSize;
                ctx.fillRect(xPos, yPos, colorBlockSize, colorBlockSize);
            });
        });

    }, [props.playPal, props.colorMap]);

    const { playPal, colorMap } = props;
    if (!playPal || !colorMap) return null;

    return (
        <div style={{ margin: '20px' }}>
            <canvas ref={canvasRef} />
            {hoverData && (
                <div
                    style={{
                        position: 'fixed',
                        top: hoverData.yPos - 62,
                        left: hoverData.xPos,
                        border: '1px solid black',
                        backgroundColor: 'white',
                        width: '120px',
                        height: '60px',
                        fontSize: '12px',
                        paddingLeft: '2px'
                    }}
                >
                    <span>idx: {hoverData.colorIndex}</span>
                    <br />
                    <span>hex: {hoverData.color.hex}</span>
                    <br />
                    <span>rgb: {`(${hoverData.color.r}, ${hoverData.color.g}, ${hoverData.color.b})`}</span>
                </div>
            )}
        </div>
    );
}