import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import type { ClassResponse, UpdateClassRequest, SemesterResponse, SubjectResponse } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';
import { semesterService, subjectService } from '../../../api/services/classService';

interface Props {
    target: ClassResponse | null;
    onClose: () => void;
    onSubmit: (classId: number, data: UpdateClassRequest) => Promise<void>;
    lecturers: UserResponse[];
}

const EditClassDialog: React.FC<Props> = ({ target, onClose, onSubmit, lecturers }) => {
    const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [data, setData] = useState<UpdateClassRequest>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            semesterService.getSemesters(),
            subjectService.getSubjects(),
        ]).then(([semRes, subRes]) => {
            setSemesters(semRes.data.data ?? []);
            setSubjects(subRes.data.data ?? []);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (target) {
            setData({
                subjectId: target.subjectId,
                semesterId: target.semesterId,
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
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Sửa lớp học: {target?.classCode}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <FormControl fullWidth>
                        <InputLabel>Môn học</InputLabel>
                        <Select
                            value={data.subjectId ?? ''}
                            label="Môn học"
                            onChange={(e) => setData({ ...data, subjectId: e.target.value as number })}
                            sx={{ borderRadius: 2 }}
                        >
                            {subjects.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.subjectCode} — {s.subjectName}</MenuItem>
                            ))}
                            {subjects.length === 0 && <MenuItem disabled>Chưa có môn học nào</MenuItem>}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Học kỳ</InputLabel>
                        <Select
                            value={data.semesterId ?? ''}
                            label="Học kỳ"
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


