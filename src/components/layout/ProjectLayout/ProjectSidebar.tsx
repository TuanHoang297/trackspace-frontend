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
                                borderRadius: '12px',
                                color: isActive ? '#FFFFFF' : '#94A3B8',
                                background: isActive
                                    ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)'
                                    : 'transparent',
                                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                                border: 'none',
                                transition: 'all 0.18s ease',
                                '&:hover': {
                                    background: isActive
                                        ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)'
                                        : '#F1F5F9',
                                    color: isActive ? '#FFFFFF' : '#1E293B',
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
