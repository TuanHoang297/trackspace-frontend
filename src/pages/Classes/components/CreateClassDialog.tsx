import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField,
} from '@mui/material';
import type { CreateClassRequest } from '../../../types/class.types';

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    onSubmit: (data: CreateClassRequest) => Promise<void>;
}

const CreateClassDialog: React.FC<Props> = ({ open, onClose, onCreated, onSubmit }) => {
    const [data, setData] = useState<CreateClassRequest>({
        className: '',
        classCode: '',
        semester: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(data);
            setData({ className: '', classCode: '', semester: '' });
            onCreated();
        } finally {
            setLoading(false);
        }
    };

    const isValid = data.className && data.classCode && data.semester;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo lớp học mới</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <TextField label="Tên lớp" fullWidth value={data.className}
                        onChange={(e) => setData({ ...data, className: e.target.value })}
                        placeholder="Ví dụ: Software Engineering"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Mã lớp" fullWidth value={data.classCode}
                        onChange={(e) => setData({ ...data, classCode: e.target.value })}
                        placeholder="Ví dụ: SE1801"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Học kỳ" fullWidth value={data.semester}
                        onChange={(e) => setData({ ...data, semester: e.target.value })}
                        placeholder="Ví dụ: Spring 2026"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading || !isValid}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang tạo...' : 'Tạo lớp'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateClassDialog;
