import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Grid, Card, CardContent, CardActionArea,
    Typography, Chip, Skeleton, Alert, LinearProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import classService from '../../api/services/classService';
import groupService from '../../api/services/groupService';
import type { ClassResponse, GroupResponse } from '../../api/types/types';

const LecturerClasses: React.FC = () => {
    const navigate = useNavigate();

    const { data: classes = [], isLoading: classesLoading, error: classesError } = useQuery({
        queryKey: ['lecturer', 'classes'],
        queryFn: async () => {
            const res = await classService.getClasses();
            return res.data.data as ClassResponse[];
        },
    });

    const { data: allGroups = [], isLoading: groupsLoading } = useQuery({
        queryKey: ['lecturer', 'allGroups'],
        queryFn: async () => {
            const classRes = await classService.getClasses();
            const classList = classRes.data.data as ClassResponse[];
            const groupResults = await Promise.all(
                classList.map(c => groupService.getGroups(c.id).then(r => r.data.data).catch(() => []))
            );
            return groupResults.flat() as GroupResponse[];
        },
    });

    const loading = classesLoading || groupsLoading;
    const error = classesError ? ((classesError as any)?.response?.data?.message || 'Không thể tải dữ liệu') : '';

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={240} height={48} sx={{ mb: 1 }} />
                <Grid container spacing={2.5} sx={{ mt: 2 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rounded" height={220} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                    Lớp học của tôi
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                    {classes.length} môn đang phụ trách
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

            {classes.length === 0 ? (
                <Card sx={{
                    p: 5, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                    bgcolor: 'transparent', boxShadow: 'none',
                }}>
                    <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">Bạn chưa được gán môn học nào.</Typography>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                    {classes.map(cls => {
                        const classGroups = allGroups.filter(g => g.classId === cls.id);
                        const groupedStudents = classGroups.reduce((sum, g) => sum + g.totalMembers, 0);
                        const pct = cls.totalStudents > 0 ? Math.round((groupedStudents / cls.totalStudents) * 100) : 0;

                        return (
                            <Card key={cls.id} sx={{
                                borderRadius: 2, width: 260,
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

export default LecturerClasses;
