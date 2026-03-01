import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField,
} from '@mui/material';
import type { ClassResponse, UpdateClassRequest } from '../../../types/class.types';

interface Props {
    target: ClassResponse | null;
    onClose: () => void;
    onSubmit: (classId: number, data: UpdateClassRequest) => Promise<void>;
}

const EditClassDialog: React.FC<Props> = ({ target, onClose, onSubmit }) => {
    const [data, setData] = useState<UpdateClassRequest>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (target) {
            setData({ className: target.className, semester: target.semester, active: target.active });
        }
    }, [target]);

    const handleSubmit = async () => {
        if (!target) return;
        setLoading(true);
        try {
            await onSubmit(target.id, data);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!target} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Sửa lớp: {target?.classCode}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <TextField label="Tên lớp" fullWidth value={data.className || ''}
                        onChange={(e) => setData({ ...data, className: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Học kỳ" fullWidth value={data.semester || ''}
                        onChange={(e) => setData({ ...data, semester: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditClassDialog;
