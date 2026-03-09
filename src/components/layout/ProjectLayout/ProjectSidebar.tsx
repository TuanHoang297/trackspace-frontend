import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
    Box, Tooltip, IconButton, Typography,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import GitHubIcon from '@mui/icons-material/GitHub';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';

const NAV_ITEMS = [
    { icon: <DashboardIcon sx={{ fontSize: 19 }} />, label: 'Tổng quan', path: '' },
    { icon: <ViewKanbanIcon sx={{ fontSize: 19 }} />, label: 'Jira Board', path: '/jira' },
    { icon: <GitHubIcon sx={{ fontSize: 19 }} />, label: 'GitHub', path: '/github' },
    { icon: <BarChartIcon sx={{ fontSize: 19 }} />, label: 'Contribution', path: '/contribution' },
    { icon: <DescriptionIcon sx={{ fontSize: 19 }} />, label: 'SRS Document', path: '/srs' },
    { icon: <SettingsIcon sx={{ fontSize: 19 }} />, label: 'Cài đặt', path: '/settings' },
];

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 64;

const ACCENT = '#3B82F6';
const GRAD = 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)';
const BORDER = '#E2E8F0';
const DIM = '#94A3B8';
const TEXT = '#1E293B';
const HOVER = '#F1F5F9';

interface Props {
    open: boolean;
    onToggle: () => void;
}

const ProjectSidebar: React.FC<Props> = ({ open, onToggle }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const basePath = `/projects/${projectId}`;
    const width = open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

    const getIsActive = (itemPath: string) => {
        const fullPath = basePath + itemPath;
        if (itemPath === '') {
            return location.pathname === basePath || location.pathname === basePath + '/';
        }
        return location.pathname.startsWith(fullPath);
    };

    return (
        <Box sx={{
            width,
            minHeight: '100vh',
            bgcolor: '#FFFFFF',
            borderRight: `1px solid ${BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1200,
            transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
            overflowX: 'hidden',
        }}>
            {/* Header with logo + toggle */}
            <Box sx={{
                display: 'flex', alignItems: 'center', minHeight: 64,
                borderBottom: `1px solid ${BORDER}`,
                px: 2, gap: 1.5,
                justifyContent: open ? 'space-between' : 'center',
            }}>
                {open && (
                    <Box
                        component={Link} to="/"
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            textDecoration: 'none', flex: 1, overflow: 'hidden',
                            '&:hover': { opacity: 0.75 },
                        }}
                    >
                        <AutoAwesomeIcon sx={{ fontSize: 18, color: ACCENT, flexShrink: 0 }} />
                        <Typography fontWeight={800} fontSize="0.95rem" noWrap sx={{
                            background: GRAD,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            TrackSpace
                        </Typography>
                    </Box>
                )}
                <IconButton onClick={onToggle} size="small" sx={{
                    color: DIM, borderRadius: '8px', p: 0.75, flexShrink: 0,
                    '&:hover': { color: TEXT, bgcolor: HOVER },
                }}>
                    {open ? <ChevronLeftIcon sx={{ fontSize: 18 }} /> : <MenuIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Box>

            {/* Section label */}
            {open && (
                <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
                    <Typography sx={{
                        color: DIM, textTransform: 'uppercase',
                        letterSpacing: '0.08em', fontSize: '0.6rem', fontWeight: 700,
                    }}>
                        Không gian dự án
                    </Typography>
                </Box>
            )}

            {/* Navigation */}
            <List sx={{ flex: 1, px: 1, pt: 1, pb: 1 }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = getIsActive(item.path);

                    const btn = (
                        <ListItemButton
                            onClick={() => navigate(basePath + item.path)}
                            sx={{
                                borderRadius: '10px', minHeight: 44,
                                justifyContent: open ? 'flex-start' : 'center',
                                px: open ? 1.5 : 0, py: 0.75,
                                background: isActive
                                    ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)'
                                    : 'transparent',
                                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                                color: isActive ? '#FFFFFF' : DIM,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    background: isActive
                                        ? 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)'
                                        : HOVER,
                                    color: isActive ? '#FFFFFF' : TEXT,
                                    boxShadow: isActive ? '0 6px 16px rgba(99,102,241,0.45)' : 'none',
                                },
                            }}
                        >
                            <ListItemIcon sx={{
                                minWidth: 0, mr: open ? 1.5 : 0,
                                justifyContent: 'center',
                                color: 'inherit',
                                transition: 'color 0.15s ease',
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            {open && (
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 700 : 400,
                                        fontSize: '0.84rem',
                                        color: 'inherit',
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );

                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                            {!open
                                ? <Tooltip title={item.label} placement="right" arrow>{btn}</Tooltip>
                                : btn
                            }
                        </ListItem>
                    );
                })}
            </List>

            {/* Footer */}
            {open && (
                <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${BORDER}` }}>
                    <Typography sx={{ color: DIM, fontSize: '0.62rem' }}>
                        TrackSpace v1.0.0
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED };
export default ProjectSidebar;
