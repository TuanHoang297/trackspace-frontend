import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Chip,
    Skeleton,
    Alert,
    Avatar,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import classService from '../../api/services/classService';
import type { ClassResponse } from '../../api/types/types';

const LecturerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await classService.getClasses();
                setClasses(res.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalStudents = classes.reduce((sum, c) => sum + (c.totalStudents || 0), 0);

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={300} height={50} />
                <Skeleton variant="text" width={200} height={30} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Xin chào! Bạn đang giảng dạy {classes.length} lớp học.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: '#fff' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                                <SchoolIcon sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>Lớp học</Typography>
                                <Typography variant="h3" fontWeight={700}>{classes.length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)', color: '#fff' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                                <PeopleIcon sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>Tổng sinh viên</Typography>
                                <Typography variant="h3" fontWeight={700}>{totalStudents}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #ed6c02 0%, #ffa726 100%)', color: '#fff' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52 }}>
                                <GroupsIcon sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>Lớp đang active</Typography>
                                <Typography variant="h3" fontWeight={700}>{classes.filter(c => c.active).length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* My Classes */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Lớp học của tôi
            </Typography>

            {classes.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography color="text.secondary">Bạn chưa được gán lớp học nào.</Typography>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {classes.map((cls) => (
                        <Grid item xs={12} sm={6} md={4} key={cls.id}>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                    },
                                }}
                            >
                                <CardActionArea onClick={() => navigate(`/lecturer/classes/${cls.id}`)}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Chip label={cls.classCode} size="small" color="primary" variant="outlined" />
                                            <Chip
                                                label={cls.active ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={cls.active ? 'success' : 'default'}
                                            />
                                        </Box>
                                        <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                                            {cls.className}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Học kỳ: {cls.semester}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                            <PeopleIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                {cls.totalStudents} sinh viên
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default LecturerDashboard;
