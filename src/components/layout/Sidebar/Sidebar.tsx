import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon,
    ListItemText, IconButton, Box, Typography, Tooltip,
    useTheme, useMediaQuery,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/School';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getUser } from '../../../utils/auth';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED = 64;

/* ── Light mode tokens ── */
const BG = '#FFFFFF';
const BORDER = '#E2E8F0';
const ACCENT = '#3B82F6';
const GRAD = 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)';
const TEXT = '#1E293B';
const DIM = '#94A3B8';
const HOVER = '#F1F5F9';

interface SidebarProps { open: boolean; onToggle: () => void; }
interface NavItem { label: string; icon: React.ReactNode; path: string; }

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 19 }} />, path: '/admin/dashboard' },
    { label: 'Quản lý tài khoản', icon: <PeopleIcon sx={{ fontSize: 19 }} />, path: '/admin/users' },
    { label: 'Quản lý lớp học', icon: <ClassIcon sx={{ fontSize: 19 }} />, path: '/admin/classes' },
];
const lecturerNavItems: NavItem[] = [
    { label: 'Lớp học của tôi', icon: <ClassIcon sx={{ fontSize: 19 }} />, path: '/lecturer/classes' },
];
const studentNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 19 }} />, path: '/student/dashboard' },
];

const getNavItems = (role?: string): NavItem[] => {
    switch (role) {
        case 'ADMIN': return adminNavItems;
        case 'LECTURER': return lecturerNavItems;
        case 'TEAMLEADER': case 'TEAMMEMBER': case 'STUDENT': return studentNavItems;
        default: return [];
    }
};

const getSectionLabel = (role?: string) => {
    if (role === 'ADMIN') return 'Quản lý hệ thống';
    if (role === 'LECTURER') return 'Quản lý giảng dạy';
    return 'Sinh viên';
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
            bgcolor: BG, color: TEXT,
            borderRight: `1px solid ${BORDER}`,
        }}>
            {/* ── Header ── */}
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
                            display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none',
                            flex: 1, overflow: 'hidden', '&:hover': { opacity: 0.75 }
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

            {/* ── Section label ── */}
            {open && (
                <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
                    <Typography sx={{
                        color: DIM, textTransform: 'uppercase',
                        letterSpacing: '0.08em', fontSize: '0.6rem', fontWeight: 700,
                    }}>
                        {getSectionLabel(user?.role)}
                    </Typography>
                </Box>
            )}

            {/* ── Nav ── */}
            <List sx={{ flex: 1, px: 1, pt: 1, pb: 1 }}>
                {navItems.map((item) => {
                    const isActive =
                        location.pathname === item.path ||
                        (!['/', '/admin/dashboard', '/student/dashboard'].includes(item.path) &&
                            location.pathname.startsWith(item.path));

                    const btn = (
                        <ListItemButton
                            onClick={() => { navigate(item.path); if (isMobile) onToggle(); }}
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

            {/* ── Footer ── */}
            {open && (
                <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${BORDER}` }}>
                    <Typography sx={{ color: DIM, fontSize: '0.62rem' }}>
                        TrackSpace v1.0.0
                    </Typography>
                </Box>
            )}
        </Box>
    );

    const paperSx = { bgcolor: BG, border: 'none', overflowX: 'hidden' as const };

    if (isMobile) {
        return (
            <Drawer variant="temporary" open={open} onClose={onToggle}
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, ...paperSx } }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    return (
        <Drawer variant="permanent" sx={{
            width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
            flexShrink: 0,
            transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
            '& .MuiDrawer-paper': {
                width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
                transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
                ...paperSx,
            },
        }}>
            {drawerContent}
        </Drawer>
    );
};

export { DRAWER_WIDTH, DRAWER_COLLAPSED };
export default Sidebar;
