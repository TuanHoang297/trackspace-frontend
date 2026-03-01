import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, TextField,
    InputAdornment, Alert, Skeleton, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import { toast } from 'react-toastify';
import classService from '../../api/services/classService';
import adminService from '../../api/services/adminService';
import type { ClassResponse } from '../../types/class.types';
import type { UserResponse } from '../../types/auth.types';
import CreateClassDialog from './components/CreateClassDialog';
import EditClassDialog from './components/EditClassDialog';
import AssignLecturerDialog from './components/AssignLecturerDialog';
import ManageStudentsDialog from './components/ManageStudentsDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader/PageHeader';

const ClassManagement: React.FC = () => {
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog state
    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<ClassResponse | null>(null);
    const [assignTarget, setAssignTarget] = useState<ClassResponse | null>(null);
    const [studentTarget, setStudentTarget] = useState<ClassResponse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ClassResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const lecturers = useMemo(() => allUsers.filter(u => u.role === 'LECTURER'), [allUsers]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [classesRes, usersRes] = await Promise.all([
                classService.getClasses(),
                adminService.getUsers(),
            ]);
            setClasses(classesRes.data.data);
            setAllUsers(usersRes.data.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = classes.filter(c =>
        c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.classCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async (data: any) => {
        await classService.createClass(data);
        toast.success('Tạo lớp học thành công!');
        fetchData();
    };

    const handleEdit = async (classId: number, data: any) => {
        await classService.updateClass(classId, data);
        toast.success('Cập nhật lớp học thành công!');
        fetchData();
    };

    const handleAssign = async (classId: number, lecturerId: number) => {
        await classService.assignLecturer(classId, lecturerId);
        toast.success('Gán giảng viên thành công!');
        fetchData();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await classService.deleteClass(deleteTarget.id);
            toast.success(`Đã xóa lớp ${deleteTarget.className}`);
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa lớp thất bại');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Quản lý lớp học"
                subtitle={`${classes.length} lớp học trong hệ thống`}
                actionLabel="Tạo lớp học"
                onAction={() => setOpenCreate(true)}
            />

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <TextField size="small" placeholder="Tìm kiếm theo tên hoặc mã lớp..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
            </Card>

            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                {['#', 'Tên lớp', 'Mã lớp', 'Học kỳ', 'Giảng viên', 'SV', 'Trạng thái', 'Hành động'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700 }} align={['SV', 'Trạng thái', 'Hành động'].includes(h) ? 'center' : 'left'}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        {searchTerm ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học nào'}
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((cls, i) => (
                                <TableRow key={cls.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{cls.className}</TableCell>
                                    <TableCell><Chip label={cls.classCode} size="small" variant="outlined" /></TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{cls.semester}</TableCell>
                                    <TableCell>
                                        {cls.lecturerName ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PersonIcon fontSize="small" color="primary" />
                                                <Typography variant="body2">{cls.lecturerName}</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa gán</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={cls.totalStudents} size="small" color="primary" variant="outlined"
                                            sx={{ cursor: 'pointer' }} onClick={() => setStudentTarget(cls)} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={cls.active ? 'Active' : 'Inactive'} size="small"
                                            color={cls.active ? 'success' : 'default'} sx={{ fontWeight: 500 }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Quản lý sinh viên">
                                                <IconButton size="small" color="success" onClick={() => setStudentTarget(cls)}>
                                                    <PeopleIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Gán giảng viên">
                                                <IconButton size="small" color="primary" onClick={() => setAssignTarget(cls)}>
                                                    <PersonIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Sửa">
                                                <IconButton size="small" color="info" onClick={() => setEditTarget(cls)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(cls)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Dialogs */}
            <CreateClassDialog open={openCreate} onClose={() => setOpenCreate(false)}
                onCreated={() => setOpenCreate(false)} onSubmit={handleCreate} />

            <EditClassDialog target={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />

            <AssignLecturerDialog target={assignTarget} lecturers={lecturers}
                onClose={() => setAssignTarget(null)} onSubmit={handleAssign} />

            <ManageStudentsDialog target={studentTarget} allUsers={allUsers}
                onClose={() => setStudentTarget(null)} onRefresh={fetchData} />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xác nhận xóa"
                message={<>Bạn có chắc chắn muốn xóa lớp <strong>{deleteTarget?.className} ({deleteTarget?.classCode})</strong>?</>}
                confirmLabel="Xóa lớp"
                severity="error"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </Box>
    );
};

export default ClassManagement;
