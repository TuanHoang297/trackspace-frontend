import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, IconButton, Skeleton,
    Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ProjectSidebar, { SIDEBAR_WIDTH } from './ProjectSidebar';
import projectService from '../../../api/services/projectService';
import type { ProjectResponse } from '../../../types/project.types';
import { getUser, logout } from '../../../utils/auth';

const ProjectLayout: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const currentUser = getUser();

    const initials = currentUser?.fullName
        ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const res = await projectService.getProjectById(pid);
                setProject(res.data.data);
            } catch {
                setProject(null);
            } finally {
                setLoading(false);
            }
        };
        if (pid) fetchProject();
    }, [pid]);

    // Breadcrumb "Lớp học" link should be role-aware
    const classListPath = currentUser?.role === 'LECTURER' ? '/lecturer/classes' : '/student/dashboard';

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F8FAFC', overflow: 'hidden' }}>
            <ProjectSidebar />

            <Box sx={{ flex: 1, ml: `${SIDEBAR_WIDTH}px`, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* Top Header Bar */}
                <Box sx={{
                    px: 3, py: 1.5,
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
                                {project?.projectName || 'Project'}
                            </Typography>
                        </Box>
                    )}



                    {/* User Avatar */}
                    <Tooltip title={currentUser?.fullName || ''}>
                        <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', fontSize: 13, fontWeight: 700 }}>
                                {initials}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { width: 200, mt: 1, borderRadius: 2 } } }}
                    >
                        <MenuItem disabled>
                            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ variant: 'caption' }}>
                                {currentUser?.email}
                            </ListItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
                            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                            <ListItemText sx={{ color: 'error.main' }}>Đăng xuất</ListItemText>
                        </MenuItem>
                    </Menu>
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
