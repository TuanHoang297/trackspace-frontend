import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, Alert, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axiosClient from '../../api/axiosClient';

interface Props {
    open: boolean;
    onClose: () => void;
}

const ChangePasswordDialog: React.FC<Props> = ({ open, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const reset = () => {
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setError(''); setSuccess('');
        setShowCurrent(false); setShowNew(false);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async () => {
        setError(''); setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng điền đầy đủ các trường');
            return;
        }
        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            await axiosClient.put('/auth/change-password', { currentPassword, newPassword });
            setSuccess('Đổi mật khẩu thành công!');
            setTimeout(handleClose, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': { borderRadius: 2 },
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Đổi mật khẩu</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            label="Mật khẩu hiện tại" fullWidth
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            sx={fieldSx}
                        />
                        <IconButton size="small"
                            onClick={() => setShowCurrent(p => !p)}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                            {showCurrent ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </Box>

                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            label="Mật khẩu mới" fullWidth
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            sx={fieldSx}
                        />
                        <IconButton size="small"
                            onClick={() => setShowNew(p => !p)}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                            {showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </Box>

                    <TextField
                        label="Xác nhận mật khẩu mới" fullWidth
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={fieldSx}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={handleClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangePasswordDialog;
