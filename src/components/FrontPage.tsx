import { useEffect, useRef, useState } from "react";
import { WadFile } from "../library/wad/wadFile";
import ReactJson from "react-json-view";
import { WadFileEvent } from "../interfaces/WadFileEvent";

export const FrontPage: React.FC = () => {
    const [wadLoadSuccess, setWadLoadSuccess] = useState(false);
    const [lastEvent, setLastEvent] = useState<WadFileEvent | null>(null);
    const [selectedMapName, setSelectedMapName] = useState<string | null>(null);

    useEffect(() => {
        console.log(lastEvent);
    }, [lastEvent])

    const wadFileRef = useRef(new WadFile((e, msg) => {
        setLastEvent(e);
        // console.log(e, '|', msg);
    }));
    const wadFile = wadFileRef.current;
    const doomUrl = './DOOM.WAD';
    const doom2Url = './DOOM2.WAD';
    const wadHeader = wadFile.header;
    const wadDirectory = wadFile.directory;
    const mapGroups = wadFile.mapGroups;
    const maps = wadFile.maps;
    const selectedMap = maps?.find(m => m.name === selectedMapName);

    const loadFileFromUrl = (url: string) => {
        setWadLoadSuccess(false);
        wadFile.loadFileFromUrl(url, (success, err) => {
            setWadLoadSuccess(success);
        });
    }

    const loadFile = (f: File) => {
        setWadLoadSuccess(false);
        wadFile.loadFile(f, (success, err) => {
            setWadLoadSuccess(success);
        });
    }

    return (
        <div>
            <button onClick={() => { loadFileFromUrl(doomUrl) }}>Load DOOM.WAD</button>
            <button onClick={() => { loadFileFromUrl(doom2Url) }}>Load DOOM2.WAD</button>
            <input type='file' onChange={(e) => {
                if (e.target.files) {
                    const f = e.target.files[0];
                    loadFile(f);
                }
            }} />
            {wadFile.wadLoadAttempted && (
                <>
                    <p>Success: {wadLoadSuccess.toString()}</p>
                    <p>Length: {wadFile.wadFileLength}</p>
                    {wadFile.wadLoadError && <p>Error: {wadFile.wadLoadError}</p>}
                    {wadHeader && (<><p>Header: </p>{<ReactJson src={wadHeader} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />}</>)}
                    {wadDirectory && (<p>Directory: {wadDirectory.length} entries parsed</p>)}
                    {mapGroups && (<><p>Map groups: </p>{<ReactJson src={mapGroups} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />}</>)}
                    <br />
                    {maps && (
                        maps.map((m) => {
                            return <button key={m.name} onClick={() => { setSelectedMapName(m.name) }}>{m.name}</button>
                        })
                    )}
                    {selectedMapName && <p>Selected map: {selectedMapName}</p>}
                    {selectedMap && (
                        <>
                            <p>Things</p>
                            <ReactJson src={selectedMap.things} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Linedefs</p>
                            <ReactJson src={selectedMap.linedefs} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Sidedefs</p>
                            <ReactJson src={selectedMap.sidedefs} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Vertices</p>
                            <ReactJson src={selectedMap.vertices} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Segments</p>
                            <ReactJson src={selectedMap.segments} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>SubSectors</p>
                            <ReactJson src={selectedMap.subSectors} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Nodes</p>
                            <ReactJson src={selectedMap.nodes} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Sectors</p>
                            <ReactJson src={selectedMap.sectors} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                            <p>Rejects</p>
                            <ReactJson src={selectedMap.rejectTable} displayDataTypes={false} collapsed={true} name={null} groupArraysAfterLength={10000} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}