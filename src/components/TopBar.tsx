import { Box, styled } from '@mui/material';
import { type PropsWithChildren } from 'react';
import { defaultSidebarWidth, defaultTopbarHeight } from '../library/constants';

interface Props {
    sideBarWidth?: number;
    height?: number;
}

export const TopBar: React.FC<PropsWithChildren<Props>> = (props: PropsWithChildren<Props>) => {
    const { sideBarWidth, height, children } = props;

    const TopBarBox = styled(Box)({
        width: `calc(100vw - ${(sideBarWidth ?? defaultSidebarWidth) + 20}px)`,
        borderBottom: '1px solid grey',
        position: 'fixed',
        height: height ?? defaultTopbarHeight,
        backgroundColor: 'white',
        zIndex: 100,
        left: sideBarWidth ?? defaultSidebarWidth,
        top: 0,
    });
    return <TopBarBox>{children}</TopBarBox>;
};
