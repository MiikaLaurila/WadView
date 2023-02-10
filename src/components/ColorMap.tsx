import { useEffect, useRef } from 'react';
import { type WadColorMap } from '../interfaces/wad/WadColorMap';
import { type WadPlayPalTypedEntry } from '../interfaces/wad/WadPlayPal';

interface Props {
    colorMap: WadColorMap;
    playPal: WadPlayPalTypedEntry;
}

export const ColorMap: React.FC<Props> = (props: Props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const colorBlockSize = 3;
    const { colorMap, playPal } = props;

    useEffect(() => {
        if (!colorMap || !playPal) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 256 * colorBlockSize;
        canvas.height = 34 * colorBlockSize;

        colorMap.forEach((e, idx) => {
            e.forEach((colorIndex, colorPos) => {
                ctx.fillStyle = playPal[colorIndex].hex;
                const xPos = (colorPos % 256) * colorBlockSize;
                const yPos = idx * colorBlockSize;
                ctx.fillRect(xPos, yPos, colorBlockSize, colorBlockSize);
            });
        });
    }, [playPal, colorMap]);

    if (!playPal || !colorMap) return null;

    return (
        <div style={{ margin: '20px' }}>
            <canvas ref={canvasRef} />
        </div>
    );
};
