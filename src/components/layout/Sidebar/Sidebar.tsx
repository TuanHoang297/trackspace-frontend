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
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/School';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import { getUser } from '../../../utils/auth';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

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
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/lecturer/dashboard' },
    { label: 'Lớp học của tôi', icon: <ClassIcon />, path: '/lecturer/classes' },
];

const getNavItems = (role?: string): NavItem[] => {
    switch (role) {
        case 'ADMIN':
            return adminNavItems;
        case 'LECTURER':
            return lecturerNavItems;
        default:
            return [];
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'space-between' : 'center',
                    px: 2,
                    py: 2,
                    minHeight: 64,
                }}
            >
                {open && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: 18,
                            }}
                        >
                            T
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="primary.main" noWrap>
                            TrackSpace
                        </Typography>
                    </Box>
                )}
                <IconButton onClick={onToggle} size="small">
                    {open ? <ChevronLeftIcon /> : <MenuIcon />}
                </IconButton>
            </Box>

            <Divider />

            {/* Role badge */}
            {open && (
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.disabled',
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                        }}
                    >
                        {user?.role === 'ADMIN' ? 'Admin Panel' : 'Lecturer Panel'}
                    </Typography>
                </Box>
            )}

            {/* Nav items */}
            <List sx={{ flex: 1, px: 1, pt: 0.5 }}>
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
                                    borderRadius: 2,
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2,
                                    bgcolor: isActive ? 'primary.main' : 'transparent',
                                    color: isActive ? '#fff' : 'text.primary',
                                    '&:hover': {
                                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: isActive ? '#fff' : 'primary.main',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {open && <ListItemText primary={item.label} />}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Bottom version */}
            {open && (
                <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.disabled">
                        TrackSpace v1.0.0
                    </Typography>
                </Box>
            )}
        </Box>
    );

    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                open={open}
                onClose={onToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
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
                transition: 'width 0.2s ease',
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                    transition: 'width 0.2s ease',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export { DRAWER_WIDTH, DRAWER_COLLAPSED };
export default Sidebar;
