import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Card, CardContent, CardActionArea,
    Chip, Skeleton, Alert,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupsIcon from '@mui/icons-material/Groups';
import studentService, { type WorkspaceResponse } from '../../api/services/studentService';
import { getUser } from '../../utils/auth';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = getUser();

    const { data: workspaces = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ['student', 'workspaces'],
        queryFn: async () => {
            const res = await studentService.getMyWorkspaces();
            const data = res.data.data as WorkspaceResponse[];
            // Auto-redirect if only 1 workspace with a project
            if (data.length === 1 && data[0].projectId) {
                navigate(`/projects/${data[0].projectId}`, { replace: true });
            }
            return data;
        },
    });

    const error = queryError ? ((queryError as any)?.response?.data?.message || 'Không thể tải dữ liệu') : '';

    if (loading) {
        return (
            <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
                <Skeleton height={60} sx={{ mb: 2 }} />
                {[1, 2].map(i => <Skeleton key={i} height={120} sx={{ mb: 2, borderRadius: 3 }} />)}
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    Xin chào, {user?.fullName} 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Chọn workspace để bắt đầu làm việc
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {workspaces.length === 0 ? (
                <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
                    <CardContent>
                        <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Bạn chưa được phân vào nhóm nào
                        </Typography>
                        <Typography color="text.secondary">
                            Liên hệ giảng viên để được thêm vào nhóm dự án
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {workspaces.map(ws => (
                        <Card
                            key={`${ws.classId}-${ws.groupId}`}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: '0 4px 20px rgba(25,118,210,0.12)',
                                    transform: 'translateY(-2px)',
                                },
                            }}
                        >
                            <CardActionArea
                                onClick={() => {
                                    if (ws.projectId) {
                                        navigate(`/projects/${ws.projectId}`);
                                    }
                                }}
                                disabled={!ws.projectId}
                                sx={{ p: 2.5 }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                    {/* Icon */}
                                    <Box sx={{
                                        width: 56, height: 56, borderRadius: 2,
                                        bgcolor: ws.projectId ? '#E3F2FD' : '#F5F5F5',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <FolderIcon sx={{
                                            fontSize: 28,
                                            color: ws.projectId ? '#1976d2' : '#9E9E9E',
                                        }} />
                                    </Box>

                                    {/* Info */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography variant="subtitle1" fontWeight={700} noWrap>
                                                {ws.projectName || ws.groupName}
                                            </Typography>
                                            {ws.isLeader && (
                                                <Chip
                                                    icon={<StarIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                                                    label="Team Leader"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#FF9800', color: '#fff',
                                                        fontWeight: 700, fontSize: '0.65rem', height: 22,
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <SchoolIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                <Typography variant="caption" color="text.secondary">{ws.className}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <GroupsIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                <Typography variant="caption" color="text.secondary">{ws.groupName}</Typography>
                                            </Box>
                                        </Box>
                                        {!ws.projectId && (
                                            <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
                                                ⚠️ Chưa có project — chờ giảng viên tạo
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Arrow */}
                                    {ws.projectId && (
                                        <ArrowForwardIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
                                    )}
                                </Box>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default StudentDashboard;
