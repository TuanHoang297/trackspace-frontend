import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Card, CardContent, Typography, Button, Chip,
    Avatar, Skeleton, Alert, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useAdminDashboard } from './hooks/useAdminDashboard';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN: { label: 'Admin', color: '#DC2626', bg: '#FEE2E2' },
    LECTURER: { label: 'Giảng viên', color: '#7C3AED', bg: '#EDE9FE' },
    TEAMLEADER: { label: 'Trưởng nhóm', color: '#D97706', bg: '#FEF3C7' },
    TEAMMEMBER: { label: 'Thành viên', color: '#2563EB', bg: '#DBEAFE' },
};

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];
const getColor = (name: string) => AVATAR_COLORS[Math.abs([...name].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) % AVATAR_COLORS.length];
const getInitials = (name: string) => { const p = name.trim().split(/\s+/); return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase(); };

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { loading, error, stats, recentUsers, recentClasses } = useAdminDashboard();

    if (loading) return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: 4, mb: 3 }} />
            <Grid container spacing={2.5}>{[1, 2, 3, 4].map(i => <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* ── Hero Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3, color: '#fff',
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ position: 'absolute', bottom: -30, left: '40%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <DashboardIcon sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Dashboard</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ opacity: 0.85, mb: 3 }}>Tổng quan hệ thống TrackSpace — Quản lý tài khoản, lớp học và hoạt động</Typography>

                    {/* Stats Row */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Tổng TK', value: stats.totalUsers, icon: <PeopleAltIcon /> },
                            { label: 'Hoạt động', value: stats.activeUsers, icon: <CheckCircleIcon /> },
                            { label: 'Lớp học', value: stats.totalClasses, icon: <SchoolIcon /> },
                            { label: 'Sinh viên', value: stats.totalStudents, icon: <GroupsIcon /> },
                        ].map(s => (
                            <Box key={s.label} sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 2.5, px: 2.5, py: 1.5, minWidth: 130, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    {React.cloneElement(s.icon, { sx: { fontSize: 18, opacity: 0.8 } })}
                                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>{s.label}</Typography>
                                </Box>
                                <Typography variant="h5" fontWeight={800}>{s.value}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* ── Cards Row: Role Distribution + Quick Actions ── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {/* Role Distribution */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, color: '#1E293B' }}>Phân bố vai trò</Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Admin', count: stats.roles.admins, color: '#DC2626', bg: '#FEE2E2', icon: <AdminPanelSettingsIcon /> },
                                    { label: 'Giảng viên', count: stats.roles.lecturers, color: '#7C3AED', bg: '#EDE9FE', icon: <SchoolIcon /> },
                                    { label: 'Trưởng nhóm', count: stats.roles.leaders, color: '#D97706', bg: '#FEF3C7', icon: <TrendingUpIcon /> },
                                    { label: 'Thành viên', count: stats.roles.members, color: '#2563EB', bg: '#DBEAFE', icon: <GroupsIcon /> },
                                ].map(r => (
                                    <Box key={r.label} sx={{ flex: '1 1 120px', bgcolor: r.bg, borderRadius: 3, p: 2, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                                        {React.cloneElement(r.icon, { sx: { fontSize: 28, color: r.color, mb: 0.5 } })}
                                        <Typography variant="h5" fontWeight={800} sx={{ color: r.color }}>{r.count}</Typography>
                                        <Typography variant="caption" sx={{ color: r.color, fontWeight: 600, opacity: 0.8 }}>{r.label}</Typography>
                                        {stats.totalUsers > 0 && (
                                            <LinearProgress variant="determinate" value={(r.count / stats.totalUsers) * 100}
                                                sx={{ mt: 1, borderRadius: 4, height: 4, bgcolor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { bgcolor: r.color, borderRadius: 4 } }} />
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, color: '#1E293B' }}>Thao tác nhanh</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Button variant="contained" startIcon={<PersonAddIcon />} fullWidth onClick={() => navigate('/admin/users')}
                                    sx={{ borderRadius: 2.5, py: 1.3, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', '&:hover': { background: 'linear-gradient(135deg, #2563EB, #7C3AED)' } }}>
                                    Quản lý tài khoản
                                </Button>
                                <Button variant="outlined" startIcon={<AddIcon />} fullWidth onClick={() => navigate('/admin/classes')}
                                    sx={{ borderRadius: 2.5, py: 1.3, textTransform: 'none', fontWeight: 600, borderColor: '#8B5CF6', color: '#7C3AED', '&:hover': { borderColor: '#7C3AED', bgcolor: '#EDE9FE' } }}>
                                    Quản lý lớp học
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Recent Data Row ── */}
            <Grid container spacing={2.5}>
                {/* Recent Users */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PeopleAltIcon sx={{ color: '#3B82F6', fontSize: 22 }} />
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1E293B' }}>Tài khoản gần đây</Typography>
                                </Box>
                                <Tooltip title="Xem tất cả"><IconButton size="small" onClick={() => navigate('/admin/users')} sx={{ color: '#3B82F6' }}><ArrowForwardIcon fontSize="small" /></IconButton></Tooltip>
                            </Box>
                            {recentUsers.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}><PeopleAltIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><Typography variant="body2">Chưa có tài khoản nào</Typography></Box>
                            ) : recentUsers.map((u, i) => (
                                <Box key={u.userId} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, px: 1, borderRadius: 2, '&:hover': { bgcolor: '#F8FAFC' }, ...(i < recentUsers.length - 1 ? { borderBottom: '1px solid', borderColor: 'divider' } : {}) }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: getColor(u.fullName), fontSize: '0.8rem', fontWeight: 700 }}>{getInitials(u.fullName)}</Avatar>
                                        <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: u.active ? '#22C55E' : '#CBD5E1', border: '2px solid #fff' }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#1E293B' }}>{u.fullName}</Typography>
                                        <Typography variant="caption" noWrap sx={{ color: '#94A3B8' }}>{u.email}</Typography>
                                    </Box>
                                    <Chip label={ROLE_LABELS[u.role]?.label || u.role} size="small"
                                        sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: ROLE_LABELS[u.role]?.bg, color: ROLE_LABELS[u.role]?.color, borderRadius: 1.5, height: 22 }} />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Classes */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon sx={{ color: '#8B5CF6', fontSize: 22 }} />
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1E293B' }}>Lớp học gần đây</Typography>
                                </Box>
                                <Tooltip title="Xem tất cả"><IconButton size="small" onClick={() => navigate('/admin/classes')} sx={{ color: '#8B5CF6' }}><ArrowForwardIcon fontSize="small" /></IconButton></Tooltip>
                            </Box>
                            {recentClasses.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}><SchoolIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><Typography variant="body2">Chưa có lớp nào</Typography></Box>
                            ) : recentClasses.map((c, i) => (
                                <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, px: 1, borderRadius: 2, '&:hover': { bgcolor: '#F8FAFC' }, ...(i < recentClasses.length - 1 ? { borderBottom: '1px solid', borderColor: 'divider' } : {}) }}>
                                    <Avatar sx={{ width: 36, height: 36, bgcolor: getColor(c.className), fontSize: '0.8rem', fontWeight: 700, borderRadius: 2 }}>{c.className.substring(0, 2).toUpperCase()}</Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#1E293B' }}>{c.className}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>{c.classCode}</Typography>
                                            <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
                                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>{c.semester}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label={`${c.totalStudents} SV`} size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: '#DBEAFE', color: '#2563EB', borderRadius: 1.5, height: 22 }} />
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.active ? '#22C55E' : '#CBD5E1' }} />
                                    </Box>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
