import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, FormControl, InputLabel, Select,
    MenuItem, Box, Typography, InputAdornment, IconButton,
    Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { UserResponse, UpdateUserRequest } from '../../../api/types/types';

interface Props {
    open: boolean;
    user: UserResponse | null;
    onClose: () => void;
    onSubmit: (userId: number, data: UpdateUserRequest) => Promise<void>;
}

const ROLES = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'LECTURER', label: 'Giảng viên' },
    { value: 'TEAMLEADER', label: 'Trưởng nhóm' },
    { value: 'TEAMMEMBER', label: 'Thành viên' },
] as const;

const EditUserDialog: React.FC<Props> = ({ open, user, onClose, onSubmit }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>('TEAMMEMBER');
    const [studentCode, setStudentCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.fullName);
            setEmail(user.email);
            setRole(user.role);
            setStudentCode(user.studentCode || '');
            setPassword('');
            setShowPassword(false);
            setError('');
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!user || !fullName.trim() || !email.trim()) return;
        try {
            setSaving(true);
            setError('');
            const data: UpdateUserRequest = {
                fullName: fullName.trim(),
                email: email.trim(),
                role: role as UpdateUserRequest['role'],
                studentCode: studentCode.trim() || undefined,
                password: password || undefined,
            };
            await onSubmit(user.userId, data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setSaving(false);
        }
    };

    const isStudent = role === 'TEAMLEADER' || role === 'TEAMMEMBER';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                Chỉnh sửa thông tin người dùng
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <TextField
                        label="Họ và tên"
                        fullWidth required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        label="Email"
                        fullWidth required type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Vai trò</InputLabel>
                        <Select
                            value={role}
                            label="Vai trò"
                            onChange={(e) => setRole(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            {ROLES.map((r) => (
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {isStudent && (
                        <TextField
                            label="Mã sinh viên"
                            fullWidth
                            value={studentCode}
                            onChange={(e) => setStudentCode(e.target.value)}
                            placeholder="VD: SE171234"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    )}

                    <Box>
                        <TextField
                            label="Mật khẩu mới (tùy chọn)"
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Để trống nếu không đổi"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Để trống nếu không muốn đổi mật khẩu. Tối thiểu 6 ký tự.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={saving || !fullName.trim() || !email.trim()}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditUserDialog;
