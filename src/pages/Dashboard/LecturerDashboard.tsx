import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Card, CardContent, CardActionArea,
    Typography, Chip, Skeleton, Alert, Avatar, LinearProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import classService from '../../api/services/classService';
import groupService from '../../api/services/groupService';
import type { ClassResponse, GroupResponse } from '../../api/types/types';

/* ─── Stat card config ─── */
const STAT_CONFIG = [
    {
        label: 'Lớp học',
        key: 'classes',
        icon: <SchoolIcon sx={{ fontSize: 26 }} />,
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        shadow: 'rgba(59,130,246,0.25)',
    },
    {
        label: 'Tổng sinh viên',
        key: 'students',
        icon: <PeopleIcon sx={{ fontSize: 26 }} />,
        gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        shadow: 'rgba(16, 185, 129, 0.25)',
    },
    {
        label: 'Nhóm dự án',
        key: 'groups',
        icon: <GroupsIcon sx={{ fontSize: 26 }} />,
        gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
        shadow: 'rgba(124, 58, 237, 0.25)',
    },
    {
        label: 'Lớp đang active',
        key: 'active',
        icon: <AssignmentTurnedInIcon sx={{ fontSize: 26 }} />,
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        shadow: 'rgba(245, 158, 11, 0.25)',
    },
];

const LecturerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [allGroups, setAllGroups] = useState<GroupResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await classService.getClasses();
                const classList = res.data.data;
                setClasses(classList);
                const groupResults = await Promise.all(
                    classList.map(c => groupService.getGroups(c.id).then(r => r.data.data).catch(() => []))
                );
                setAllGroups(groupResults.flat());
            } catch (err: any) {
                setError(err.response?.data?.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalStudents = classes.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
    const totalGroups = allGroups.length;
    const activeClasses = classes.filter(c => c.active).length;

    const statValues: Record<string, number> = {
        classes: classes.length,
        students: totalStudents,
        groups: totalGroups,
        active: activeClasses,
    };

    /* ─── Loading skeleton ─── */
    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={240} height={48} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width={320} height={24} sx={{ mb: 4 }} />
                <Grid container spacing={3} sx={{ mb: 5 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
                <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                    {[1, 2].map(i => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rounded" height={220} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            {/* ─── Header ─── */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                    Tổng quan hoạt động giảng dạy của bạn
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

            {/* ─── Stat Cards ─── */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                {STAT_CONFIG.map(s => (
                    <Grid item xs={12} sm={6} md={3} key={s.key}>
                        <Card sx={{
                            borderRadius: 2,
                            background: s.gradient,
                            color: '#fff',
                            border: 'none',
                            boxShadow: `0 8px 24px ${s.shadow}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: -30, right: -30,
                                width: 100, height: 100,
                                borderRadius: '50%',
                                bgcolor: 'rgba(255,255,255,0.1)',
                            },
                        }}>
                            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500, mb: 0.5 }}>
                                            {s.label}
                                        </Typography>
                                        <Typography variant="h3" fontWeight={800}>
                                            {statValues[s.key]}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        width: 52, height: 52,
                                        backdropFilter: 'blur(10px)',
                                    }}>
                                        {s.icon}
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ─── Class Cards ─── */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>
                    Lớp học của tôi
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {classes.length} lớp
                </Typography>
            </Box>

            {classes.length === 0 ? (
                <Card sx={{
                    p: 5, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                    bgcolor: 'transparent', boxShadow: 'none',
                }}>
                    <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">Bạn chưa được gán lớp học nào.</Typography>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                    {classes.map(cls => {
                        const classGroups = allGroups.filter(g => g.classId === cls.id);
                        const groupedStudents = classGroups.reduce((sum, g) => sum + g.totalMembers, 0);
                        const pct = cls.totalStudents > 0 ? Math.round((groupedStudents / cls.totalStudents) * 100) : 0;

                        return (
                            <Card key={cls.id} sx={{
                                borderRadius: 2, width: 280,
                                '&:hover': {
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease',
                            }}>
                                <CardActionArea
                                    onClick={() => navigate(`/lecturer/classes/${cls.id}`)}
                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                                >
                                    <Box sx={{
                                        height: 4,
                                        background: cls.active
                                            ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)'
                                            : '#E2E8F0',
                                    }} />

                                    <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Chip label={cls.subjectName ?? cls.classCode} size="small" sx={{
                                                bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                                                fontWeight: 600, fontSize: '0.7rem', height: 24,
                                            }} />
                                            <Chip label={cls.active ? 'Active' : 'Inactive'} size="small"
                                                sx={{
                                                    bgcolor: cls.active ? '#E8F5E9' : '#F5F5F5',
                                                    color: cls.active ? '#2E7D32' : '#9E9E9E',
                                                    fontWeight: 600, fontSize: '0.65rem', height: 22,
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                                            {cls.classCode}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
                                            {cls.semesterName ?? '—'}
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, mt: 'auto' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" fontWeight={600}>{cls.totalStudents}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <FolderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" fontWeight={600}>{classGroups.length}</Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Đã vào nhóm {pct}%
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700}
                                                color={pct === 100 ? 'success.main' : 'primary.main'}>
                                                {pct}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate" value={pct}
                                            sx={{
                                                height: 5, borderRadius: 1,
                                                bgcolor: 'rgba(0,0,0,0.06)',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 1,
                                                    bgcolor: pct === 100 ? 'success.main' : 'primary.main',
                                                },
                                            }}
                                        />
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default LecturerDashboard;
