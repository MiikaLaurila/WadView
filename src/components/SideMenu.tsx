import { Box, styled } from "@mui/material";
import { PropsWithChildren } from "react";

interface Props {
    width?: number;
}

export const SideMenu: React.FC<PropsWithChildren<Props>> = (props) => {
    const SideBarBox = styled(Box)({
        width: props.width ?? 200,
        borderRight: '1px solid grey',
        position: 'fixed',
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 100,
        top: 0,
        left: 0,
        overflowY: 'scroll'
    });
    return <SideBarBox>{props.children}</SideBarBox>;
}