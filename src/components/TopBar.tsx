import { Box, styled } from "@mui/material";
import { PropsWithChildren } from "react";

interface Props {
    sideBarWidth?: number;
    height?: number;
}

export const TopBar: React.FC<PropsWithChildren<Props>> = (props) => {
    const TopBarBox = styled(Box)({
        width: `calc(100vw - ${props.sideBarWidth ?? 200}px)`,
        borderBottom: '1px solid grey',
        position: 'fixed',
        height: props.height ?? 40,
        backgroundColor: 'white',
        zIndex: 100,
        left: props.sideBarWidth ?? 200,
        top: 0,
    });
    return <TopBarBox>{props.children}</TopBarBox>;
}