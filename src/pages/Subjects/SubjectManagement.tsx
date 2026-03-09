import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
    Box, Typography, Button, Card, Table, TableContainer, TableHead, TableRow,
    TableCell, TableBody, Skeleton, Alert, TextField, InputAdornment, Chip,
    IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SchoolIcon from '@mui/icons-material/School';
import { subjectService } from '../../api/services/classService';
import classService from '../../api/services/classService';
import type { SubjectResponse, SubjectRequest, ClassResponse } from '../../types/class.types';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';

const SubjectManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuSubject, setMenuSubject] = useState<SubjectResponse | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SubjectResponse | null>(null);
    const [form, setForm] = useState<SubjectRequest>({ subjectCode: '', subjectName: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<SubjectResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Cached parallel queries ──
    const { data: subjects = [], isLoading: subjectsLoading, error: subjectsError } = useQuery({
        queryKey: ['admin', 'subjects'],
        queryFn: async () => { const r = await subjectService.getAllSubjects(); return (r.data.data ?? []) as SubjectResponse[]; },
    });
    const { data: allClasses = [], isLoading: classesLoading } = useQuery({
        queryKey: ['admin', 'classes'],
        queryFn: async () => { const r = await classService.getClasses(); return (r.data.data ?? []) as ClassResponse[]; },
    });
    const loading = subjectsLoading || classesLoading;
    const error = subjectsError ? 'Không thể tải dữ liệu' : null;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

    const classesBySubject = useMemo(() => {
        const map = new Map<number, ClassResponse[]>();
        allClasses.forEach((c) => {
            if (c.subjectId != null) {
                if (!map.has(c.subjectId)) map.set(c.subjectId, []);
                map.get(c.subjectId)!.push(c);
            }
        });
        return map;
    }, [allClasses]);

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return subjects.filter(s =>
            s.subjectCode.toLowerCase().includes(q) || s.subjectName.toLowerCase().includes(q),
        );
    }, [subjects, searchTerm]);

    const activeCount = subjects.filter(s => s.active).length;

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, s: SubjectResponse) => {
        setMenuAnchor(e.currentTarget);
        setMenuSubject(s);
    };
    const handleMenuClose = () => { setMenuAnchor(null); setMenuSubject(null); };

    const openCreate = () => {
        setEditTarget(null);
        setForm({ subjectCode: '', subjectName: '', description: '' });
        setFormError('');
        setDialogOpen(true);
    };

    const openEdit = (s: SubjectResponse) => {
        setEditTarget(s);
        setForm({ subjectCode: s.subjectCode, subjectName: s.subjectName, description: s.description ?? '' });
        setFormError('');
        setDialogOpen(true);
        handleMenuClose();
    };

    const handleSave = async () => {
        if (!form.subjectCode.trim()) { setFormError('Mã môn không được để trống'); return; }
        if (!form.subjectName.trim()) { setFormError('Tên môn không được để trống'); return; }
        setSaving(true);
        setFormError('');
        try {
            if (editTarget) {
                await subjectService.updateSubject(editTarget.id, form);
                toast.success(`Đã cập nhật môn học ${form.subjectCode}`);
            } else {
                await subjectService.createSubject(form);
                toast.success(`Tạo môn học ${form.subjectCode} thành công!`);
            }
            setDialogOpen(false);
            invalidate();
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await subjectService.deleteSubject(deleteTarget.id);
            toast.success(`Đã xóa môn học ${deleteTarget.subjectCode}`);
            setDeleteTarget(null);
            invalidate();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Không thể xóa môn học');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <MenuBookIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Danh mục môn học</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>Quản lý danh mục môn học trong hệ thống</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                        sx={{ borderRadius: 2.5, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
                        Thêm môn học
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Tổng môn học', value: subjects.length, icon: <MenuBookIcon /> },
                        { label: 'Đang hoạt động', value: activeCount, icon: <CheckCircleIcon /> },
                    ].map((s) => (
                        <Box key={s.label} sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 2.5, px: 2.5, py: 1.5, minWidth: 130, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {React.cloneElement(s.icon, { sx: { fontSize: 18, opacity: 0.8 } })}
                                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>{s.label}</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{loading ? '' : s.value}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Card sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TextField size="small" placeholder="Tìm kiếm theo mã hoặc tên môn học..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 320 }, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' }, '&.Mui-focused': { bgcolor: '#fff' } } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }} /></InputAdornment> }} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{filtered.length} kết quả</Typography>
            </Card>

            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
                                {['', '#', 'Mã môn học', 'Tên môn học', 'Mô tả', 'Trạng thái', ''].map((col, i) => (
                                    <TableCell key={i}
                                        sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', ...(col === '' && i === 0 ? { width: 44, p: 0 } : col === '#' ? { width: 50 } : col === '' ? { width: 60 } : {}) }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <MenuBookIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                        <Typography variant="body1" fontWeight={500}>
                                            {searchTerm ? 'Không tìm thấy môn học phù hợp' : 'Chưa có môn học nào'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((s, i) => {
                                const isExpanded = expandedIds.has(s.id);
                                const subjectClasses = classesBySubject.get(s.id) ?? [];
                                return (
                                    <React.Fragment key={s.id}>
                                        <TableRow hover sx={{ '&:nth-of-type(even)': { bgcolor: '#FAFBFC' }, '&:hover': { bgcolor: '#F1F5F9' }, cursor: 'pointer' }}
                                            onClick={() => toggleExpand(s.id)}>
                                            <TableCell sx={{ p: 0, pl: 0.5 }}>
                                                <IconButton size="small" sx={{ color: '#94A3B8' }}>
                                                    {isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell sx={{ color: '#94A3B8' }}>{i + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip label={s.subjectCode} size="small"
                                                        sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: 1.5 }} />
                                                    {subjectClasses.length > 0 && (
                                                        <Chip label={`${subjectClasses.length} lớp`} size="small"
                                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#DBEAFE', color: '#2563EB', borderRadius: 1 }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: '#1E293B' }}>{s.subjectName}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary"
                                                    sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.description ?? <em style={{ color: '#94A3B8' }}>Chưa có mô tả</em>}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={s.active ? 'Đang hoạt động' : 'Đã ẩn'}
                                                    size="small"
                                                    icon={s.active
                                                        ? <CheckCircleIcon sx={{ color: '#16A34A !important' }} />
                                                        : <BlockIcon sx={{ color: '#94A3B8 !important' }} />}
                                                    sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: s.active ? '#F0FDF4' : '#F1F5F9', color: s.active ? '#16A34A' : '#94A3B8', borderRadius: 1.5 }} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Tooltip title="Tùy chọn">
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, s)}
                                                        sx={{ color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9', color: '#475569' } }}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>

                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                    <Box sx={{ bgcolor: '#F8FAFC', borderLeft: '3px solid #10B981', mx: 2, my: 1, borderRadius: 2, overflow: 'hidden' }}>
                                                        {subjectClasses.length === 0 ? (
                                                            <Box sx={{ py: 2.5, px: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#94A3B8' }}>
                                                                <SchoolIcon sx={{ fontSize: 20 }} />
                                                                <Typography variant="body2">Chưa có lớp nào sử dụng môn học này</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow sx={{ bgcolor: '#ECFDF5' }}>
                                                                        {['Mã lớp', 'Giảng viên', 'Số SV', 'Trạng thái'].map((h) => (
                                                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#059669', fontSize: '0.74rem', py: 1 }}>{h}</TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {subjectClasses.map((c) => (
                                                                        <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                                            <TableCell>
                                                                                <Chip label={c.classCode} size="small"
                                                                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569', borderRadius: 1 }} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {c.lecturerName ?? <em style={{ color: '#94A3B8' }}>Chưa gán</em>}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Chip label={c.totalStudents} size="small"
                                                                                    sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#DBEAFE', color: '#2563EB', borderRadius: 1 }} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Chip label={c.active ? 'Hoạt động' : 'Không HĐ'} size="small"
                                                                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: c.active ? '#F0FDF4' : '#FEF2F2', color: c.active ? '#16A34A' : '#DC2626', borderRadius: 1 }} />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2.5, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider', mt: 0.5 } }}>
                <MenuItem onClick={() => menuSubject && openEdit(menuSubject)} sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#3B82F6' }} /></ListItemIcon>
                    <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { if (menuSubject) setDeleteTarget(menuSubject); handleMenuClose(); }}
                    sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5, color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
                    <ListItemText primary="Xóa môn học" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
            </Menu>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {editTarget ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
                </DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField label="Mã môn học *" fullWidth value={form.subjectCode}
                            onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
                            placeholder="Ví dụ: SE101"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Tên môn học *" fullWidth value={form.subjectName}
                            onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                            placeholder="Ví dụ: Software Engineering"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Mô tả" fullWidth multiline rows={3} value={form.description ?? ''}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Mô tả về môn học..."
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave}
                        disabled={saving || !form.subjectCode.trim() || !form.subjectName.trim()}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {saving ? 'Đang lưu...' : editTarget ? 'Lưu thay đổi' : 'Thêm môn học'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xác nhận xóa"
                message={<>Bạn có chắc chắn muốn xóa môn học <strong>{deleteTarget?.subjectName} ({deleteTarget?.subjectCode})</strong>?</>}
                severity="error"
                confirmLabel="Xóa môn học"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </Box>
    );
};

export default SubjectManagement;