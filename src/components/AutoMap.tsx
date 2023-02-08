import ReactJson from "react-json-view";
import { WadMap } from "../interfaces/wad/map/WadMap";
import { WadPlayPalTypedEntry } from "../interfaces/wad/WadPlayPal";
import MovableCanvas from "./MovableCanvas";

interface Props {
    mapData: WadMap;
    playPal: WadPlayPalTypedEntry;
}


export const AutoMap: React.FC<Props> = (props) => {
    const maxWidth = 620;
    const minWidth = maxWidth / 1.5;
    const maxHeight = 540;
    const minHeight = maxHeight / 1.5;
    const padding = 5;

    const { playPal, mapData } = props;
    if (!playPal || !mapData) return null;

    const getBounds = () => {
        let top = props.mapData.vertices[0].yPos;
        let left = props.mapData.vertices[0].xPos;
        let bottom = props.mapData.vertices[0].yPos;
        let right = props.mapData.vertices[0].xPos;
        for (var i = 1; i < props.mapData.vertices.length; i++) {
            if (props.mapData.vertices[i].xPos < left) left = props.mapData.vertices[i].xPos;
            if (props.mapData.vertices[i].xPos > right) right = props.mapData.vertices[i].xPos;
            if (props.mapData.vertices[i].yPos < top) top = props.mapData.vertices[i].yPos;
            if (props.mapData.vertices[i].yPos > bottom) bottom = props.mapData.vertices[i].yPos;
        }
        return { top, left, bottom, right };
    }
    const bounds = getBounds();

    const getDimensions = () => {
        const mapWidth = bounds.right - bounds.left;
        let scaledWidth = mapWidth;
        const mapHeight = bounds.bottom - bounds.top;
        let scaledHeight = mapHeight;
        let scale = 1;
        if (mapWidth > maxWidth || mapHeight > maxHeight) {
            if (mapWidth > mapHeight) {
                scale = maxWidth / mapWidth;
            }
            else {
                scale = maxHeight / mapHeight;
            }
            scaledWidth = mapWidth * scale;
            scaledHeight = mapHeight * scale;
        }
        return { height: scaledHeight, width: scaledWidth, scale };
    }
    const dim = getDimensions();

    const drawFunc = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number) => {

        const bounds = getBounds();
        const dim = getDimensions();
        ctx.fillStyle = props.playPal[0].hex;
        ctx.fillRect(-canvas.width * 10, -canvas.height * 10, canvas.width * 20, canvas.height * 20);
        props.mapData.linedefs.forEach((line) => {
            const vStart = { ...props.mapData.vertices[line.start] };
            const vEnd = { ...props.mapData.vertices[line.end] };

            vStart.xPos -= bounds.left;
            vStart.yPos -= bounds.top;
            vEnd.xPos -= bounds.left;
            vEnd.yPos -= bounds.top;

            vStart.xPos *= dim.scale;
            vStart.yPos *= dim.scale;
            vEnd.xPos *= dim.scale;
            vEnd.yPos *= dim.scale;

            ctx.strokeStyle = props.playPal[96].hex;
            const frontSide = { ...props.mapData.sidedefs[line.frontSideDef] };
            const frontSector = { ...props.mapData.sectors[frontSide.sector] };

            const isSecretSector = frontSector.specialType === 9;
            const isHiddenSecret = line.flagsString.includes('SECRET');
            if (line.backSideDef !== -1 && !isHiddenSecret) {
                const backSide = { ...props.mapData.sidedefs[line.backSideDef] };
                const backSector = { ...props.mapData.sectors[backSide.sector] };
                if (frontSector.floorHeight !== backSector.floorHeight) {
                    ctx.strokeStyle = props.playPal[64].hex;
                }
                else if (frontSector.ceilingHeight !== backSector.ceilingHeight) {
                    ctx.strokeStyle = props.playPal[231].hex;
                }
            }
            else if (isSecretSector && !isHiddenSecret) {
                ctx.strokeStyle = props.playPal[251].hex;
            }
            else {
                ctx.strokeStyle = props.playPal[176].hex;
            }


            ctx.lineWidth = 1 / (scale / 2);
            ctx.beginPath();
            ctx.moveTo(vStart.xPos + padding, (canvas.height - vStart.yPos) - padding);
            ctx.lineTo(vEnd.xPos + padding, (canvas.height - vEnd.yPos) - padding);
            ctx.stroke();
        });
    }
    return (
        <>
            <div style={{ margin: '20px' }}>
                <MovableCanvas canvasWidth={Math.max(dim.width + padding * 2, minWidth)} canvasHeight={Math.max(dim.height + padding * 2, minHeight)} drawFunc={drawFunc} />
            </div>
            <div style={{ margin: '20px', fontSize: '12px' }} >
                <p>Things:</p>
                <ReactJson src={props.mapData.things} groupArraysAfterLength={10000} name={null} collapsed={true} displayDataTypes={false} />
                <p>Linedefs:</p>
                <ReactJson src={props.mapData.linedefs} groupArraysAfterLength={10000} name={null} collapsed={true} displayDataTypes={false} />
                <p>Sidedefs:</p>
                <ReactJson src={props.mapData.sidedefs} groupArraysAfterLength={10000} name={null} collapsed={true} displayDataTypes={false} />
                <p>Sectors:</p>
                <ReactJson src={props.mapData.sectors} groupArraysAfterLength={10000} name={null} collapsed={true} displayDataTypes={false} />
                <p>Vertices:</p>
                <ReactJson src={props.mapData.vertices} groupArraysAfterLength={10000} name={null} collapsed={true} displayDataTypes={false} />
            </div>
        </>
    );
}