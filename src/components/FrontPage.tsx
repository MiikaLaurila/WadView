import { useEffect, useRef, useState } from "react";
import { WadFile } from "../library/wad/wadFile";
import { WadFileEvent } from "../interfaces/wad/WadFileEvent";
import { Box, Button, ButtonProps, CircularProgress, CssBaseline, styled } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SideMenu } from "./SideMenu";
import { TopBar } from "./TopBar";
import { Content } from "./Content";
import { Accordion, AccordionDetails, AccordionSummary } from "./Accordions";
import { initialSelectedPage, SelectedPageInfo, SelectedPageType } from "../interfaces/MenuSelection";
import { PlayPal } from "./PlayPal";
import { ColorMap } from "./ColorMap";
import { AutoMap } from "./AutoMap";

const LeftButton = styled((props: ButtonProps) => (
    <Button {...props} />
))(({ theme }) => ({
    width: '100%',
    justifyContent: 'left'
}));

export const FrontPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setWadLoadSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastEvent, setLastEvent] = useState<WadFileEvent | null>(null);
    const [selectedPage, setSelectedPage] = useState<SelectedPageInfo>(initialSelectedPage);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        console.log(lastEvent);
    }, [lastEvent])

    const wadFileRef = useRef(
        new WadFile(
            false,
            false,
            (e, msg) => {
                setLastEvent(e);
                // console.log(e, '|', msg);
            }
        )
    );
    const wadFile = wadFileRef.current;
    const doomUrl = './DOOM.WAD';
    const doom2Url = './DOOM2.WAD';
    const wadHeader = wadFile.header;
    const wadDirectory = wadFile.directory;
    const mapGroups = wadFile.mapGroups;
    const maps = wadFile.maps;
    const playPal = wadFile.playpal;
    const colorMap = wadFile.colormap;

    const loadFileFromUrl = (url: string) => {
        setLoading(true);
        setWadLoadSuccess(false);
        setSelectedPage(initialSelectedPage);
        wadFile.loadFileFromUrl(url, (success, err) => {
            setWadLoadSuccess(success);
            setLoading(false);
        });
    }

    const loadFile = (f: File) => {
        setLoading(true);
        setWadLoadSuccess(false);
        setSelectedPage(initialSelectedPage);
        wadFile.loadFile(f, (success, err) => {
            setWadLoadSuccess(success);
            setLoading(false);
        });
    }

    const getPlayPalContent = () => {
        if (!playPal) return null;
        return playPal.typedPlaypal.map((p, idx) => {
            return (
                <div style={{ display: 'inline-block' }} key={p[0].hex + '_' + idx}>
                    <span>Palette {idx}</span>
                    <PlayPal playPal={p} />
                </div>
            )
        })
    }

    const getColorMapContent = () => {
        if (!playPal || !colorMap) return null;
        return playPal.typedPlaypal.map((p, idx) => {
            return (
                <div style={{ display: 'inline-block' }} key={p[0].hex + '_colormap' + idx}>
                    <span>Palette {idx}</span>
                    <ColorMap playPal={p} colorMap={colorMap} />
                </div>
            )
        })
    }

    const getMapContent = () => {
        if (!maps || !playPal) return null;
        const mapData = maps.find(m => m.name === selectedPage[1]);
        if (!mapData) return null;
        return (
            <div style={{ display: 'inline-block' }}>
                <span>AutoMap</span>
                <AutoMap mapData={mapData} playPal={playPal.typedPlaypal[0]} />
            </div>
        )
    }

    const getContentPage = () => {
        if (loading) {
            return (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h1>Loading...</h1>
                    <CircularProgress disableShrink={true} />
                </div>
            )
        }
        else {
            switch (selectedPage[0]) {
                case SelectedPageType.PLAYPAL:
                    return getPlayPalContent();
                case SelectedPageType.COLORMAP:
                    return getColorMapContent();
                case SelectedPageType.MAP:
                    return getMapContent();
                default:
                    return null;
            }
        }
    }


    return (
        <>
            <CssBaseline />
            <SideMenu>
                {(wadHeader || wadDirectory || mapGroups) && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Meta</AccordionSummary>
                        <AccordionDetails>
                            {wadHeader && (
                                <LeftButton
                                    onClick={() => { setSelectedPage([SelectedPageType.HEADER, 'Header data']) }}
                                >
                                    Header
                                </LeftButton>
                            )}
                            {wadDirectory && (
                                <LeftButton
                                    onClick={() => { setSelectedPage([SelectedPageType.DIRECTORY, 'Directory data']) }}
                                >
                                    Directory
                                </LeftButton>
                            )}
                            {mapGroups && (
                                <LeftButton
                                    onClick={() => { setSelectedPage([SelectedPageType.MAPGROUPS, 'MapGroup Lumps']) }}
                                >
                                    MapGroups
                                </LeftButton>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
                {(playPal || colorMap) && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Colors</AccordionSummary>
                        <AccordionDetails>
                            {playPal && (
                                <LeftButton
                                    onClick={() => { setSelectedPage([SelectedPageType.PLAYPAL, 'PLAYPAL']) }}
                                >
                                    PlayPal
                                </LeftButton>
                            )}
                            {colorMap && (
                                <LeftButton
                                    onClick={() => { setSelectedPage([SelectedPageType.COLORMAP, 'COLORMAP']) }}
                                >
                                    ColorMap
                                </LeftButton>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
                {maps && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Maps</AccordionSummary>
                        <AccordionDetails>
                            {maps && maps.map((m) => {
                                return (
                                    <LeftButton
                                        key={m.name}
                                        onClick={() => { setSelectedPage([SelectedPageType.MAP, m.name]) }}
                                    >
                                        {m.name}
                                    </LeftButton>
                                )
                            })}
                        </AccordionDetails>
                    </Accordion>
                )}
            </SideMenu>
            <TopBar>
                <div style={{ padding: '6px' }}>
                    {wadFile.fileName && <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{wadFile.fileName}</span>}
                    <button onClick={() => { loadFileFromUrl(doomUrl) }}>Load DOOM.WAD</button>
                    <button onClick={() => { loadFileFromUrl(doom2Url) }}>Load DOOM2.WAD</button>
                    <input
                        style={{ display: 'none' }}
                        type='file'
                        onChange={(e) => {
                            if (e.target.files) {
                                const f = e.target.files[0];
                                loadFile(f);
                            }
                        }}
                        ref={inputRef}
                    />
                    <button onClick={() => { if (inputRef.current) inputRef.current.click() }}>Select File</button>
                </div>
            </TopBar>
            <Content>
                <Box sx={{ paddingLeft: '8px' }}>
                    <h1 style={{ margin: 0, padding: 0 }}>{selectedPage[1]}</h1>
                    {getContentPage()}
                </Box>
            </Content>
        </>
    );
}