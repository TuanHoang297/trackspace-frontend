import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { ClassResponse, UpdateClassRequest } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';

interface Props {
    target: ClassResponse | null;
    onClose: () => void;
    onSubmit: (classId: number, data: UpdateClassRequest) => Promise<void>;
    lecturers: UserResponse[];
}

function generateSemesterOptions(currentValue?: string): { value: string; label: string }[] {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let currentIndex: number;
    if (month >= 1 && month <= 4) currentIndex = 0;
    else if (month >= 5 && month <= 8) currentIndex = 1;
    else currentIndex = 2;

    const seasons = ['Spring', 'Summer', 'Fall'];
    const seasonLabels = ['Xuân', 'Hè', 'Thu'];
    const options: { value: string; label: string }[] = [];

    let y = year;
    let idx = currentIndex;
    for (let i = 0; i < 4; i++) {
        const value = `${seasons[idx]} ${y}`;
        const label = `${seasonLabels[idx]} ${y} (${value})`;
        options.push({ value, label });
        idx++;
        if (idx >= 3) { idx = 0; y++; }
    }

    if (currentValue && !options.some(o => o.value === currentValue)) {
        options.unshift({ value: currentValue, label: currentValue });
    }

    return options;
}

const EditClassDialog: React.FC<Props> = ({ target, onClose, onSubmit, lecturers }) => {
    const [data, setData] = useState<UpdateClassRequest>({});
    const [loading, setLoading] = useState(false);

    const semesterOptions = useMemo(() => generateSemesterOptions(target?.semester), [target]);

    useEffect(() => {
        if (target) {
            setData({
                className: target.className,
                semester: target.semester,
                active: target.active,
                lecturerId: target.lecturerId,
            });
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
                    <FormControl fullWidth>
                        <InputLabel>Học kỳ</InputLabel>
                        <Select
                            value={data.semester || ''}
                            label="Học kỳ"
                            onChange={(e) => setData({ ...data, semester: e.target.value as string })}
                            sx={{ borderRadius: 2 }}
                        >
                            {semesterOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Giảng viên phụ trách</InputLabel>
                        <Select
                            value={data.lecturerId ?? ''}
                            label="Giảng viên phụ trách"
                            onChange={(e) => setData({ ...data, lecturerId: e.target.value as number })}
                            sx={{ borderRadius: 2 }}
                        >
                            {lecturers.map((l) => (
                                <MenuItem key={l.userId} value={l.userId}>{l.fullName} ({l.email})</MenuItem>
                            ))}
                            {lecturers.length === 0 && <MenuItem disabled>Chưa có giảng viên nào</MenuItem>}
                        </Select>
                    </FormControl>
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


