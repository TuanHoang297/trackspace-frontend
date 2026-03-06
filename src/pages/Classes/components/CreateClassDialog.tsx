import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { CreateClassRequest } from '../../../types/class.types';
import type { SemesterResponse, SubjectResponse } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';
import { semesterService, subjectService } from '../../../api/services/classService';

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    onSubmit: (data: CreateClassRequest) => Promise<void>;
    lecturers: UserResponse[];
}

const CreateClassDialog: React.FC<Props> = ({ open, onClose, onCreated, onSubmit, lecturers }) => {
    const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);

    const [data, setData] = useState<CreateClassRequest>({
        subjectId: null,
        classCode: '',
        semesterId: null,
        lecturerId: null,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            Promise.all([
                semesterService.getSemesters(),
                subjectService.getSubjects(),
            ]).then(([semRes, subRes]) => {
                const semList = semRes.data.data ?? [];
                const subList = subRes.data.data ?? [];
                setSemesters(semList);
                setSubjects(subList);
                setData((d) => ({
                    ...d,
                    semesterId: d.semesterId ?? (semList[0]?.id ?? null),
                }));
            }).catch(() => {});
        }
    }, [open]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(data);
            setData({ subjectId: null, classCode: '', semesterId: semesters[0]?.id ?? null, lecturerId: null });
            onCreated();
        } finally {
            setLoading(false);
        }
    };

    const isValid = data.subjectId && data.classCode && data.semesterId && data.lecturerId;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo lớp học mới</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <FormControl fullWidth required>
                        <InputLabel>Môn học *</InputLabel>
                        <Select
                            value={data.subjectId ?? ''}
                            label="Môn học *"
                            onChange={(e) => setData({ ...data, subjectId: e.target.value as number })}
                            sx={{ borderRadius: 2 }}
                        >
                            {subjects.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.subjectCode} — {s.subjectName}</MenuItem>
                            ))}
                            {subjects.length === 0 && <MenuItem disabled>Chưa có môn học nào</MenuItem>}
                        </Select>
                    </FormControl>
                    <TextField label="Mã lớp" fullWidth value={data.classCode}
                        onChange={(e) => setData({ ...data, classCode: e.target.value })}
                        placeholder="Ví dụ: SE1801"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <FormControl fullWidth>
                        <InputLabel>Học kỳ *</InputLabel>
                        <Select
                            value={data.semesterId ?? ''}
                            label="Học kỳ *"
                            onChange={(e) => setData({ ...data, semesterId: e.target.value as number })}
                            sx={{ borderRadius: 2 }}
                        >
                            {semesters.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                            {semesters.length === 0 && <MenuItem disabled>Chưa có học kỳ nào</MenuItem>}
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
                    {loading ? 'Đang tạo...' : 'Tạo lớp học'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateClassDialog;

