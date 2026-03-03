import React from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, TextField,
    InputAdornment, Alert, Skeleton, Tooltip, Typography,
    Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
    Divider, Card, Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import CreateClassDialog from './components/CreateClassDialog';
import EditClassDialog from './components/EditClassDialog';
import AssignLecturerDialog from './components/AssignLecturerDialog';
import ManageStudentsDialog from './components/ManageStudentsDialog';
import { useClassManagement } from './hooks/useClassManagement';

const CLASS_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#14B8A6', '#EF4444'];
const getColor = (name: string) => CLASS_COLORS[Math.abs([...name].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) % CLASS_COLORS.length];

const ClassManagement: React.FC = () => {
    const h = useClassManagement();

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <SchoolIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Quản lý lớp học</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>Quản lý lớp học, giảng viên và sinh viên trong hệ thống</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => h.setOpenCreate(true)}
                        sx={{ borderRadius: 2.5, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
                        Tạo lớp học
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    {[{ label: 'Tổng lớp', value: h.classes.length, icon: <ClassIcon /> }, { label: 'Hoạt động', value: h.activeCount, icon: <CheckCircleIcon /> }, { label: 'Tổng SV', value: h.totalStudents, icon: <PeopleIcon /> }].map((s) => (
                        <Box key={s.label} sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 2.5, px: 2.5, py: 1.5, minWidth: 130, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {React.cloneElement(s.icon, { sx: { fontSize: 18, opacity: 0.8 } })}
                                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>{s.label}</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight={800}>{h.loading ? '—' : s.value}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {h.error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{h.error}</Alert>}

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TextField size="small" placeholder="Tìm kiếm theo tên hoặc mã lớp..." value={h.searchTerm} onChange={(e) => h.setSearchTerm(e.target.value)}
                    sx={{ minWidth: 300, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' }, '&.Mui-focused': { bgcolor: '#fff' } } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }} /></InputAdornment> }} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{h.filtered.length} kết quả</Typography>
            </Card>

            {/* Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
                                {['#', 'Lớp học', 'Học kỳ', 'Giảng viên', 'SV', 'Trạng thái', ''].map((col, i) => (
                                    <TableCell key={i} align={['SV', 'Trạng thái'].includes(col) ? 'center' : 'left'}
                                        sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', ...(col === '#' ? { width: 50 } : col === '' ? { width: 60 } : {}) }}>{col}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {h.loading ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                            )) : h.filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <SchoolIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                    <Typography variant="body1" fontWeight={500}>{h.searchTerm ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp nào'}</Typography>
                                </TableCell></TableRow>
                            ) : h.filtered.map((cls, i) => (
                                <TableRow key={cls.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#FAFBFC' }, '&:hover': { bgcolor: '#F1F5F9' } }}>
                                    <TableCell sx={{ color: '#94A3B8' }}>{i + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ width: 40, height: 40, bgcolor: getColor(cls.className), fontSize: '0.85rem', fontWeight: 700, borderRadius: 2 }}>
                                                {cls.className.substring(0, 2).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: '#1E293B' }}>{cls.className}</Typography>
                                                <Chip label={cls.classCode} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#64748B', borderRadius: 1 }} />
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell><Chip label={cls.semester} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: 1.5 }} /></TableCell>
                                    <TableCell>
                                        {cls.lecturerName ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#8B5CF6' }}>{cls.lecturerName.charAt(0)}</Avatar>
                                                <Typography variant="body2" fontWeight={500}>{cls.lecturerName}</Typography>
                                            </Box>
                                        ) : <Chip label="Chưa gán" size="small" sx={{ fontWeight: 500, fontSize: '0.72rem', bgcolor: '#FEF3C7', color: '#D97706', borderRadius: 1.5 }} />}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Quản lý sinh viên">
                                            <Chip label={cls.totalStudents} size="small" onClick={() => h.setStudentTarget(cls)}
                                                icon={<PeopleIcon sx={{ fontSize: '14px !important', color: '#3B82F6 !important' }} />}
                                                sx={{ fontWeight: 700, fontSize: '0.8rem', bgcolor: '#DBEAFE', color: '#2563EB', borderRadius: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#BFDBFE' } }} />
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={cls.active ? 'Hoạt động' : 'Không HĐ'} size="small"
                                            icon={cls.active ? <CheckCircleIcon sx={{ color: '#16A34A !important' }} /> : <BlockIcon sx={{ color: '#DC2626 !important' }} />}
                                            sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: cls.active ? '#F0FDF4' : '#FEF2F2', color: cls.active ? '#16A34A' : '#DC2626', borderRadius: 1.5 }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Tùy chọn">
                                            <IconButton size="small" onClick={(e) => h.handleMenuOpen(e, cls)} sx={{ color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9', color: '#475569' } }}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Actions Menu */}
            <Menu anchorEl={h.menuAnchor} open={Boolean(h.menuAnchor)} onClose={h.handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2.5, minWidth: 220, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider', mt: 0.5 } }}>
                <MenuItem onClick={() => { if (h.menuClass) h.setStudentTarget(h.menuClass); h.handleMenuClose(); }} sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon><PeopleIcon fontSize="small" sx={{ color: '#10B981' }} /></ListItemIcon>
                    <ListItemText primary="Quản lý sinh viên" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem onClick={() => { if (h.menuClass) h.setAssignTarget(h.menuClass); h.handleMenuClose(); }} sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#8B5CF6' }} /></ListItemIcon>
                    <ListItemText primary="Gán giảng viên" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem onClick={() => { if (h.menuClass) h.setEditTarget(h.menuClass); h.handleMenuClose(); }} sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#3B82F6' }} /></ListItemIcon>
                    <ListItemText primary="Chỉnh sửa lớp" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { if (h.menuClass) h.setDeleteTarget(h.menuClass); h.handleMenuClose(); }}
                    sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5, color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
                    <ListItemText primary="Xóa lớp học" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
            </Menu>

            {/* Dialogs */}
            <CreateClassDialog open={h.openCreate} onClose={() => h.setOpenCreate(false)} onCreated={() => h.setOpenCreate(false)} onSubmit={h.handleCreate} lecturers={h.lecturers} />
            <EditClassDialog target={h.editTarget} onClose={() => h.setEditTarget(null)} onSubmit={h.handleEdit} />
            <AssignLecturerDialog target={h.assignTarget} lecturers={h.lecturers} onClose={() => h.setAssignTarget(null)} onSubmit={h.handleAssign} />
            <ManageStudentsDialog target={h.studentTarget} allUsers={h.allUsers} onClose={() => h.setStudentTarget(null)} onRefresh={h.fetchData} />

            <ConfirmDialog open={!!h.deleteTarget} title="Xác nhận xóa"
                message={<>Bạn có chắc chắn muốn xóa lớp <strong>{h.deleteTarget?.className} ({h.deleteTarget?.classCode})</strong>?</>}
                severity="error" confirmLabel="Xóa lớp" loading={h.deleting}
                onConfirm={h.handleDelete} onCancel={() => h.setDeleteTarget(null)} />
        </Box>
    );
};

export default ClassManagement;
