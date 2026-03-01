import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Card, CardContent, CardActionArea,
    Typography, Chip, Skeleton, Alert, Avatar, Divider, LinearProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import classService from '../../api/services/classService';
import groupService from '../../api/services/groupService';
import type { ClassResponse, GroupResponse } from '../../api/types/types';

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

                // Fetch groups for all classes in parallel
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
    const avgStudentsPerClass = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

    const stats = [
        {
            label: 'Lớp học', value: classes.length, icon: <SchoolIcon sx={{ fontSize: 28 }} />,
            bg: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        },
        {
            label: 'Tổng sinh viên', value: totalStudents, icon: <PeopleIcon sx={{ fontSize: 28 }} />,
            bg: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
        },
        {
            label: 'Nhóm dự án', value: totalGroups, icon: <GroupsIcon sx={{ fontSize: 28 }} />,
            bg: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
        },
        {
            label: 'Lớp đang active', value: activeClasses, icon: <AssignmentTurnedInIcon sx={{ fontSize: 28 }} />,
            bg: 'linear-gradient(135deg, #ed6c02 0%, #ffa726 100%)',
        },
    ];

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={300} height={50} />
                <Skeleton variant="text" width={200} height={30} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Tổng quan hoạt động giảng dạy của bạn
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((s) => (
                    <Grid item xs={12} sm={6} md={3} key={s.label}>
                        <Card sx={{ borderRadius: 3, background: s.bg, color: '#fff' }}>
                            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                                    {s.icon}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>{s.label}</Typography>
                                    <Typography variant="h3" fontWeight={700}>{s.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Class Overview Rows */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Tổng quan lớp học
            </Typography>
            {classes.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography color="text.secondary">Bạn chưa được gán lớp học nào.</Typography>
                </Card>
            ) : (
                <Card sx={{ borderRadius: 3 }}>
                    {classes.map((cls, idx) => {
                        const classGroups = allGroups.filter(g => g.classId === cls.id);
                        const groupedStudents = classGroups.reduce((sum, g) => sum + g.totalMembers, 0);
                        const ungrouped = cls.totalStudents - groupedStudents;
                        const pct = cls.totalStudents > 0 ? Math.round((groupedStudents / cls.totalStudents) * 100) : 0;
                        return (
                            <Box key={cls.id}>
                                {idx > 0 && <Divider />}
                                <CardActionArea onClick={() => navigate(`/lecturer/classes/${cls.id}`)} sx={{ px: 3, py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {/* Class info */}
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Chip label={cls.classCode} size="small" color="primary" variant="outlined" />
                                                <Typography fontWeight={600}>{cls.className}</Typography>
                                                <Chip
                                                    label={cls.active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={cls.active ? 'success' : 'default'}
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Học kỳ: {cls.semester}
                                            </Typography>
                                        </Box>

                                        {/* Stats */}
                                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mr: 2 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" fontWeight={700} color="primary">{cls.totalStudents}</Typography>
                                                <Typography variant="caption" color="text.secondary">Sinh viên</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" fontWeight={700} color="secondary.main">{classGroups.length}</Typography>
                                                <Typography variant="caption" color="text.secondary">Nhóm</Typography>
                                            </Box>
                                            <Box sx={{ minWidth: 120 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" color="text.secondary">Đã vào nhóm</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{pct}%</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={pct}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                    color={pct === 100 ? 'success' : pct > 50 ? 'primary' : 'warning'}
                                                />
                                                {ungrouped > 0 && (
                                                    <Typography variant="caption" color="warning.main">
                                                        {ungrouped} SV chưa có nhóm
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        <ArrowForwardIcon color="action" fontSize="small" />
                                    </Box>
                                </CardActionArea>
                            </Box>
                        );
                    })}
                </Card>
            )}

            {/* Bottom summary */}
            {classes.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 3, display: 'flex', gap: 4 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Trung bình SV/lớp</Typography>
                        <Typography variant="h6" fontWeight={700}>{avgStudentsPerClass}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Tổng nhóm dự án</Typography>
                        <Typography variant="h6" fontWeight={700}>{totalGroups}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">SV đã vào nhóm</Typography>
                        <Typography variant="h6" fontWeight={700}>
                            {allGroups.reduce((s, g) => s + g.totalMembers, 0)} / {totalStudents}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default LecturerDashboard;
