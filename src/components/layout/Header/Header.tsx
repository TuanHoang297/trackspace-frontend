import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { getUser, logout } from '../../../utils/auth';
import ChangePasswordDialog from '../../common/ChangePasswordDialog';

interface HeaderProps {
    onMenuClick: () => void;
    drawerWidth: number;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, drawerWidth }) => {
    const user = getUser();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [pwOpen, setPwOpen] = React.useState(false);

    const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLogout = () => { handleClose(); logout(); };
    const handleChangePw = () => { handleClose(); setPwOpen(true); };

    const initials = user?.fullName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <AppBar
            position="fixed"
            color="inherit"
            elevation={0}
            sx={{
                width: { md: `calc(100% - ${drawerWidth}px)` },
                ml: { md: `${drawerWidth}px` },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                borderBottom: '1px solid #E2E8F0',
                bgcolor: 'rgba(248,250,252,0.85)',
                backdropFilter: 'blur(16px)',
            }}
        >
            <Toolbar sx={{ minHeight: '64px !important' }}>
                <IconButton
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { md: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{ flexGrow: 1 }} />

                {/* User section */}
                <Box
                    onClick={handleMenu}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        cursor: 'pointer', py: 0.5, px: 1.5, borderRadius: 3,
                        '&:hover': { bgcolor: '#F1F5F9' },
                        transition: 'background 0.2s ease',
                    }}
                >
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                            {user?.fullName || 'Admin'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {user?.role || 'ADMIN'}
                        </Typography>
                    </Box>
                    <Avatar
                        sx={{
                            width: 38, height: 38,
                            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                            fontSize: 14, fontWeight: 800,
                            boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                        }}
                    >
                        {initials}
                    </Avatar>
                </Box>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                        paper: {
                            sx: {
                                width: 220, mt: 1, borderRadius: 3,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(0,0,0,0.05)',
                            },
                        },
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="body2" fontWeight={700}>{user?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleClose} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Hồ sơ</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={handleChangePw} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                        <ListItemIcon><LockIcon fontSize="small" sx={{ color: '#8B5CF6' }} /></ListItemIcon>
                        <ListItemText>Đổi mật khẩu</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, mx: 1 }}>
                        <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText sx={{ color: 'error.main' }}>Đăng xuất</ListItemText>
                    </MenuItem>
                </Menu>

                <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
            </Toolbar>
        </AppBar>
    );
};

export default Header;

