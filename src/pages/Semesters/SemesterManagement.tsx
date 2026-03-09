import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Card, IconButton, Chip, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Alert,
    Skeleton, CircularProgress, InputAdornment, Menu, MenuItem,
    ListItemIcon, ListItemText, Divider, Collapse, Avatar,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SchoolIcon from '@mui/icons-material/School';
import classService from '../../api/services/classService';
import { semesterService } from '../../api/services/classService';
import type { SemesterResponse, SemesterRequest, ClassResponse } from '../../types/class.types';

/** yyyy-mm-dd → dd/mm/yy */
function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y.slice(2)}`;
}

const SemesterManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<SemesterResponse | null>(null);
    const [form, setForm] = useState<SemesterRequest>({ name: '', startDate: null, endDate: null });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [endDateError, setEndDateError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<SemesterResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    // ── Cached parallel queries ──
    const { data: semesters = [], isLoading: semLoading, error: semError } = useQuery({
        queryKey: ['admin', 'semesters'],
        queryFn: async () => { const r = await semesterService.getAllSemesters(); return (r.data.data ?? []) as SemesterResponse[]; },
    });
    const { data: allClasses = [], isLoading: classesLoading } = useQuery({
        queryKey: ['admin', 'classes'],
        queryFn: async () => { const r = await classService.getClasses(); return (r.data.data ?? []) as ClassResponse[]; },
    });
    const loading = semLoading || classesLoading;
    const error = semError ? 'Không thể tải dữ liệu' : '';
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

    const classesBySemester = useMemo(() => {
        const map = new Map<number, ClassResponse[]>();
        allClasses.forEach((c) => {
            if (c.semesterId != null) {
                if (!map.has(c.semesterId)) map.set(c.semesterId, []);
                map.get(c.semesterId)!.push(c);
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

    // Seed defaults
    const [seedOpen, setSeedOpen] = useState(false);
    const [seedYear, setSeedYear] = useState(new Date().getFullYear().toString());
    const [seeding, setSeeding] = useState(false);
    const [seedError, setSeedError] = useState('');

    const DEFAULT_SEMESTERS = (year: string) => [
        { name: `Spring ${year}`, startDate: `${year}-01-01`, endDate: `${year}-04-30` },
        { name: `Summer ${year}`, startDate: `${year}-05-01`, endDate: `${year}-08-31` },
        { name: `Fall ${year}`, startDate: `${year}-09-01`, endDate: `${year}-12-31` },
    ];

    const handleSeed = async () => {
        const y = parseInt(seedYear, 10);
        if (!seedYear || isNaN(y) || y < 2000 || y > 2100) { setSeedError('Năm không hợp lệ'); return; }
        setSeeding(true);
        setSeedError('');
        try {
            for (const s of DEFAULT_SEMESTERS(seedYear)) {
                await semesterService.createSemester(s);
            }
            setSeedOpen(false);
            invalidate();
        } catch (e: any) {
            setSeedError(e?.response?.data?.message ?? 'Một số học kỳ đã tồn tại hoặc có lỗi xảy ra');
        } finally {
            setSeeding(false);
        }
    };

    // 3-dot menu
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuTarget, setMenuTarget] = useState<SemesterResponse | null>(null);

    const filtered = useMemo(() =>
        semesters.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [semesters, searchTerm]
    );

    const activeCount = useMemo(() => semesters.filter((s) => s.active).length, [semesters]);

    const validateDates = (start: string | null, end: string | null): string => {
        if (start && end && end <= start) return 'Ngày kết thúc phải sau ngày bắt đầu';
        return '';
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, s: SemesterResponse) => {
        setMenuAnchor(e.currentTarget);
        setMenuTarget(s);
    };
    const handleMenuClose = () => { setMenuAnchor(null); };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', startDate: null, endDate: null });
        setFormError('');
        setEndDateError('');
        setDialogOpen(true);
    };

    const openEdit = (s: SemesterResponse) => {
        setEditing(s);
        setForm({ name: s.name, startDate: s.startDate, endDate: s.endDate });
        setFormError('');
        setEndDateError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setFormError('Tên học kỳ không được để trống'); return; }
        const dateErr = validateDates(form.startDate, form.endDate);
        if (dateErr) { setEndDateError(dateErr); return; }
        setSaving(true);
        setFormError('');
        try {
            if (editing) {
                await semesterService.updateSemester(editing.id, form);
                toast.success(`Đã cập nhật học kỳ ${form.name}`);
            } else {
                await semesterService.createSemester(form);
                toast.success(`Tạo học kỳ ${form.name} thành công!`);
            }
            setDialogOpen(false);
            invalidate();
        } catch (e: any) {
            setFormError(e?.response?.data?.message ?? 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await semesterService.deleteSemester(deleteTarget.id);
            toast.success(`Đã xóa học kỳ ${deleteTarget.name}`);
            setDeleteTarget(null);
            invalidate();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Không thể xóa học kỳ');
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <CalendarMonthIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Quản lý học kỳ</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>Thêm, sửa, xóa các học kỳ trong hệ thống</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button variant="contained" startIcon={<AutoFixHighIcon />}
                            onClick={() => { setSeedYear(new Date().getFullYear().toString()); setSeedError(''); setSeedOpen(true); }}
                            sx={{ borderRadius: 2.5, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                            Tạo mặc định
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                            sx={{ borderRadius: 2.5, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
                            Thêm học kỳ
                        </Button>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Tổng học kỳ', value: semesters.length, icon: <CalendarMonthIcon /> },
                        { label: 'Đang hoạt động', value: activeCount, icon: <CheckCircleIcon /> },
                    ].map((s) => (
                        <Box key={s.label} sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 2.5, px: 2.5, py: 1.5, minWidth: 130, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {React.cloneElement(s.icon, { sx: { fontSize: 18, opacity: 0.8 } })}
                                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>{s.label}</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{loading ? '—' : s.value}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Search */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TextField size="small" placeholder="Tìm kiếm theo tên học kỳ..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 300, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' }, '&.Mui-focused': { bgcolor: '#fff' } } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }} /></InputAdornment> }} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{filtered.length} kết quả</Typography>
            </Card>

            {/* Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
                                {['', '#', 'Tên học kỳ', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trạng thái', ''].map((col, i) => (
                                    <TableCell key={i}
                                        sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', ...(col === '' && i === 0 ? { width: 44, p: 0 } : col === '#' ? { width: 50 } : col === '' ? { width: 60 } : {}) }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <CalendarMonthIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                        <Typography variant="body1" fontWeight={500}>
                                            {searchTerm ? 'Không tìm thấy học kỳ phù hợp' : 'Chưa có học kỳ nào. Bấm "Thêm học kỳ" để tạo mới.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((s, i) => {
                                const isExpanded = expandedIds.has(s.id);
                                const semClasses = classesBySemester.get(s.id) ?? [];
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Typography sx={{ fontWeight: 600, color: '#1E293B' }}>{s.name}</Typography>
                                                    {semClasses.length > 0 && (
                                                        <Chip label={`${semClasses.length} môn`} size="small"
                                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#DBEAFE', color: '#2563EB', borderRadius: 1 }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{formatDate(s.startDate)}</TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{formatDate(s.endDate)}</TableCell>
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

                                        {/* Expanded classes sub-row */}
                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                    <Box sx={{ bgcolor: '#F8FAFC', borderLeft: '3px solid #3B82F6', mx: 2, my: 1, borderRadius: 2, overflow: 'hidden' }}>
                                                        {semClasses.length === 0 ? (
                                                            <Box sx={{ py: 2.5, px: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#94A3B8' }}>
                                                                <SchoolIcon sx={{ fontSize: 20 }} />
                                                                <Typography variant="body2">Chưa có môn học nào thuộc học kỳ này</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow sx={{ bgcolor: '#EFF6FF' }}>
                                                                        {['Mã lớp', 'Tên môn học', 'Giảng viên', 'Số SV', 'Trạng thái'].map((h) => (
                                                                            <TableCell key={h} sx={{ fontWeight: 700, color: '#3B82F6', fontSize: '0.74rem', py: 1 }}>{h}</TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {semClasses.map((c) => (
                                                                        <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                                            <TableCell>
                                                                                <Chip label={c.classCode} size="small"
                                                                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569', borderRadius: 1 }} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                    <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#8B5CF6', borderRadius: 1 }}>
                                                                                        {(c.subjectName ?? c.classCode).substring(0, 2).toUpperCase()}
                                                                                    </Avatar>
                                                                                    <Typography variant="body2" fontWeight={600}>{c.subjectName ?? '—'}</Typography>
                                                                                </Box>
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

            {/* 3-dot Menu */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2.5, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider', mt: 0.5 } }}>
                <MenuItem onClick={() => { if (menuTarget) openEdit(menuTarget); handleMenuClose(); }}
                    sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#3B82F6' }} /></ListItemIcon>
                    <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { if (menuTarget) setDeleteTarget(menuTarget); handleMenuClose(); }}
                    sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5, color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
                    <ListItemText primary="Xóa học kỳ" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
            </Menu>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editing ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        {formError && <Alert severity="error">{formError}</Alert>}
                        <TextField label="Tên học kỳ *" fullWidth value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ví dụ: Spring 2026"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Ngày bắt đầu" type="date" fullWidth
                            value={form.startDate ?? ''}
                            onChange={(e) => {
                                const start = e.target.value || null;
                                setForm((f) => ({ ...f, startDate: start }));
                                setEndDateError(validateDates(start, form.endDate));
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Ngày kết thúc" type="date" fullWidth
                            value={form.endDate ?? ''}
                            onChange={(e) => {
                                const end = e.target.value || null;
                                setForm((f) => ({ ...f, endDate: end }));
                                setEndDateError(validateDates(form.startDate, end));
                            }}
                            error={!!endDateError}
                            helperText={endDateError || ' '}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {saving ? <CircularProgress size={18} /> : (editing ? 'Lưu' : 'Tạo')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography>Bạn có chắc muốn xóa học kỳ <strong>{deleteTarget?.name}</strong>?</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {deleting ? <CircularProgress size={18} /> : 'Xóa'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Seed Defaults Dialog */}
            <Dialog open={seedOpen} onClose={() => setSeedOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoFixHighIcon sx={{ color: '#10B981' }} />
                        Tạo học kỳ mặc định
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {seedError && <Alert severity="warning">{seedError}</Alert>}
                        <TextField label="Năm *" fullWidth value={seedYear} type="number"
                            onChange={(e) => setSeedYear(e.target.value)}
                            inputProps={{ min: 2000, max: 2100 }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, border: '1px solid #E2E8F0' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Sẽ tạo 3 học kỳ:
                            </Typography>
                            {DEFAULT_SEMESTERS(seedYear).map((s) => (
                                <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{formatDate(s.startDate)} → {formatDate(s.endDate)}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setSeedOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSeed} disabled={seeding}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
                        {seeding ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Tạo tất cả'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SemesterManagement;
