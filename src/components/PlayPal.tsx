import { useEffect, useRef, useState } from "react";
import { WadPlayPalColor, WadPlayPalTypedEntry } from "../interfaces/wad/WadPlayPal";

interface Props {
    playPal: WadPlayPalTypedEntry;
}

interface HoverData {
    xPos: number;
    yPos: number;
    color: WadPlayPalColor;
    colorIndex: number;
}

export const PlayPal: React.FC<Props> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const colorBlockSize = 16;
    const [hoverData, setHoverData] = useState<HoverData | null>(null);

    useEffect(() => {
        if (!props.playPal) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 16 * colorBlockSize;
        canvas.height = 16 * colorBlockSize;

        props.playPal.forEach((e, idx) => {
            ctx.fillStyle = e.hex;
            ctx.fillRect((idx % 16) * colorBlockSize, Math.floor(idx / 16) * colorBlockSize, colorBlockSize, colorBlockSize);
        });

        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const xPos = e.clientX - rect.left;
            const yPos = e.clientY - rect.top;
            const xIndex = Math.floor(xPos / colorBlockSize);
            const yIndex = Math.floor(yPos / colorBlockSize);
            const totalIndex = yIndex * 16 + xIndex
            const color = props.playPal[totalIndex];
            setHoverData({ xPos: e.x, yPos: e.y, color, colorIndex: totalIndex })
        };
        canvas.onmouseleave = () => {
            setHoverData(null);
        }

    }, [props.playPal]);

    const { playPal } = props;
    if (!playPal) return null;

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