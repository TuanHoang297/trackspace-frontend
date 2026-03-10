import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, Alert, Typography, InputAdornment,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import axiosClient from '../../api/axiosClient';
import { getUser } from '../../utils/auth';

interface Props {
    open: boolean;
    onClose: () => void;
}

const GitHubLoginDialog: React.FC<Props> = ({ open, onClose }) => {
    const [githubLogin, setGithubLogin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            const user = getUser();
            setGithubLogin(user?.githubLogin || '');
            setError('');
            setSuccess('');
        }
    }, [open]);

    const handleSubmit = async () => {
        setError(''); setSuccess('');
        setLoading(true);
        try {
            await axiosClient.put('/auth/github-login', { githubLogin: githubLogin.trim() });
            // Update localStorage
            const raw = localStorage.getItem('user');
            if (raw) {
                const user = JSON.parse(raw);
                user.githubLogin = githubLogin.trim();
                localStorage.setItem('user', JSON.stringify(user));
            }
            setSuccess('Đã lưu GitHub username thành công!');
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHubIcon />
                    Liên kết GitHub
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Nhập GitHub username để hệ thống tự động gán commit cho bạn, kể cả khi dùng email noreply.
                    </Typography>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}
                    <TextField
                        label="GitHub Username"
                        fullWidth
                        value={githubLogin}
                        onChange={(e) => setGithubLogin(e.target.value)}
                        placeholder="vd: octocat"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <GitHubIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Hủy</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={<GitHubIcon />}
                    sx={{ borderRadius: 2 }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GitHubLoginDialog;
