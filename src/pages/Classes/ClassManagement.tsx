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
    Alert,
    Skeleton,
    Tooltip,
    Card,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { toast } from 'react-toastify';
import classService from '../../api/services/classService';
import adminService from '../../api/services/adminService';
import type {
    ClassResponse,
    CreateClassRequest,
    UpdateClassRequest,
    UserResponse,
    StudentInClassResponse,
} from '../../api/types/types';

const ClassManagement: React.FC = () => {
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [lecturers, setLecturers] = useState<UserResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Create Dialog
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newClass, setNewClass] = useState<CreateClassRequest>({
        className: '',
        classCode: '',
        semester: '',
    });

    // Edit Dialog
    const [editTarget, setEditTarget] = useState<ClassResponse | null>(null);
    const [editData, setEditData] = useState<UpdateClassRequest>({});
    const [editing, setEditing] = useState(false);

    // Assign Lecturer Dialog
    const [assignTarget, setAssignTarget] = useState<ClassResponse | null>(null);
    const [selectedLecturer, setSelectedLecturer] = useState<number | ''>('');
    const [assigning, setAssigning] = useState(false);

    // Delete Dialog
    const [deleteTarget, setDeleteTarget] = useState<ClassResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ===== STUDENT MANAGEMENT DIALOG =====
    const [studentTarget, setStudentTarget] = useState<ClassResponse | null>(null);
    const [students, setStudents] = useState<StudentInClassResponse[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
    const [addingStudent, setAddingStudent] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [classesRes, usersRes] = await Promise.all([
                classService.getClasses(),
                adminService.getUsers(),
            ]);
            setClasses(classesRes.data.data);
            const users = usersRes.data.data;
            setAllUsers(users);
            setLecturers(users.filter((u) => u.role === 'LECTURER'));
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredClasses = classes.filter(
        (c) =>
            c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.classCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Create
    const handleCreate = async () => {
        if (!newClass.className || !newClass.classCode || !newClass.semester) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            setCreating(true);
            await classService.createClass(newClass);
            toast.success('Tạo lớp học thành công!');
            setOpenCreate(false);
            setNewClass({ className: '', classCode: '', semester: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo lớp học thất bại');
        } finally {
            setCreating(false);
        }
    };

    // Edit
    const openEditDialog = (cls: ClassResponse) => {
        setEditTarget(cls);
        setEditData({ className: cls.className, semester: cls.semester, active: cls.active });
    };

    const handleEdit = async () => {
        if (!editTarget) return;
        try {
            setEditing(true);
            await classService.updateClass(editTarget.id, editData);
            toast.success('Cập nhật lớp học thành công!');
            setEditTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setEditing(false);
        }
    };

    // Assign Lecturer
    const openAssignDialog = (cls: ClassResponse) => {
        setAssignTarget(cls);
        setSelectedLecturer(cls.lecturerId || '');
    };

    const handleAssign = async () => {
        if (!assignTarget || !selectedLecturer) return;
        try {
            setAssigning(true);
            await classService.assignLecturer(assignTarget.id, selectedLecturer as number);
            toast.success('Gán giảng viên thành công!');
            setAssignTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gán giảng viên thất bại');
        } finally {
            setAssigning(false);
        }
    };

    // Delete
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

    // ===== STUDENT MANAGEMENT =====
    const openStudentDialog = async (cls: ClassResponse) => {
        setStudentTarget(cls);
        setLoadingStudents(true);
        try {
            const res = await classService.getStudents(cls.id);
            setStudents(res.data.data);
        } catch {
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleAddStudent = async () => {
        if (!studentTarget || !selectedUserId) return;
        try {
            setAddingStudent(true);
            await classService.addStudent(studentTarget.id, selectedUserId as number);
            toast.success('Thêm sinh viên vào lớp thành công!');
            setSelectedUserId('');
            // Refresh students list
            const res = await classService.getStudents(studentTarget.id);
            setStudents(res.data.data);
            fetchData(); // refresh class totalStudents count
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Thêm sinh viên thất bại');
        } finally {
            setAddingStudent(false);
        }
    };

    const handleRemoveStudent = async (student: StudentInClassResponse) => {
        if (!studentTarget) return;
        try {
            await classService.removeStudent(studentTarget.id, student.studentId);
            toast.success(`Đã xóa ${student.fullName} khỏi lớp`);
            const res = await classService.getStudents(studentTarget.id);
            setStudents(res.data.data);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa sinh viên thất bại');
        }
    };

    // Get users that can be added as students (not already enrolled)
    const availableStudents = allUsers.filter(
        (u) =>
            (u.role === 'TEAMMEMBER' || u.role === 'TEAMLEADER') &&
            !students.some((s) => s.studentId === u.userId)
    );

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Quản lý lớp học
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {classes.length} lớp học trong hệ thống
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreate(true)}
                    sx={{ borderRadius: 2, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                    Tạo lớp học
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Search */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <TextField
                    size="small"
                    placeholder="Tìm kiếm theo tên hoặc mã lớp..."
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
            </Card>

            {/* Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Tên lớp</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Mã lớp</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Học kỳ</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Giảng viên</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">SV</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredClasses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        {searchTerm ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học nào'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClasses.map((cls, index) => (
                                    <TableRow key={cls.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{cls.className}</TableCell>
                                        <TableCell>
                                            <Chip label={cls.classCode} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{cls.semester}</TableCell>
                                        <TableCell>
                                            {cls.lecturerName ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <PersonIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2">{cls.lecturerName}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                                    Chưa gán
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={cls.totalStudents}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => openStudentDialog(cls)}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={cls.active ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={cls.active ? 'success' : 'default'}
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Tooltip title="Quản lý sinh viên">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => openStudentDialog(cls)}
                                                    >
                                                        <PeopleIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Gán giảng viên">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => openAssignDialog(cls)}
                                                    >
                                                        <PersonIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Sửa">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => openEditDialog(cls)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteTarget(cls)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ================ CREATE DIALOG ================ */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo lớp học mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField label="Tên lớp" fullWidth value={newClass.className}
                            onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                            placeholder="Ví dụ: Software Engineering"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Mã lớp" fullWidth value={newClass.classCode}
                            onChange={(e) => setNewClass({ ...newClass, classCode: e.target.value })}
                            placeholder="Ví dụ: SE1801"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Học kỳ" fullWidth value={newClass.semester}
                            onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                            placeholder="Ví dụ: Spring 2026"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={creating}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {creating ? 'Đang tạo...' : 'Tạo lớp'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ================ EDIT DIALOG ================ */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Sửa lớp: {editTarget?.classCode}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField label="Tên lớp" fullWidth value={editData.className || ''}
                            onChange={(e) => setEditData({ ...editData, className: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Học kỳ" fullWidth value={editData.semester || ''}
                            onChange={(e) => setEditData({ ...editData, semester: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setEditTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleEdit} disabled={editing}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {editing ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ================ ASSIGN LECTURER DIALOG ================ */}
            <Dialog open={!!assignTarget} onClose={() => setAssignTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Gán giảng viên: {assignTarget?.className}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Chọn giảng viên</InputLabel>
                        <Select value={selectedLecturer} label="Chọn giảng viên"
                            onChange={(e) => setSelectedLecturer(e.target.value as number)} sx={{ borderRadius: 2 }}>
                            {lecturers.map((l) => (
                                <MenuItem key={l.userId} value={l.userId}>{l.fullName} ({l.email})</MenuItem>
                            ))}
                            {lecturers.length === 0 && <MenuItem disabled>Chưa có giảng viên nào</MenuItem>}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setAssignTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAssign} disabled={assigning || !selectedLecturer}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {assigning ? 'Đang gán...' : 'Gán giảng viên'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ================ STUDENT MANAGEMENT DIALOG ================ */}
            <Dialog
                open={!!studentTarget}
                onClose={() => setStudentTarget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
                        Sinh viên — {studentTarget?.className} ({studentTarget?.classCode})
                    </Box>
                    <Chip label={`${students.length} SV`} color="primary" size="small" />
                </DialogTitle>
                <DialogContent>
                    {/* Add Student Section */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 3, mt: 1, alignItems: 'center' }}>
                        <FormControl sx={{ flex: 1 }} size="small">
                            <InputLabel>Chọn sinh viên để thêm</InputLabel>
                            <Select
                                value={selectedUserId}
                                label="Chọn sinh viên để thêm"
                                onChange={(e) => setSelectedUserId(e.target.value as number)}
                                sx={{ borderRadius: 2 }}
                            >
                                {availableStudents.map((u) => (
                                    <MenuItem key={u.userId} value={u.userId}>
                                        {u.fullName} — {u.email}
                                    </MenuItem>
                                ))}
                                {availableStudents.length === 0 && (
                                    <MenuItem disabled>Không còn sinh viên để thêm</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={handleAddStudent}
                            disabled={addingStudent || !selectedUserId}
                            sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap', py: 1 }}
                        >
                            {addingStudent ? 'Đang thêm...' : 'Thêm SV'}
                        </Button>
                    </Box>

                    {/* Students Table */}
                    {loadingStudents ? (
                        <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Ngày tham gia</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Xóa</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                Chưa có sinh viên nào trong lớp. Chọn sinh viên và nhấn "Thêm SV" để bắt đầu.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((s, i) => (
                                            <TableRow key={s.enrollmentId} hover>
                                                <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{s.fullName}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{s.email}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>
                                                    {new Date(s.enrolledAt).toLocaleDateString('vi-VN')}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Xóa khỏi lớp">
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveStudent(s)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setStudentTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ================ DELETE DIALOG ================ */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn xóa lớp{' '}
                        <strong>{deleteTarget?.className} ({deleteTarget?.classCode})</strong>?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        Hành động này không thể hoàn tác.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {deleting ? 'Đang xóa...' : 'Xóa lớp'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClassManagement;
