import { Box, styled } from '@mui/material';
import { type PropsWithChildren } from 'react';
import { defaultSidebarWidth } from '../library/constants';

interface Props {
    width?: number;
}

export const SideMenu: React.FC<PropsWithChildren<Props>> = (props: PropsWithChildren<Props>) => {
    const { width, children } = props;
    const SideBarBox = styled(Box)({
        width: width ?? defaultSidebarWidth,
        borderRight: '1px solid grey',
        position: 'fixed',
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 100,
        top: 0,
        left: 0,
        overflowY: 'scroll',
    });
    return <SideBarBox>{children}</SideBarBox>;
};
