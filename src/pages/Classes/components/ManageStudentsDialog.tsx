import React, { useState, useMemo, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, InputAdornment,
    Checkbox, Divider, Chip, IconButton, Skeleton, LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import classService from '../../../api/services/classService';
import type { ClassResponse, StudentInClassResponse } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';

interface Props {
    target: ClassResponse | null;
    allUsers: UserResponse[];
    onClose: () => void;
    onRefresh: () => void;
}

const ManageStudentsDialog: React.FC<Props> = ({ target, allUsers, onClose, onRefresh }) => {
    const [students, setStudents] = useState<StudentInClassResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (target) {
            setLoading(true);
            setSelectedIds(new Set());
            setSearch('');
            classService.getStudents(target.id)
                .then(res => setStudents(res.data.data))
                .catch(() => setStudents([]))
                .finally(() => setLoading(false));
        }
    }, [target]);

    const available = useMemo(() =>
        allUsers.filter(u =>
            (u.role === 'TEAMMEMBER' || u.role === 'TEAMLEADER') &&
            !students.some(s => s.studentId === u.userId)
        ), [allUsers, students]);

    const filtered = useMemo(() =>
        available.filter(u =>
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        ), [available, search]);

    const allSelected = filtered.length > 0 && filtered.every(u => selectedIds.has(u.userId));

    const toggle = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) filtered.forEach(u => next.delete(u.userId));
            else filtered.forEach(u => next.add(u.userId));
            return next;
        });
    };

    const refreshStudents = async () => {
        if (!target) return;
        const res = await classService.getStudents(target.id);
        setStudents(res.data.data);
    };

    const handleBulkAdd = async () => {
        if (!target || selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        setAdding(true); setProgress(0);
        let ok = 0, fail = 0;
        for (let i = 0; i < ids.length; i++) {
            try { await classService.addStudent(target.id, ids[i]); ok++; }
            catch { fail++; }
            setProgress(Math.round(((i + 1) / ids.length) * 100));
        }
        if (ok > 0) toast.success(`Đã thêm ${ok} sinh viên vào lớp!`);
        if (fail > 0) toast.error(`${fail} sinh viên thêm thất bại`);
        setSelectedIds(new Set());
        await refreshStudents();
        onRefresh();
        setAdding(false); setProgress(0);
    };

    const handleRemove = async (s: StudentInClassResponse) => {
        if (!target) return;
        try {
            await classService.removeStudent(target.id, s.studentId);
            toast.success(`Đã xóa ${s.fullName} khỏi lớp`);
            await refreshStudents();
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa sinh viên thất bại');
        }
    };

    return (
        <Dialog open={!!target} onClose={() => { if (!adding) onClose(); }}
            maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, height: '85vh' } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ color: 'primary.main' }} />
                    <Typography fontWeight={700}>{target?.className} ({target?.classCode})</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${students.length} đã vào lớp`} color="primary" size="small" />
                    <Chip label={`${available.length} chưa vào lớp`} size="small" />
                </Box>
            </DialogTitle>

            {adding && <LinearProgress variant="determinate" value={progress} sx={{ height: 3 }} />}

            <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT: Available */}
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ p: 2, pb: 1, bgcolor: '#fafafa' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">SINH VIÊN CHƯA VÀO LỚP</Typography>
                            {selectedIds.size > 0 && (
                                <Chip label={`Đã chọn ${selectedIds.size}`} color="primary" size="small"
                                    onDelete={() => setSelectedIds(new Set())} />
                            )}
                        </Box>
                        <TextField fullWidth size="small" placeholder="Tìm theo tên hoặc email..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        {filtered.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, px: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, py: 0.5 }} onClick={toggleAll}>
                                <Checkbox size="small" checked={allSelected}
                                    indeterminate={selectedIds.size > 0 && !allSelected && filtered.some(u => selectedIds.has(u.userId))}
                                    sx={{ p: 0.5, mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {allSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${filtered.length})`}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Divider />
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <Box sx={{ p: 2 }}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}</Box>
                        ) : filtered.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                                <Typography variant="body2">
                                    {search ? 'Không tìm thấy sinh viên phù hợp' : 'Tất cả sinh viên đã vào lớp'}
                                </Typography>
                            </Box>
                        ) : (
                            filtered.map(u => {
                                const checked = selectedIds.has(u.userId);
                                return (
                                    <Box key={u.userId} onClick={() => toggle(u.userId)}
                                        sx={{
                                            display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer',
                                            bgcolor: checked ? 'primary.50' : 'transparent',
                                            borderLeft: checked ? '3px solid' : '3px solid transparent',
                                            borderColor: checked ? 'primary.main' : 'transparent',
                                            '&:hover': { bgcolor: checked ? 'primary.50' : 'action.hover' }
                                        }}>
                                        <Checkbox checked={checked} size="small" sx={{ p: 0.5, mr: 1.5 }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={checked ? 600 : 400} noWrap>{u.fullName}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                                        </Box>
                                        <Chip label={u.role === 'TEAMLEADER' ? 'Leader' : 'Member'} size="small"
                                            color={u.role === 'TEAMLEADER' ? 'warning' : 'default'} sx={{ fontSize: 10, height: 20 }} />
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
                        <Button variant="contained" fullWidth startIcon={<PersonAddIcon />}
                            onClick={handleBulkAdd} disabled={adding || selectedIds.size === 0}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, py: 1.2 }}>
                            {adding ? `Đang thêm... (${progress}%)` : selectedIds.size === 0 ? 'Chọn sinh viên để thêm' : `Thêm ${selectedIds.size} sinh viên vào lớp`}
                        </Button>
                    </Box>
                </Box>

                {/* RIGHT: Enrolled */}
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2, pb: 1, bgcolor: '#fafafa' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                            SINH VIÊN TRONG LỚP ({students.length})
                        </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <Box sx={{ p: 2 }}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}</Box>
                        ) : students.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                                <Typography variant="body2">Chưa có sinh viên nào trong lớp</Typography>
                                <Typography variant="caption">Chọn sinh viên bên trái và nhấn "Thêm"</Typography>
                            </Box>
                        ) : (
                            students.map((s, i) => (
                                <Box key={s.enrollmentId}
                                    sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
                                        <Typography variant="caption" fontWeight={700} color="primary.main">{i + 1}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={500} noWrap>{s.fullName}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>{s.email}</Typography>
                                    </Box>
                                    <IconButton size="small" color="error" onClick={() => handleRemove(s)} sx={{ ml: 1 }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose} disabled={adding} sx={{ textTransform: 'none', borderRadius: 2 }}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageStudentsDialog;
