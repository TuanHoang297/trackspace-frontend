import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Skeleton,
    Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import adminService from '../../api/services/adminService';
import classService from '../../api/services/classService';
import type { UserResponse, ClassResponse } from '../../api/types/types';

const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
}> = ({ title, value, icon, gradient }) => (
    <Card
        sx={{
            background: gradient,
            color: '#fff',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            },
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5, fontWeight: 500 }}>
                        {title}
                    </Typography>
                    <Typography variant="h3" fontWeight={700}>
                        {value}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, classesRes] = await Promise.all([
                    adminService.getUsers(),
                    classService.getClasses(),
                ]);
                setUsers(usersRes.data.data);
                setClasses(classesRes.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeUsers = users.filter((u) => u.active).length;
    const lecturers = users.filter((u) => u.role === 'LECTURER').length;

    if (loading) {
        return (
            <Box>
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
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
                    Tổng quan hệ thống TrackSpace
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Tổng tài khoản"
                        value={users.length}
                        icon={<PeopleIcon sx={{ fontSize: 28 }} />}
                        color="#1976d2"
                        gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Đang hoạt động"
                        value={activeUsers}
                        icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
                        color="#2e7d32"
                        gradient="linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Giảng viên"
                        value={lecturers}
                        icon={<PersonAddIcon sx={{ fontSize: 28 }} />}
                        color="#ed6c02"
                        gradient="linear-gradient(135deg, #ed6c02 0%, #ffa726 100%)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Lớp học"
                        value={classes.length}
                        icon={<SchoolIcon sx={{ fontSize: 28 }} />}
                        color="#9c27b0"
                        gradient="linear-gradient(135deg, #7b1fa2 0%, #ce93d8 100%)"
                    />
                </Grid>
            </Grid>

            {/* Quick Actions + Recent Users */}
            <Grid container spacing={3}>
                {/* Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Thao tác nhanh
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    fullWidth
                                    onClick={() => navigate('/admin/users')}
                                    sx={{ borderRadius: 2, py: 1.2, textTransform: 'none' }}
                                >
                                    Thêm tài khoản mới
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    fullWidth
                                    onClick={() => navigate('/admin/classes')}
                                    sx={{ borderRadius: 2, py: 1.2, textTransform: 'none' }}
                                >
                                    Tạo lớp học mới
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Users Table */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Tài khoản gần đây
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => navigate('/admin/users')}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Xem tất cả →
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Họ tên</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.slice(0, 5).map((user) => (
                                            <TableRow key={user.userId} hover>
                                                <TableCell>{user.fullName}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={user.role}
                                                        size="small"
                                                        variant="outlined"
                                                        color={user.role === 'ADMIN' ? 'error' : user.role === 'LECTURER' ? 'primary' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={user.active ? 'Hoạt động' : 'Đã khóa'}
                                                        size="small"
                                                        color={user.active ? 'success' : 'default'}
                                                        sx={{ fontWeight: 500 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {users.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    Chưa có tài khoản nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
