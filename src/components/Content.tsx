import { Box, styled } from "@mui/material";
import { PropsWithChildren } from "react";

interface Props {
    sideBarWidth?: number;
    topBarHeight?: number;
}

export const Content: React.FC<PropsWithChildren<Props>> = (props) => {
    const ContentBox = styled(Box)({
        maxWidth: `calc(100vw - ${props.sideBarWidth ?? 220}px)`,
        position: 'relative',
        left: props.sideBarWidth ?? 200,
        top: props.topBarHeight ?? 40,
    });
    return <ContentBox>{props.children}</ContentBox>;
}