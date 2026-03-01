import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Tooltip, IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import GitHubIcon from '@mui/icons-material/GitHub';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

const NAV_ITEMS = [
    { icon: <DashboardIcon />, label: 'Tổng quan', path: '' },
    { icon: <ViewKanbanIcon />, label: 'Jira Board', path: '/jira' },
    { icon: <GitHubIcon />, label: 'GitHub', path: '/github' },
    { icon: <BarChartIcon />, label: 'Contribution', path: '/contribution' },
    { icon: <DescriptionIcon />, label: 'SRS Document', path: '/srs' },
    { icon: <SettingsIcon />, label: 'Cài đặt', path: '/settings' },
];

const SIDEBAR_WIDTH = 64;

const ProjectSidebar: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const basePath = `/projects/${projectId}`;

    const getIsActive = (itemPath: string) => {
        const fullPath = basePath + itemPath;
        if (itemPath === '') {
            return location.pathname === basePath || location.pathname === basePath + '/';
        }
        return location.pathname.startsWith(fullPath);
    };

    return (
        <Box
            sx={{
                width: SIDEBAR_WIDTH,
                minHeight: '100vh',
                bgcolor: '#1B2A4A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2,
                gap: 0.5,
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 1200,
            }}
        >
            {NAV_ITEMS.map((item) => {
                const isActive = getIsActive(item.path);
                return (
                    <Tooltip key={item.path} title={item.label} placement="right" arrow>
                        <IconButton
                            onClick={() => navigate(basePath + item.path)}
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                bgcolor: isActive ? 'rgba(66,153,225,0.3)' : 'transparent',
                                border: isActive ? '1px solid rgba(66,153,225,0.5)' : '1px solid transparent',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: isActive ? 'rgba(66,153,225,0.4)' : 'rgba(255,255,255,0.08)',
                                    color: '#fff',
                                },
                            }}
                        >
                            {item.icon}
                        </IconButton>
                    </Tooltip>
                );
            })}
        </Box>
    );
};

export { SIDEBAR_WIDTH };
export default ProjectSidebar;
