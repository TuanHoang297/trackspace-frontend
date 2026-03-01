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
    { icon: <DashboardIcon sx={{ fontSize: 20 }} />, label: 'Tổng quan', path: '' },
    { icon: <ViewKanbanIcon sx={{ fontSize: 20 }} />, label: 'Jira Board', path: '/jira' },
    { icon: <GitHubIcon sx={{ fontSize: 20 }} />, label: 'GitHub', path: '/github' },
    { icon: <BarChartIcon sx={{ fontSize: 20 }} />, label: 'Contribution', path: '/contribution' },
    { icon: <DescriptionIcon sx={{ fontSize: 20 }} />, label: 'SRS Document', path: '/srs' },
    { icon: <SettingsIcon sx={{ fontSize: 20 }} />, label: 'Cài đặt', path: '/settings' },
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
        <Box sx={{
            width: SIDEBAR_WIDTH,
            minHeight: '100vh',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 2,
            gap: 0.5,
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1200,
        }}>
            {NAV_ITEMS.map((item) => {
                const isActive = getIsActive(item.path);
                return (
                    <Tooltip key={item.path} title={item.label} placement="right" arrow>
                        <IconButton
                            onClick={() => navigate(basePath + item.path)}
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '10px',
                                color: isActive ? '#3B82F6' : '#94A3B8',
                                bgcolor: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                                border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                                transition: 'all 0.18s ease',
                                position: 'relative',
                                '&:hover': {
                                    bgcolor: isActive ? 'rgba(59,130,246,0.12)' : '#F1F5F9',
                                    color: isActive ? '#3B82F6' : '#1E293B',
                                },
                                // Active left bar indicator
                                '&::before': isActive ? {
                                    content: '""',
                                    position: 'absolute',
                                    left: -10,
                                    top: '20%',
                                    bottom: '20%',
                                    width: 3,
                                    borderRadius: '0 3px 3px 0',
                                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                                } : {},
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
