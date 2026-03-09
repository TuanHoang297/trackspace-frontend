import React, { useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, IconButton, Skeleton,
    Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ProjectSidebar, { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './ProjectSidebar';
import projectService from '../../../api/services/projectService';
import type { ProjectResponse } from '../../../types/project.types';
import { getUser, logout } from '../../../utils/auth';
import ChangePasswordDialog from '../../common/ChangePasswordDialog';

const ProjectLayout: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [pwOpen, setPwOpen] = useState(false);
    const currentUser = getUser();
    const drawerWidth = sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

    const initials = currentUser?.fullName
        ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    const { data: project = null, isLoading: loading } = useQuery({
        queryKey: ['project', pid],
        queryFn: async () => {
            try { const r = await projectService.getProjectById(pid); return r.data.data as ProjectResponse; }
            catch { return null; }
        },
        enabled: !!pid,
    });

    // Breadcrumb "Lớp học" link should be role-aware
    const classListPath = currentUser?.role === 'LECTURER' ? '/lecturer/classes' : '/student/dashboard';

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F8FAFC', overflow: 'hidden' }}>
            <ProjectSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <Box sx={{ flex: 1, ml: `${drawerWidth}px`, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
                {/* Top Header Bar */}
                <Box sx={{
                    px: 3, py: 0,
                    minHeight: 64,
                    bgcolor: 'rgba(248,250,252,0.85)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                }}>
                    <IconButton size="small" onClick={() => navigate(classListPath)} sx={{ mr: 0.5 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>

                    {loading ? (
                        <Skeleton width={250} height={28} />
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            <Typography variant="h6" fontWeight={700} noWrap>
                                {project?.groupName || 'Workspace'}
                            </Typography>
                        </Box>
                    )}



                    {/* User section */}
                    <Box
                        onClick={e => setAnchorEl(e.currentTarget)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            cursor: 'pointer', py: 0.5, px: 1.5, borderRadius: 3,
                            '&:hover': { bgcolor: '#F1F5F9' },
                            transition: 'background 0.2s ease',
                        }}
                    >
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                {currentUser?.fullName || 'User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {currentUser?.role || ''}
                            </Typography>
                        </Box>
                        <Avatar sx={{ width: 38, height: 38, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', fontSize: 14, fontWeight: 800, boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                            {initials}
                        </Avatar>
                    </Box>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { width: 220, mt: 1, borderRadius: 3, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' } } }}
                    >
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="body2" fontWeight={700}>{currentUser?.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{currentUser?.email}</Typography>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Hồ sơ</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { setAnchorEl(null); setPwOpen(true); }} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                            <ListItemIcon><LockIcon fontSize="small" sx={{ color: '#8B5CF6' }} /></ListItemIcon>
                            <ListItemText>Đổi mật khẩu</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ borderRadius: 2, mx: 1 }}>
                            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                            <ListItemText sx={{ color: 'error.main' }}>Đăng xuất</ListItemText>
                        </MenuItem>
                    </Menu>
                    <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
                </Box>

                {/* Page Content */}
                <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default ProjectLayout;
