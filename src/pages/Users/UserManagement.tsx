import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    Switch,
    Alert,
    Skeleton,
    Tooltip,
    Card,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';
import adminService from '../../api/services/adminService';
import type { UserResponse, CreateUserRequest } from '../../api/types/types';

const ROLE_LABELS: Record<string, { label: string; color: 'error' | 'primary' | 'warning' | 'info' | 'default' }> = {
    ADMIN: { label: 'Admin', color: 'error' },
    LECTURER: { label: 'Giảng viên', color: 'primary' },
    TEAMLEADER: { label: 'Trưởng nhóm', color: 'warning' },
    TEAMMEMBER: { label: 'Thành viên', color: 'info' },
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Create User Dialog
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newUser, setNewUser] = useState<CreateUserRequest>({
        email: '',
        password: '',
        fullName: '',
        role: 'LECTURER',
    });

    // Delete Dialog
    const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminService.getUsers();
            setUsers(res.data.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Create User
    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.fullName) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            setCreating(true);
            await adminService.createUser(newUser);
            toast.success('Tạo tài khoản thành công!');
            setOpenCreate(false);
            setNewUser({ email: '', password: '', fullName: '', role: 'LECTURER' });
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo tài khoản thất bại');
        } finally {
            setCreating(false);
        }
    };

    // Toggle Status
    const handleToggleStatus = async (user: UserResponse) => {
        try {
            await adminService.updateUserStatus(user.userId, !user.active);
            toast.success(
                user.active ? `Đã khóa tài khoản ${user.fullName}` : `Đã kích hoạt tài khoản ${user.fullName}`
            );
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    // Delete User
    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await adminService.deleteUser(deleteTarget.userId);
            toast.success(`Đã xóa tài khoản ${deleteTarget.fullName}`);
            setDeleteTarget(null);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa tài khoản thất bại');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Quản lý tài khoản
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {users.length} tài khoản trong hệ thống
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpenCreate(true)}
                    sx={{ borderRadius: 2, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                    Thêm tài khoản
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Vai trò</InputLabel>
                    <Select
                        value={roleFilter}
                        label="Vai trò"
                        onChange={(e) => setRoleFilter(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="ALL">Tất cả</MenuItem>
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="LECTURER">Giảng viên</MenuItem>
                        <MenuItem value="TEAMLEADER">Trưởng nhóm</MenuItem>
                        <MenuItem value="TEAMMEMBER">Thành viên</MenuItem>
                    </Select>
                </FormControl>
            </Card>

            {/* Users Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Vai trò</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        {searchTerm || roleFilter !== 'ALL'
                                            ? 'Không tìm thấy tài khoản phù hợp'
                                            : 'Chưa có tài khoản nào'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <TableRow
                                        key={user.userId}
                                        hover
                                        sx={{
                                            '&:last-child td': { border: 0 },
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{user.fullName}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ROLE_LABELS[user.role]?.label || user.role}
                                                size="small"
                                                color={ROLE_LABELS[user.role]?.color || 'default'}
                                                variant="outlined"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={user.active ? 'Nhấn để khóa' : 'Nhấn để kích hoạt'}>
                                                <Switch
                                                    checked={user.active}
                                                    onChange={() => handleToggleStatus(user)}
                                                    color="success"
                                                    size="small"
                                                    disabled={user.role === 'ADMIN'}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Xóa tài khoản">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteTarget(user)}
                                                        disabled={user.role === 'ADMIN'}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ================ CREATE USER DIALOG ================ */}
            <Dialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Thêm tài khoản mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField
                            label="Họ tên"
                            fullWidth
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Mật khẩu"
                            type="password"
                            fullWidth
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Vai trò</InputLabel>
                            <Select
                                value={newUser.role}
                                label="Vai trò"
                                onChange={(e) =>
                                    setNewUser({ ...newUser, role: e.target.value as CreateUserRequest['role'] })
                                }
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="LECTURER">Giảng viên</MenuItem>
                                <MenuItem value="TEAMLEADER">Trưởng nhóm</MenuItem>
                                <MenuItem value="TEAMMEMBER">Thành viên</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={() => setOpenCreate(false)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateUser}
                        disabled={creating}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ================ DELETE CONFIRM DIALOG ================ */}
            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn xóa tài khoản{' '}
                        <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.email})?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        Hành động này không thể hoàn tác.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={() => setDeleteTarget(null)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteUser}
                        disabled={deleting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        {deleting ? 'Đang xóa...' : 'Xóa tài khoản'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
