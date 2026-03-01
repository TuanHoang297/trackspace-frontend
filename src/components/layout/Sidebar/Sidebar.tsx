import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/School';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import { getUser } from '../../../utils/auth';

const DRAWER_WIDTH = 264;
const DRAWER_COLLAPSED = 72;

/* ─── Colors ─── */
const SIDEBAR_BG = '#1A1F36';
const SIDEBAR_BG_LIGHT = '#252B48';
const ACTIVE_BG = 'rgba(79, 107, 246, 0.15)';
const ACTIVE_BORDER = '#4F6BF6';
const TEXT_PRIMARY = '#E2E8F0';
const TEXT_SECONDARY = 'rgba(148, 163, 184, 0.7)';

interface SidebarProps {
    open: boolean;
    onToggle: () => void;
}

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
}

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { label: 'Quản lý tài khoản', icon: <PeopleIcon />, path: '/admin/users' },
    { label: 'Quản lý lớp học', icon: <ClassIcon />, path: '/admin/classes' },
];

const lecturerNavItems: NavItem[] = [
    { label: 'Lớp học của tôi', icon: <ClassIcon />, path: '/lecturer/classes' },
];

const studentNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/student/dashboard' },
];

const getNavItems = (role?: string): NavItem[] => {
    switch (role) {
        case 'ADMIN': return adminNavItems;
        case 'LECTURER': return lecturerNavItems;
        case 'TEAMLEADER':
        case 'TEAMMEMBER':
        case 'STUDENT': return studentNavItems;
        default: return [];
    }
};

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const user = getUser();
    const navItems = getNavItems(user?.role);

    const drawerContent = (
        <Box sx={{
            display: 'flex', flexDirection: 'column', height: '100%',
            bgcolor: SIDEBAR_BG, color: TEXT_PRIMARY,
        }}>
            {/* Logo */}
            <Box sx={{
                display: 'flex', alignItems: 'center',
                justifyContent: open ? 'space-between' : 'center',
                px: 2, py: 2.5, minHeight: 68,
            }}>
                {open && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 38, height: 38, borderRadius: '12px',
                            background: 'linear-gradient(135deg, #4F6BF6 0%, #7B8FFF 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 900, fontSize: 18,
                            boxShadow: '0 4px 12px rgba(79, 107, 246, 0.4)',
                        }}>
                            T
                        </Box>
                        <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.02em' }} noWrap>
                            TrackSpace
                        </Typography>
                    </Box>
                )}
                <IconButton onClick={onToggle} size="small" sx={{ color: TEXT_SECONDARY, '&:hover': { color: '#fff', bgcolor: SIDEBAR_BG_LIGHT } }}>
                    {open ? <ChevronLeftIcon /> : <MenuIcon />}
                </IconButton>
            </Box>

            {/* Section label */}
            {open && (
                <Box sx={{ px: 2.5, pt: 1, pb: 1.5 }}>
                    <Typography variant="caption" sx={{
                        color: TEXT_SECONDARY, textTransform: 'uppercase',
                        letterSpacing: 1.5, fontSize: '0.6rem', fontWeight: 700,
                    }}>
                        {user?.role === 'ADMIN' ? 'Quản lý hệ thống'
                            : user?.role === 'LECTURER' ? 'Quản lý giảng dạy'
                                : 'Sinh viên'}
                    </Typography>
                </Box>
            )}

            {/* Nav items */}
            <List sx={{ flex: 1, px: 1.5, pt: 0 }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/lecturer/dashboard' && item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) onToggle();
                                }}
                                sx={{
                                    borderRadius: '12px',
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2,
                                    bgcolor: isActive ? ACTIVE_BG : 'transparent',
                                    borderLeft: isActive ? `3px solid ${ACTIVE_BORDER}` : '3px solid transparent',
                                    color: isActive ? '#fff' : TEXT_SECONDARY,
                                    '&:hover': {
                                        bgcolor: isActive ? ACTIVE_BG : SIDEBAR_BG_LIGHT,
                                        color: '#fff',
                                    },
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                <ListItemIcon sx={{
                                    minWidth: 0, mr: open ? 2 : 'auto',
                                    justifyContent: 'center',
                                    color: isActive ? ACTIVE_BORDER : TEXT_SECONDARY,
                                    transition: 'color 0.2s ease',
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: '0.875rem',
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Bottom */}
            {open && (
                <Box sx={{ p: 2.5, borderTop: `1px solid ${SIDEBAR_BG_LIGHT}` }}>
                    <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: '0.65rem' }}>
                        TrackSpace v1.0.0
                    </Typography>
                </Box>
            )}
        </Box>
    );

    const drawerPaperSx = {
        bgcolor: SIDEBAR_BG,
        border: 'none',
        overflowX: 'hidden' as const,
    };

    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                open={open}
                onClose={onToggle}
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, ...drawerPaperSx } }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
                flexShrink: 0,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    ...drawerPaperSx,
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export { DRAWER_WIDTH, DRAWER_COLLAPSED };
export default Sidebar;
