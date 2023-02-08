import { useRef, useState } from "react";
import { WadFile } from "../library/wad/wadFile";
import ReactJson from "react-json-view";

export const FrontPage: React.FC = () => {
    const [wadLoadSuccess, setWadLoadSuccess] = useState(false);
    const wadFileRef = useRef(new WadFile());
    const wadFile = wadFileRef.current;
    const url = './DOOM.WAD';
    const wadHeader = wadFile.header;
    const wadDirectory = wadFile.directory;
    const maps = wadFile.maps;
    console.log(maps);

    const loadFile = () => {
        wadFile.loadFile(url, (success, err) => {
            setWadLoadSuccess(success);
        });
    }
    return (
        <div>
            <button onClick={loadFile}>Load DOOM.WAD</button>
            {wadFile.wadLoadAttempted && (
                <>
                    <p>Success: {wadLoadSuccess.toString()}</p>
                    <p>Length: {wadFile.wadFileLength}</p>
                    {wadFile.wadLoadError && <p>Error: {wadFile.wadLoadError}</p>}
                    {wadHeader && (<><p>Header: </p>{<ReactJson src={wadHeader} displayDataTypes={false} collapsed={true} />}</>)}
                    {wadDirectory && (<p>Directory: {wadDirectory.length} entries parsed</p>)}
                </>
            )}
        </div>
    );
}