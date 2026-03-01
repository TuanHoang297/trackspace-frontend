import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { ClassResponse } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';

interface Props {
    target: ClassResponse | null;
    lecturers: UserResponse[];
    onClose: () => void;
    onSubmit: (classId: number, lecturerId: number) => Promise<void>;
}

const AssignLecturerDialog: React.FC<Props> = ({ target, lecturers, onClose, onSubmit }) => {
    const [selectedId, setSelectedId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (target) setSelectedId(target.lecturerId || '');
    }, [target]);

    const handleSubmit = async () => {
        if (!target || !selectedId) return;
        setLoading(true);
        try {
            await onSubmit(target.id, selectedId as number);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!target} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Gán giảng viên: {target?.className}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Chọn giảng viên</InputLabel>
                    <Select value={selectedId} label="Chọn giảng viên"
                        onChange={(e) => setSelectedId(e.target.value as number)} sx={{ borderRadius: 2 }}>
                        {lecturers.map((l) => (
                            <MenuItem key={l.userId} value={l.userId}>{l.fullName} ({l.email})</MenuItem>
                        ))}
                        {lecturers.length === 0 && <MenuItem disabled>Chưa có giảng viên nào</MenuItem>}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading || !selectedId}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang gán...' : 'Gán giảng viên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignLecturerDialog;
