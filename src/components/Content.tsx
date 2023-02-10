import { Box, styled } from '@mui/material';
import { type PropsWithChildren } from 'react';

interface Props {
    sideBarWidth?: number;
    topBarHeight?: number;
}

export const Content: React.FC<PropsWithChildren<Props>> = (props: PropsWithChildren<Props>) => {
    const { sideBarWidth, topBarHeight, children } = props;
    const ContentBox = styled(Box)({
        maxWidth: `calc(100vw - ${sideBarWidth ?? 220}px)`,
        position: 'relative',
        left: sideBarWidth ?? 200,
        top: topBarHeight ?? 40,
    });
    return <ContentBox>{children}</ContentBox>;
};
