import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Select,
    MenuItem, FormControl, InputLabel,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { toast } from 'react-toastify';
import type { CreateUserRequest } from '../../../api/types/types';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserRequest) => Promise<void>;
}

const CreateUserDialog: React.FC<Props> = ({ open, onClose, onSubmit }) => {
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<CreateUserRequest>({
        email: '', password: '', fullName: '', role: 'LECTURER', studentCode: '',
    });

    const handleSubmit = async () => {
        if (!form.email || !form.password || !form.fullName) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        setCreating(true);
        try {
            await onSubmit(form);
            setForm({ email: '', password: '', fullName: '', role: 'LECTURER', studentCode: '' });
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Tạo tài khoản thất bại';
            toast.error(message);
        } finally {
            setCreating(false);
        }
    };

    const update = (field: keyof CreateUserRequest, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
            <Box sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                px: 3, py: 2.5, color: '#fff',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonAddIcon />
                    <Typography variant="h6" fontWeight={700}>Thêm tài khoản mới</Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                    Tạo tài khoản người dùng cho hệ thống
                </Typography>
            </Box>
            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField label="Họ tên" fullWidth value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Email" type="email" fullWidth value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Mật khẩu" type="password" fullWidth value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <FormControl fullWidth>
                        <InputLabel>Vai trò</InputLabel>
                        <Select value={form.role} label="Vai trò" sx={{ borderRadius: 2 }}
                            onChange={(e) => update('role', e.target.value)}>
                            <MenuItem value="LECTURER">Giảng viên</MenuItem>
                            <MenuItem value="TEAMMEMBER">Thành viên</MenuItem>
                        </Select>
                    </FormControl>
                    {(form.role === 'TEAMLEADER' || form.role === 'TEAMMEMBER') && (
                        <TextField label="Mã sinh viên" fullWidth value={form.studentCode || ''}
                            onChange={(e) => update('studentCode', e.target.value)}
                            placeholder="VD: SE123456"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2, color: '#64748B', px: 3 }}>
                    Hủy
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={creating}
                    sx={{
                        textTransform: 'none', borderRadius: 2, px: 3,
                        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' },
                    }}>
                    {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateUserDialog;
