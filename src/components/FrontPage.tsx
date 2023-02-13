import { useRef, useState } from 'react';
import { WadFile } from '../library/wad/wadFile';
import { type WadFileEvent } from '../interfaces/wad/WadFileEvent';
import { Box, Button, type ButtonProps, CssBaseline, styled } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SideMenu } from './SideMenu';
import { TopBar } from './TopBar';
import { Content } from './Content';
import { Accordion, AccordionDetails, AccordionSummary } from './Accordions';
import { initialSelectedPage, type SelectedPageInfo, SelectedPageType } from '../interfaces/MenuSelection';
import { PlayPal } from './PlayPal';
import { ColorMap } from './ColorMap';
import { AutoMap } from './AutoMap';
import { HeaderPage } from './HeaderPage';
import { type WadHeader } from '../interfaces/wad/WadHeader';
import { type WadDirectory } from '../interfaces/wad/WadDirectory';
import { type WadMapGroupList, type WadMapList } from '../interfaces/wad/map/WadMap';
import { type WadPlayPal } from '../interfaces/wad/WadPlayPal';
import { type WadColorMap } from '../interfaces/wad/WadColorMap';
import { LoadingLog } from './LoadingLog';

const LeftButton = styled((props: ButtonProps) => <Button {...props} />)(() => ({
    width: '100%',
    justifyContent: 'left',
}));

export const FrontPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [, setWadLoadSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setLastEvent] = useState<WadFileEvent | null>(null);
    const [selectedPage, setSelectedPage] = useState<SelectedPageInfo>(initialSelectedPage);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const eventLog = useRef<string[]>([]);

    const wadFileRef = useRef(
        new WadFile({
            eventListener: (e, msg) => {
                setLastEvent(e);
                eventLog.current.push(msg ?? e);
            },
            breatheInLog: true,
            debugLog: true,
        }),
    );

    const headerRef = useRef<WadHeader | null>(null);
    const directoryRef = useRef<WadDirectory | null>(null);
    const mapGroupsRef = useRef<WadMapGroupList | null>(null);
    const mapsRef = useRef<WadMapList | null>(null);
    const playPalRef = useRef<WadPlayPal | null>(null);
    const colorMapRef = useRef<WadColorMap | null>(null);

    const wadFile = wadFileRef.current;
    const doomUrl = './DOOM1.WAD';

    const onLoadWadFileSuccess = async (succ: boolean): Promise<void> => {
        setWadLoadSuccess(succ);
        const wadHeader = await wadFile.header();
        if (wadHeader) headerRef.current = wadHeader;
        const wadDirectory = await wadFile.directory();

        if (wadDirectory) directoryRef.current = wadDirectory;
        const mapGroups = await wadFile.mapGroups();

        if (mapGroups) mapGroupsRef.current = mapGroups;
        const maps = await wadFile.maps();

        if (maps) mapsRef.current = maps;
        const playPal = await wadFile.playpal();

        if (playPal) playPalRef.current = playPal;
        const colorMap = await wadFile.colormap();

        if (colorMap) colorMapRef.current = colorMap;
        eventLog.current.push('LOADING READY');
        setLoading(false);
    };

    const loadFileFromUrl = (url: string): void => {
        eventLog.current = [];
        setLoading(true);
        setWadLoadSuccess(false);
        setSelectedPage(initialSelectedPage);
        wadFile.loadFileFromUrl(url, onLoadWadFileSuccess);
    };

    const loadFile = (f: File): void => {
        eventLog.current = [];
        setLoading(true);
        setWadLoadSuccess(false);
        setSelectedPage(initialSelectedPage);
        wadFile.loadFile(f, onLoadWadFileSuccess);
    };

    const getPlayPalContent = (): JSX.Element[] | null => {
        if (!playPalRef.current) return null;
        return playPalRef.current.typedPlaypal.map((p, idx) => {
            return (
                <div style={{ display: 'inline-block' }} key={`${p[0].hex}_${idx}`}>
                    <span>Palette {idx}</span>
                    <PlayPal playPal={p} />
                </div>
            );
        });
    };

    const getColorMapContent = (): JSX.Element[] | null => {
        if (!playPalRef.current || !colorMapRef.current) return null;
        const playPal = playPalRef.current;
        const colorMap = colorMapRef.current;
        return playPal.typedPlaypal.map((p, idx) => {
            return (
                <div style={{ display: 'inline-block' }} key={`${p[0].hex}_colormap${idx}`}>
                    <span>Palette {idx}</span>
                    <ColorMap playPal={p} colorMap={colorMap} />
                </div>
            );
        });
    };

    const getMapContent = (): JSX.Element | null => {
        if (!mapsRef.current || !playPalRef.current) return null;
        const mapData = mapsRef.current.find((m) => m.name === selectedPage[1]);
        if (!mapData) return null;

        const parseName = (): string => {
            const removeWad = wadFile.fileName.split(/[.]WAD/i)[0];
            const afterSlash = removeWad.split('/').pop();
            if (afterSlash) return afterSlash;
            else return removeWad;
        };

        return (
            <div style={{ display: 'inline-block' }}>
                <AutoMap mapData={mapData} playPal={playPalRef.current.typedPlaypal[0]} wadName={parseName()} />
            </div>
        );
    };

    const getHeaderContent = (): JSX.Element | null => {
        if (headerRef.current) return <HeaderPage header={headerRef.current} />;
        return null;
    };

    const getContentPage = (): React.ReactNode | null => {
        if (loading) {
            return (
                <div style={{ width: '100%', marginTop: '8px' }}>
                    <LoadingLog log={eventLog.current} />
                </div>
            );
        } else {
            switch (selectedPage[0]) {
                case SelectedPageType.PLAYPAL:
                    return getPlayPalContent();
                case SelectedPageType.COLORMAP:
                    return getColorMapContent();
                case SelectedPageType.MAP:
                    return getMapContent();
                case SelectedPageType.HEADER:
                    return getHeaderContent();
                default:
                    return (
                        <div style={{ width: '100%', marginTop: '8px' }}>
                            <LoadingLog log={eventLog.current} />
                        </div>
                    );
            }
        }
    };

    return (
        <>
            <CssBaseline />
            <SideMenu>
                {(headerRef.current || directoryRef.current || mapGroupsRef.current) && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Meta</AccordionSummary>
                        <AccordionDetails>
                            {headerRef.current && (
                                <LeftButton
                                    onClick={() => {
                                        setSelectedPage([SelectedPageType.HEADER, 'Header data']);
                                    }}
                                >
                                    Header
                                </LeftButton>
                            )}
                            {directoryRef.current && (
                                <LeftButton
                                    onClick={() => {
                                        setSelectedPage([SelectedPageType.DIRECTORY, 'Directory data']);
                                    }}
                                >
                                    Directory
                                </LeftButton>
                            )}
                            {mapGroupsRef.current && (
                                <LeftButton
                                    onClick={() => {
                                        setSelectedPage([SelectedPageType.MAPGROUPS, 'MapGroup Lumps']);
                                    }}
                                >
                                    MapGroups
                                </LeftButton>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
                {(playPalRef.current || colorMapRef.current) && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Colors</AccordionSummary>
                        <AccordionDetails>
                            {playPalRef.current && (
                                <LeftButton
                                    onClick={() => {
                                        setSelectedPage([SelectedPageType.PLAYPAL, 'PLAYPAL']);
                                    }}
                                >
                                    PlayPal
                                </LeftButton>
                            )}
                            {colorMapRef.current && (
                                <LeftButton
                                    onClick={() => {
                                        setSelectedPage([SelectedPageType.COLORMAP, 'COLORMAP']);
                                    }}
                                >
                                    ColorMap
                                </LeftButton>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
                {mapsRef.current && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Maps</AccordionSummary>
                        <AccordionDetails>
                            {mapsRef.current?.map((m) => {
                                return (
                                    <LeftButton
                                        key={m.name}
                                        onClick={() => {
                                            setSelectedPage([SelectedPageType.MAP, m.name]);
                                        }}
                                    >
                                        {m.name}
                                    </LeftButton>
                                );
                            })}
                        </AccordionDetails>
                    </Accordion>
                )}
            </SideMenu>
            <TopBar>
                <div style={{ padding: '6px' }}>
                    {wadFile.fileName && (
                        <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{wadFile.fileName}</span>
                    )}
                    {selectedPage[1] && (
                        <span style={{ fontWeight: 'bold', marginRight: '8px' }}>| {selectedPage[1]}</span>
                    )}
                    <div style={{ display: 'inline-block', float: 'right' }}>
                        <button
                            onClick={() => {
                                loadFileFromUrl(doomUrl);
                            }}
                        >
                            Load DOOM1.WAD
                        </button>
                        <input
                            style={{ display: 'none' }}
                            type="file"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const f = e.target.files[0];
                                    loadFile(f);
                                }
                            }}
                            ref={inputRef}
                        />
                        <button
                            onClick={() => {
                                if (inputRef.current) inputRef.current.click();
                            }}
                        >
                            Select File
                        </button>
                    </div>
                </div>
            </TopBar>
            <Content>
                <Box sx={{ paddingLeft: '8px' }}>{getContentPage()}</Box>
            </Content>
        </>
    );
};
