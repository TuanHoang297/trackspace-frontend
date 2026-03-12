import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser } from '../../utils/auth';

const ForbiddenPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isNotFound = (location.state as any)?.type === 'not_found';

    const handleBack = () => {
        const lastId = localStorage.getItem('overview_last_project_id');
        if (lastId) {
            navigate(`/projects/${lastId}`, { replace: true });
            return;
        }
        const user = getUser();
        const role = user?.role;
        if (role === 'LECTURER') {
            navigate('/lecturer/classes', { replace: true });
        } else if (role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
        } else {
            navigate('/student/dashboard', { replace: true });
        }
    };

    return (
        <Box
            sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', bgcolor: 'background.default', p: 3,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 420,
                    border: '1px solid', borderColor: 'divider',
                }}
            >
                <Box
                    sx={{
                        width: 72, height: 72, borderRadius: '50%',
                        bgcolor: isNotFound ? '#FEE2E2' : '#FEF3C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 3,
                    }}
                >
                    {isNotFound
                        ? <SearchOffIcon sx={{ fontSize: 36, color: '#DC2626' }} />
                        : <LockOutlinedIcon sx={{ fontSize: 36, color: '#D97706' }} />
                    }
                </Box>

                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                    {isNotFound ? 'Dự án không tồn tại' : 'Không có quyền truy cập'}
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                    {isNotFound
                        ? 'Dự án này đã bị xóa hoặc không tồn tại.'
                        : 'Bạn không phải thành viên của dự án này.'
                    }
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 4, fontSize: '0.875rem' }}>
                    {isNotFound
                        ? 'Vui lòng kiểm tra lại đường dẫn hoặc liên hệ giảng viên.'
                        : 'Vui lòng liên hệ giảng viên để được cấp quyền truy cập.'
                    }
                </Typography>

                <Button
                    variant="contained"
                    onClick={handleBack}
                    sx={{
                        borderRadius: 2, px: 4, py: 1.2,
                        bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' },
                        textTransform: 'none', fontWeight: 600,
                    }}
                >
                    Quay lại
                </Button>
            </Paper>
        </Box>
    );
};

export default ForbiddenPage;
