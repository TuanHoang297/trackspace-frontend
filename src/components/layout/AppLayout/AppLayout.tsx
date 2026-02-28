import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { DRAWER_WIDTH, DRAWER_COLLAPSED } from '../Sidebar/Sidebar';
import Header from '../Header/Header';

const AppLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const drawerWidth = sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
            <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <Header
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                drawerWidth={drawerWidth}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    transition: 'all 0.2s ease',
                }}
            >
                <Toolbar /> {/* spacer for fixed AppBar */}
                <Outlet />
            </Box>
        </Box>
    );
};

export default AppLayout;
