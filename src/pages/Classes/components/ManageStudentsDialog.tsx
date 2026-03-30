import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, InputAdornment,
    Checkbox, IconButton, Skeleton, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import classService from '../../../api/services/classService';
import ConfirmDialog from '../../../components/common/ConfirmDialog/ConfirmDialog';
import ImportStudentsExcelDialog from './ImportStudentsExcelDialog';
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
    const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
    const [sameSubjectEnrolledIds, setSameSubjectEnrolledIds] = useState<Set<number>>(new Set());
    
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState('');
    
    // View mode: 'LIST' shows enrolled students, 'ADD' shows available students to add
    const [mode, setMode] = useState<'LIST' | 'ADD'>('LIST');
    
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectedEnrolledIds, setSelectedEnrolledIds] = useState<Set<number>>(new Set());
    
    const [removeTarget, setRemoveTarget] = useState<StudentInClassResponse | null>(null);
    const [confirmBulkRemoveUrl, setConfirmBulkRemove] = useState<boolean>(false);
    const [openExcelDialog, setOpenExcelDialog] = useState(false);

    const loadData = async () => {
        if (!target) return;
        setLoading(true);
        try {
            const [studentsRes, enrolledRes] = await Promise.all([
                classService.getStudents(target.id),
                classService.getEnrolledStudentIdsByClass(target.id),
            ]);
            const list = studentsRes.data.data ?? [];
            setStudents(list);
            setEnrolledIds(new Set(list.map((s) => s.studentId)));
            setSameSubjectEnrolledIds(new Set(enrolledRes.data.data ?? []));
            setSelectedEnrolledIds(new Set()); // Reset selections on load
        } catch {
            setStudents([]);
            setEnrolledIds(new Set());
            setSameSubjectEnrolledIds(new Set());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (target) {
            setSearch('');
            setMode('LIST');
            setSelectedIds(new Set());
            setSelectedEnrolledIds(new Set());
            loadData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    const available = useMemo(() =>
        allUsers.filter(u =>
            u.role === 'STUDENT' &&
            !enrolledIds.has(u.userId) &&
            !sameSubjectEnrolledIds.has(u.userId)
        ).sort((a, b) => a.fullName.localeCompare(b.fullName)), 
    [allUsers, enrolledIds, sameSubjectEnrolledIds]);

    // Derived lists based on search
    const filteredEnrolled = useMemo(() => {
        if (!search.trim()) return students;
        const q = search.toLowerCase();
        return students.filter(s => 
            s.fullName.toLowerCase().includes(q) || 
            s.email.toLowerCase().includes(q)
        );
    }, [students, search]);

    const filteredAvailable = useMemo(() => {
        if (!search.trim()) return available;
        const q = search.toLowerCase();
        return available.filter(s => 
            s.fullName.toLowerCase().includes(q) || 
            s.email.toLowerCase().includes(q)
        );
    }, [available, search]);

    const allSelected = filteredAvailable.length > 0 && filteredAvailable.every(u => selectedIds.has(u.userId));
    const allEnrolledSelected = filteredEnrolled.length > 0 && filteredEnrolled.every(u => selectedEnrolledIds.has(u.studentId));

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
            if (allSelected) {
                // Remove all current filtered
                filteredAvailable.forEach(u => next.delete(u.userId));
            } else {
                // Add all current filtered
                filteredAvailable.forEach(u => next.add(u.userId));
            }
            return next;
        });
    };

    const toggleEnrolled = (id: number) => {
        setSelectedEnrolledIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAllEnrolled = () => {
        setSelectedEnrolledIds(prev => {
            const next = new Set(prev);
            if (allEnrolledSelected) {
                filteredEnrolled.forEach(u => next.delete(u.studentId));
            } else {
                filteredEnrolled.forEach(u => next.add(u.studentId));
            }
            return next;
        });
    };

    const handleConfirmRemove = async () => {
        if (!target || !removeTarget) return;
        setProcessing(true);
        try {
            await classService.removeStudent(target.id, removeTarget.studentId);
            toast.success(`Đã xóa ${removeTarget.fullName} khỏi lớp`);
            setRemoveTarget(null);
            await loadData();
            onRefresh();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Xóa sinh viên thất bại';
            toast.error(message);
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkRemoveEnrolled = async () => {
        if (!target || selectedEnrolledIds.size === 0) return;
        const ids = Array.from(selectedEnrolledIds);
        setProcessing(true); 
        setProgress(0);
        let ok = 0, fail = 0;
        for (let i = 0; i < ids.length; i++) {
            try { 
                await classService.removeStudent(target.id, ids[i]); 
                ok++; 
            }
            catch { fail++; }
            setProgress(Math.round(((i + 1) / ids.length) * 100));
        }
        if (ok > 0) toast.success(`Đã xóa ${ok} sinh viên khỏi lớp!`);
        if (fail > 0) toast.error(`${fail} sinh viên xóa thất bại`);
        
        setSelectedEnrolledIds(new Set());
        setConfirmBulkRemove(false);
        await loadData();
        onRefresh();
        
        setProcessing(false); 
        setProgress(0);
    };

    const handleBulkAdd = async () => {
        if (!target || selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        setProcessing(true); 
        setProgress(0);
        let ok = 0, fail = 0;
        for (let i = 0; i < ids.length; i++) {
            try { 
                await classService.addStudent(target.id, ids[i]); 
                ok++; 
            }
            catch { fail++; }
            setProgress(Math.round(((i + 1) / ids.length) * 100));
        }
        if (ok > 0) toast.success(`Đã thêm ${ok} sinh viên vào lớp!`);
        if (fail > 0) toast.error(`${fail} sinh viên thêm thất bại`);
        
        setSelectedIds(new Set());
        setMode('LIST');
        setSearch('');
        await loadData();
        onRefresh();
        
        setProcessing(false); 
        setProgress(0);
    };

    return (
        <>
            <Dialog open={!!target} onClose={() => { if (!processing) onClose(); }}
                maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}>
                
                {/* HEADERS */}
                {mode === 'LIST' ? (
                    <DialogTitle sx={{ fontWeight: 700, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PeopleIcon sx={{ color: 'primary.main' }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                                    Danh sách sinh viên
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Lớp: {target?.classCode} • Sĩ số: {students.length}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                variant="outlined" color="primary"
                                size="small"
                                startIcon={<UploadFileIcon />}
                                onClick={() => setOpenExcelDialog(true)}
                                disabled={processing}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Thêm từ Excel
                            </Button>
                            <Button 
                                variant="contained" color="primary"
                                size="small"
                                startIcon={<PersonAddIcon />}
                                onClick={() => { setSearch(''); setMode('ADD'); }}
                                disabled={processing}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Thêm sinh viên
                            </Button>
                        </Box>
                    </DialogTitle>
                ) : (
                    <DialogTitle sx={{ fontWeight: 700, pb: 2, pt: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <IconButton 
                            onClick={() => { setSearch(''); setMode('LIST'); }} 
                            edge="start" 
                            disabled={processing}
                            sx={{ mr: 1, color: 'text.secondary' }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                                Thêm sinh viên vào lớp
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Có {available.length} sinh viên khả dụng
                            </Typography>
                        </Box>
                    </DialogTitle>
                )}

                {processing && <LinearProgress variant="determinate" value={progress > 0 ? progress : undefined} sx={{ height: 3 }} />}

                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', bgcolor: '#FAFBFC' }}>
                    
                    {/* SEARCH BAR (Common for both modes) */}
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
                        <TextField 
                            fullWidth size="small" 
                            placeholder={mode === 'LIST' ? "Tìm kiếm trong lớp..." : "Tìm kiếm sinh viên bên ngoài..."}
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f5f5f5' } }} 
                        />
                    </Box>

                    {/* CONTENT AREA */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: mode === 'LIST' ? 0 : 2 }}>
                        {loading ? (
                            <Box sx={{ p: 2 }}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 2 }} />)}</Box>
                        ) : mode === 'LIST' ? (
                            /* --- LIST MODE --- */
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0, bgcolor: 'transparent' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" width={50}>
                                                <Checkbox
                                                    color="primary"
                                                    size="small"
                                                    checked={allEnrolledSelected}
                                                    onChange={toggleAllEnrolled}
                                                    indeterminate={selectedEnrolledIds.size > 0 && !allEnrolledSelected && filteredEnrolled.some(s => selectedEnrolledIds.has(s.studentId))}
                                                />
                                            </TableCell>
                                            <TableCell width={60} sx={{ fontWeight: 600 }}>STT</TableCell>
                                            <TableCell width={120} sx={{ fontWeight: 600 }}>MSSV</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}><Box sx={{ pl: '44px' }}>Họ và tên</Box></TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredEnrolled.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    <PeopleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
                                                    <Typography variant="body1">
                                                        {search ? 'Không tìm thấy sinh viên nào' : 'Lớp chưa có sinh viên'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredEnrolled.map((s, idx) => (
                                                <TableRow key={s.studentId} hover sx={{ '&:last-child td': { border: 0 } }} 
                                                    selected={selectedEnrolledIds.has(s.studentId)}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox 
                                                            color="primary" 
                                                            size="small"
                                                            checked={selectedEnrolledIds.has(s.studentId)} 
                                                            onChange={() => toggleEnrolled(s.studentId)} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>{s.studentCode || '-'}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Box sx={{ 
                                                                width: 32, height: 32, borderRadius: '50%',
                                                                bgcolor: '#4C9AFF', color: 'white',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 600, fontSize: '0.8rem'
                                                            }}>
                                                                {s.fullName.charAt(0).toUpperCase()}
                                                            </Box>
                                                            <Typography variant="body2" fontWeight={500}>{s.fullName}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">{s.email}</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            /* --- ADD MODE --- */
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0, bgcolor: 'transparent', flex: 1 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox" width={50}>
                                                    <Checkbox
                                                        color="primary"
                                                        size="small"
                                                        checked={allSelected}
                                                        onChange={toggleAll}
                                                        indeterminate={selectedIds.size > 0 && !allSelected && filteredAvailable.some(u => selectedIds.has(u.userId))}
                                                    />
                                                </TableCell>
                                                <TableCell width={60} sx={{ fontWeight: 600 }}>STT</TableCell>
                                                <TableCell width={120} sx={{ fontWeight: 600 }}>MSSV</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}><Box sx={{ pl: '44px' }}>Họ và tên</Box></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredAvailable.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                        <PersonAddIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
                                                        <Typography variant="body1">
                                                            {search ? 'Không tìm thấy sinh viên nào hợp lệ' : 'Tất cả sinh viên đã vào lớp'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredAvailable.map((u, idx) => {
                                                    const checked = selectedIds.has(u.userId);
                                                    return (
                                                        <TableRow key={u.userId} hover sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }} 
                                                            selected={checked}
                                                            onClick={() => toggle(u.userId)}
                                                        >
                                                            <TableCell padding="checkbox">
                                                                <Checkbox 
                                                                    color="primary" 
                                                                    size="small"
                                                                    checked={checked} 
                                                                    onChange={() => toggle(u.userId)} 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{idx + 1}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={500}>{u.studentCode || '-'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Box sx={{ 
                                                                        width: 32, height: 32, borderRadius: '50%',
                                                                        bgcolor: checked ? 'primary.main' : '#f3f4f6', 
                                                                        color: checked ? 'white' : 'text.secondary',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontWeight: 600, fontSize: '0.8rem'
                                                                    }}>
                                                                        {u.fullName.charAt(0).toUpperCase()}
                                                                    </Box>
                                                                    <Typography variant="body2" fontWeight={checked ? 600 : 500}>{u.fullName}</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                
                {/* FOOTERS */}
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fafafa', justifyContent: 'space-between' }}>
                    <Box>
                        {mode === 'LIST' && selectedEnrolledIds.size > 0 && (
                            <Button 
                                variant="outlined" color="error"
                                onClick={() => setConfirmBulkRemove(true)} 
                                disabled={processing}
                                startIcon={<DeleteIcon />}
                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                            >
                                Xóa {selectedEnrolledIds.size} sinh viên
                            </Button>
                        )}
                        
                        {mode === 'ADD' && (
                            <Button 
                                variant="contained" color="primary"
                                onClick={handleBulkAdd} 
                                disabled={processing || selectedIds.size === 0}
                                startIcon={<PersonAddIcon />}
                                sx={{ textTransform: 'none', borderRadius: 2, px: 3, fontWeight: 600 }}
                            >
                                Thêm {selectedIds.size} sinh viên
                            </Button>
                        )}
                    </Box>
                    
                    <Button onClick={onClose} disabled={processing} variant={mode === 'LIST' ? "contained" : "outlined"} color="inherit" sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog open={!!removeTarget} title="Xác nhận xóa sinh viên"
                message={<>Bạn có chắc chắn muốn xóa <strong>{removeTarget?.fullName}</strong> ({removeTarget?.email}) khỏi lớp?</>}
                severity="warning" confirmLabel="Xóa"
                onConfirm={handleConfirmRemove} onCancel={() => setRemoveTarget(null)} />
                
            <ConfirmDialog open={confirmBulkRemoveUrl} title="Xác nhận xóa hàng loạt"
                message={<>Bạn có chắc chắn muốn xóa <strong>{selectedEnrolledIds.size}</strong> sinh viên đã chọn khỏi lớp?</>}
                severity="error" confirmLabel="Xóa hàng loạt"
                onConfirm={handleBulkRemoveEnrolled} onCancel={() => setConfirmBulkRemove(false)} />

            {target && (
                <ImportStudentsExcelDialog 
                    open={openExcelDialog} 
                    onClose={() => setOpenExcelDialog(false)} 
                    onSuccess={() => { setOpenExcelDialog(false); loadData(); onRefresh(); }} 
                    targetClassId={target.id}
                    allUsers={allUsers}
                    enrolledIds={enrolledIds}
                    sameSubjectEnrolledIds={sameSubjectEnrolledIds}
                />
            )}
        </>
    );
};

export default ManageStudentsDialog;
