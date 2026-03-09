import React from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, TextField, Select,
    MenuItem, FormControl, InputLabel, InputAdornment, Alert,
    Skeleton, Tooltip, Card, Avatar, Menu, ListItemIcon,
    ListItemText, Divider, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import CreateUserDialog from './components/CreateUserDialog';
import EditUserDialog from './components/EditUserDialog';
import ImportUsersDialog from './components/ImportUsersDialog';
import { useUserManagement } from './hooks/useUserManagement';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN: { label: 'Admin', color: '#DC2626', bg: '#FEE2E2' },
    LECTURER: { label: 'Giảng viên', color: '#7C3AED', bg: '#EDE9FE' },
    TEAMLEADER: { label: 'Trưởng nhóm', color: '#D97706', bg: '#FEF3C7' },
    TEAMMEMBER: { label: 'Thành viên', color: '#2563EB', bg: '#DBEAFE' },
};

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#14B8A6', '#EF4444'];

const getColor = (name: string) => AVATAR_COLORS[Math.abs([...name].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) % AVATAR_COLORS.length];
const getInitials = (name: string) => { const p = name.trim().split(/\s+/); return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase(); };

const UserManagement: React.FC = () => {
    const h = useUserManagement();
    const [importOpen, setImportOpen] = React.useState(false);

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <PeopleAltIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Quản lý tài khoản</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>Quản lý tất cả tài khoản người dùng trong hệ thống</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button variant="contained" startIcon={<FileUploadIcon />} onClick={() => setImportOpen(true)}
                            sx={{ borderRadius: 2.5, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            Import Excel
                        </Button>
                        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => h.setOpenCreate(true)}
                            sx={{ borderRadius: 2.5, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
                            Thêm tài khoản
                        </Button>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    {[{ label: 'Tổng', value: h.users.length, icon: <PeopleAltIcon /> }, { label: 'Hoạt động', value: h.activeCount, icon: <CheckCircleIcon /> }, { label: 'Đã khóa', value: h.inactiveCount, icon: <BlockIcon /> }].map((s) => (
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
                <TextField size="small" placeholder="Tìm kiếm theo tên hoặc email..." value={h.searchTerm} onChange={(e) => h.setSearchTerm(e.target.value)}
                    sx={{ minWidth: 300, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' }, '&.Mui-focused': { bgcolor: '#fff' } } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }} /></InputAdornment> }} />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Vai trò</InputLabel>
                    <Select value={h.roleFilter} label="Vai trò" onChange={(e) => h.setRoleFilter(e.target.value)} sx={{ borderRadius: 2.5, bgcolor: '#F8FAFC' }}>
                        <MenuItem value="ALL">Tất cả</MenuItem>
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="LECTURER">Giảng viên</MenuItem>
                        <MenuItem value="TEAMLEADER">Trưởng nhóm</MenuItem>
                        <MenuItem value="TEAMMEMBER">Thành viên</MenuItem>
                    </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{h.filteredUsers.length} kết quả</Typography>
            </Card>

            {/* Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
                                {['#', 'Người dùng', 'Vai trò', 'Trạng thái', ''].map((col, i) => (
                                    <TableCell key={i} align={col === 'Trạng thái' ? 'center' : 'left'}
                                        sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', ...(col === '#' ? { width: 50 } : col === '' ? { width: 60 } : {}) }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {h.loading ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell><Skeleton width={20} /></TableCell><TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Skeleton variant="circular" width={40} height={40} /><Box><Skeleton width={130} /><Skeleton width={180} height={16} /></Box></Box></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell align="center"><Skeleton width={70} sx={{ mx: 'auto' }} /></TableCell><TableCell><Skeleton width={24} /></TableCell></TableRow>
                            )) : h.filteredUsers.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <SearchIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                    <Typography variant="body1" fontWeight={500}>{h.searchTerm || h.roleFilter !== 'ALL' ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản nào'}</Typography>
                                </TableCell></TableRow>
                            ) : h.filteredUsers.map((user, i) => (
                                <TableRow key={user.userId} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#FAFBFC' }, '&:hover': { bgcolor: '#F1F5F9' } }}>
                                    <TableCell sx={{ color: '#94A3B8' }}>{i + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ position: 'relative' }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: getColor(user.fullName), fontSize: '0.88rem', fontWeight: 700 }}>{getInitials(user.fullName)}</Avatar>
                                                <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', bgcolor: user.active ? '#22C55E' : '#CBD5E1', border: '2px solid #fff' }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: '#1E293B' }}>{user.fullName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>{user.email}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={ROLE_LABELS[user.role]?.label || user.role} size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: ROLE_LABELS[user.role]?.bg, color: ROLE_LABELS[user.role]?.color, borderRadius: 1.5 }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={user.active ? 'Hoạt động' : 'Đã khóa'} size="small"
                                            icon={user.active ? <CheckCircleIcon sx={{ color: '#16A34A !important' }} /> : <BlockIcon sx={{ color: '#DC2626 !important' }} />}
                                            sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: user.active ? '#F0FDF4' : '#FEF2F2', color: user.active ? '#16A34A' : '#DC2626', borderRadius: 1.5 }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Tùy chọn">
                                            <IconButton size="small" onClick={(e) => h.handleMenuOpen(e, user)} sx={{ color: '#94A3B8', '&:hover': { bgcolor: '#F1F5F9', color: '#475569' } }}>
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
                PaperProps={{ sx: { borderRadius: 2.5, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider', mt: 0.5 } }}>
                <MenuItem onClick={() => { if (h.menuUser) h.setEditTarget(h.menuUser); h.handleMenuClose(); }} sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#3B82F6' }} /></ListItemIcon>
                    <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem onClick={() => { if (h.menuUser) h.setToggleTarget(h.menuUser); h.handleMenuClose(); }} disabled={h.menuUser?.role === 'ADMIN'} sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5 }}>
                    <ListItemIcon>{h.menuUser?.active ? <LockIcon fontSize="small" sx={{ color: '#D97706' }} /> : <LockOpenIcon fontSize="small" sx={{ color: '#16A34A' }} />}</ListItemIcon>
                    <ListItemText primary={h.menuUser?.active ? 'Khóa tài khoản' : 'Kích hoạt'} primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { if (h.menuUser) h.setDeleteTarget(h.menuUser); h.handleMenuClose(); }} disabled={h.menuUser?.role === 'ADMIN'}
                    sx={{ py: 1.2, borderRadius: 1.5, mx: 0.5, color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
                    <ListItemText primary="Xóa tài khoản" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </MenuItem>
            </Menu>

            {/* Dialogs */}
            <CreateUserDialog open={h.openCreate} onClose={() => h.setOpenCreate(false)} onSubmit={h.handleCreateUser} />
            <EditUserDialog open={!!h.editTarget} user={h.editTarget} onClose={() => h.setEditTarget(null)} onSubmit={h.handleEditUser} />
            <ImportUsersDialog open={importOpen} onClose={() => setImportOpen(false)} onSuccess={h.fetchUsers} />

            <ConfirmDialog open={!!h.toggleTarget} title={h.toggleTarget?.active ? 'Xác nhận khóa tài khoản' : 'Xác nhận kích hoạt'}
                message={<>Bạn có chắc chắn muốn {h.toggleTarget?.active ? 'khóa' : 'kích hoạt'} tài khoản <strong>{h.toggleTarget?.fullName}</strong>?</>}
                severity="warning" confirmLabel={h.toggleTarget?.active ? 'Khóa tài khoản' : 'Kích hoạt'}
                onConfirm={h.handleToggleStatus} onCancel={() => h.setToggleTarget(null)} />

            <ConfirmDialog open={!!h.deleteTarget} title="Xác nhận xóa"
                message={<>Bạn có chắc chắn muốn xóa tài khoản <strong>{h.deleteTarget?.fullName}</strong> ({h.deleteTarget?.email})?</>}
                severity="error" confirmLabel="Xóa tài khoản" loading={h.deleting}
                onConfirm={h.handleDeleteUser} onCancel={() => h.setDeleteTarget(null)} />
        </Box>
    );
};

export default UserManagement;
