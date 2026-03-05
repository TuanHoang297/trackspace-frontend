import React, { useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { CreateClassRequest } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    onSubmit: (data: CreateClassRequest) => Promise<void>;
    lecturers: UserResponse[];
}

/**
 * Generate semester options based on current date.
 * Format: "Spring YYYY", "Summer YYYY", "Fall YYYY"
 * Returns current semester + next 3 semesters.
 */
function generateSemesterOptions(): { value: string; label: string }[] {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // Determine current semester
    // Spring: Jan-Apr, Summer: May-Aug, Fall: Sep-Dec
    let currentIndex: number;
    if (month >= 1 && month <= 4) currentIndex = 0;       // Spring
    else if (month >= 5 && month <= 8) currentIndex = 1;   // Summer
    else currentIndex = 2;                                  // Fall

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
    return options;
}

const CreateClassDialog: React.FC<Props> = ({ open, onClose, onCreated, onSubmit, lecturers }) => {
    const semesterOptions = useMemo(() => generateSemesterOptions(), []);

    const [data, setData] = useState<CreateClassRequest>({
        className: '',
        classCode: '',
        semester: semesterOptions[0]?.value ?? '',
        lecturerId: null,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(data);
            setData({ className: '', classCode: '', semester: semesterOptions[0]?.value ?? '', lecturerId: null });
            onCreated();
        } finally {
            setLoading(false);
        }
    };

    const isValid = data.className && data.classCode && data.semester && data.lecturerId;

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
                    <FormControl fullWidth>
                        <InputLabel>Học kỳ *</InputLabel>
                        <Select
                            value={data.semester}
                            label="Học kỳ *"
                            onChange={(e) => setData({ ...data, semester: e.target.value as string })}
                            sx={{ borderRadius: 2 }}
                        >
                            {semesterOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Giảng viên phụ trách *</InputLabel>
                        <Select
                            value={data.lecturerId ?? ''}
                            label="Giảng viên phụ trách *"
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
                <Button variant="contained" onClick={handleSubmit} disabled={loading || !isValid}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang tạo...' : 'Tạo lớp'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateClassDialog;

