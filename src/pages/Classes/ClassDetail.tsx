import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip,
    Skeleton,
    Alert,
    Breadcrumbs,
    Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import { toast } from 'react-toastify';
import classService from '../../api/services/classService';
import groupService from '../../api/services/groupService';
import type {
    ClassResponse,
    StudentInClassResponse,
    GroupResponse,
    GroupMemberResponse,
    CreateGroupRequest,
} from '../../api/types/types';

// ==================== STUDENTS TAB ====================
const StudentsTab: React.FC<{ classId: number; students: StudentInClassResponse[]; onRefresh: () => void }> = ({
    classId,
    students,
    onRefresh,
}) => {
    const [deleteTarget, setDeleteTarget] = useState<StudentInClassResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleRemove = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await classService.removeStudent(classId, deleteTarget.studentId);
            toast.success(`Đã xóa ${deleteTarget.fullName} khỏi lớp`);
            setDeleteTarget(null);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa sinh viên thất bại');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Ngày tham gia</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Chưa có sinh viên nào trong lớp
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
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(s)}>
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
            </Card>

            {/* Delete confirm */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography>
                        Xóa <strong>{deleteTarget?.fullName}</strong> khỏi lớp?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={handleRemove} disabled={deleting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {deleting ? 'Đang xóa...' : 'Xóa'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ==================== GROUPS TAB ====================
const GroupsTab: React.FC<{
    classId: number;
    groups: GroupResponse[];
    students: StudentInClassResponse[];
    onRefresh: () => void;
}> = ({ classId, groups, students, onRefresh }) => {
    // Create group dialog
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newGroup, setNewGroup] = useState<CreateGroupRequest>({ groupName: '', description: '' });

    // Members dialog
    const [viewGroup, setViewGroup] = useState<GroupResponse | null>(null);
    const [members, setMembers] = useState<GroupMemberResponse[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Add member dialog
    const [openAddMember, setOpenAddMember] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
    const [addingMember, setAddingMember] = useState(false);

    // Delete group
    const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleCreate = async () => {
        if (!newGroup.groupName) { toast.error('Tên nhóm không được để trống'); return; }
        try {
            setCreating(true);
            await groupService.createGroup(classId, newGroup);
            toast.success('Tạo nhóm thành công!');
            setOpenCreate(false);
            setNewGroup({ groupName: '', description: '' });
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo nhóm thất bại');
        } finally {
            setCreating(false);
        }
    };

    const openMembersDialog = async (group: GroupResponse) => {
        setViewGroup(group);
        setLoadingMembers(true);
        try {
            const res = await groupService.getMembers(classId, group.id);
            setMembers(res.data.data);
        } catch {
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleAddMember = async () => {
        if (!viewGroup || !selectedStudent) return;
        try {
            setAddingMember(true);
            await groupService.addMember(classId, viewGroup.id, selectedStudent as number);
            toast.success('Thêm thành viên thành công!');
            setOpenAddMember(false);
            setSelectedStudent('');
            // Refresh members
            const res = await groupService.getMembers(classId, viewGroup.id);
            setMembers(res.data.data);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Thêm thành viên thất bại');
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (member: GroupMemberResponse) => {
        if (!viewGroup) return;
        try {
            await groupService.removeMember(classId, viewGroup.id, member.userId);
            toast.success(`Đã xóa ${member.fullName} khỏi nhóm`);
            const res = await groupService.getMembers(classId, viewGroup.id);
            setMembers(res.data.data);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa thành viên thất bại');
        }
    };

    const handleAssignLeader = async (member: GroupMemberResponse) => {
        if (!viewGroup) return;
        try {
            await groupService.assignLeader(classId, viewGroup.id, member.userId);
            toast.success(`${member.fullName} đã trở thành Team Leader!`);
            const res = await groupService.getMembers(classId, viewGroup.id);
            setMembers(res.data.data);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gán leader thất bại');
        }
    };

    const handleDeleteGroup = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await groupService.deleteGroup(classId, deleteTarget.id);
            toast.success(`Đã xóa nhóm ${deleteTarget.groupName}`);
            setDeleteTarget(null);
            if (viewGroup?.id === deleteTarget.id) setViewGroup(null);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa nhóm thất bại');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    Tạo nhóm
                </Button>
            </Box>

            {/* Groups Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Tên nhóm</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Team Leader</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Thành viên</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Chưa có nhóm nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groups.map((g, i) => (
                                    <TableRow key={g.id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => openMembersDialog(g)}>
                                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{g.groupName}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', maxWidth: 200 }}>
                                            <Typography variant="body2" noWrap>{g.description || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {g.teamLeaderName ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <StarIcon fontSize="small" sx={{ color: '#ffa726' }} />
                                                    <Typography variant="body2">{g.teamLeaderName}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa gán</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={g.totalMembers} size="small" color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                            <Tooltip title="Xóa nhóm">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(g)}>
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
            </Card>

            {/* =============== CREATE GROUP DIALOG =============== */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo nhóm mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField label="Tên nhóm" fullWidth value={newGroup.groupName}
                            onChange={(e) => setNewGroup({ ...newGroup, groupName: e.target.value })}
                            placeholder="Ví dụ: Nhóm 1"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Mô tả / Đề tài" fullWidth multiline rows={3}
                            value={newGroup.description || ''}
                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                            placeholder="Ví dụ: Xây dựng hệ thống quản lý bán hàng"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={creating}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {creating ? 'Đang tạo...' : 'Tạo nhóm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =============== VIEW MEMBERS DIALOG =============== */}
            <Dialog open={!!viewGroup} onClose={() => setViewGroup(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <GroupsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {viewGroup?.groupName}
                    </Box>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setOpenAddMember(true)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Thêm thành viên
                    </Button>
                </DialogTitle>
                <DialogContent>
                    {viewGroup?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Đề tài: {viewGroup.description}
                        </Typography>
                    )}
                    {loadingMembers ? (
                        <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Vai trò</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                Chưa có thành viên
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        members.map((m) => (
                                            <TableRow key={m.membershipId} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>
                                                    {m.isLeader && <StarIcon fontSize="small" sx={{ color: '#ffa726', mr: 0.5, verticalAlign: 'middle' }} />}
                                                    {m.fullName}
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{m.email}</TableCell>
                                                <TableCell>
                                                    <Chip label={m.isLeader ? 'Leader' : 'Member'} size="small"
                                                        color={m.isLeader ? 'warning' : 'default'} variant="outlined" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {!m.isLeader && (
                                                        <Tooltip title="Gán làm Leader">
                                                            <IconButton size="small" color="warning" onClick={() => handleAssignLeader(m)}>
                                                                <StarIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Xóa khỏi nhóm">
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveMember(m)}>
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
                    <Button onClick={() => setViewGroup(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* =============== ADD MEMBER DIALOG =============== */}
            <Dialog open={openAddMember} onClose={() => setOpenAddMember(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Thêm thành viên vào {viewGroup?.groupName}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Chọn sinh viên</InputLabel>
                        <Select value={selectedStudent} label="Chọn sinh viên"
                            onChange={(e) => setSelectedStudent(e.target.value as number)} sx={{ borderRadius: 2 }}>
                            {students.map((s) => (
                                <MenuItem key={s.studentId} value={s.studentId}>
                                    {s.fullName} ({s.email})
                                </MenuItem>
                            ))}
                            {students.length === 0 && <MenuItem disabled>Không có sinh viên</MenuItem>}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenAddMember(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAddMember} disabled={addingMember || !selectedStudent}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {addingMember ? 'Đang thêm...' : 'Thêm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* =============== DELETE GROUP DIALOG =============== */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa nhóm</DialogTitle>
                <DialogContent>
                    <Typography>Xóa nhóm <strong>{deleteTarget?.groupName}</strong>?</Typography>
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>Tất cả thành viên sẽ bị xóa khỏi nhóm.</Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteGroup} disabled={deleting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {deleting ? 'Đang xóa...' : 'Xóa nhóm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ==================== MAIN: CLASS DETAIL PAGE ====================
const ClassDetail: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [classInfo, setClassInfo] = useState<ClassResponse | null>(null);
    const [students, setStudents] = useState<StudentInClassResponse[]>([]);
    const [groups, setGroups] = useState<GroupResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const id = Number(classId);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [classRes, studentsRes, groupsRes] = await Promise.all([
                classService.getClassById(id),
                classService.getStudents(id),
                groupService.getGroups(id),
            ]);
            setClassInfo(classRes.data.data);
            setStudents(studentsRes.data.data);
            setGroups(groupsRes.data.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu lớp học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton variant="text" width={200} height={30} sx={{ mb: 3 }} />
                <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Breadcrumb + Back */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton onClick={() => navigate('/lecturer/classes')} size="small">
                    <ArrowBackIcon />
                </IconButton>
                <Breadcrumbs>
                    <Link
                        component="button"
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate('/lecturer/classes')}
                        sx={{ cursor: 'pointer' }}
                    >
                        Lớp học
                    </Link>
                    <Typography color="text.primary" fontWeight={600}>
                        {classInfo?.className || 'Chi tiết'}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="h4" fontWeight={700}>
                        {classInfo?.className}
                    </Typography>
                    <Chip label={classInfo?.classCode} color="primary" variant="outlined" />
                    <Chip
                        label={classInfo?.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={classInfo?.active ? 'success' : 'default'}
                    />
                </Box>
                <Typography variant="body1" color="text.secondary">
                    Học kỳ: {classInfo?.semester} · {students.length} sinh viên · {groups.length} nhóm
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
            >
                <Tab label={`Sinh viên (${students.length})`} icon={<PersonIcon />} iconPosition="start" />
                <Tab label={`Nhóm (${groups.length})`} icon={<GroupsIcon />} iconPosition="start" />
            </Tabs>

            {tab === 0 && (
                <StudentsTab classId={id} students={students} onRefresh={fetchData} />
            )}
            {tab === 1 && (
                <GroupsTab classId={id} groups={groups} students={students} onRefresh={fetchData} />
            )}
        </Box>
    );
};

export default ClassDetail;
