import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Breadcrumbs,
    Link,
    Skeleton,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { toast } from 'react-toastify';
import projectService from '../../api/services/projectService';
import classService from '../../api/services/classService';
import groupService from '../../api/services/groupService';
import type { ProjectResponse, ClassResponse, GroupResponse } from '../../api/types/types';

const ProjectManagement: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const id = Number(classId);

    const [classInfo, setClassInfo] = useState<ClassResponse | null>(null);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [groups, setGroups] = useState<GroupResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Project
    const [openCreate, setOpenCreate] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
    const [newProjectName, setNewProjectName] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit Project
    const [editTarget, setEditTarget] = useState<ProjectResponse | null>(null);
    const [editName, setEditName] = useState('');
    const [updating, setUpdating] = useState(false);

    // Delete Project
    const [deleteTarget, setDeleteTarget] = useState<ProjectResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [classRes, projectsRes, groupsRes] = await Promise.all([
                classService.getClassById(id),
                projectService.getProjectsByClass(id),
                groupService.getGroups(id),
            ]);
            setClassInfo(classRes.data.data);
            setProjects(projectsRes.data.data);
            setGroups(groupsRes.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lỗi tải dữ liệu projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleCreate = async () => {
        if (!selectedGroupId || !newProjectName) {
            toast.error('Vui lòng chọn nhóm và nhập tên project');
            return;
        }
        try {
            setCreating(true);
            await projectService.createProject(selectedGroupId as number, { projectName: newProjectName });
            toast.success('Tạo project thành công!');
            setOpenCreate(false);
            setSelectedGroupId('');
            setNewProjectName('');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo project thất bại');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async () => {
        if (!editTarget || !editName) return;
        try {
            setUpdating(true);
            await projectService.updateProject(editTarget.id, { projectName: editName });
            toast.success('Cập nhật thành công');
            setEditTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await projectService.deleteProject(deleteTarget.id);
            toast.success('Đã xóa project');
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa thất bại');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header & Breadcrumbs */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        component="button"
                        variant="body2"
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate('/lecturer/classes')}
                    >
                        Lớp học
                    </Link>
                    <Link
                        component="button"
                        variant="body2"
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate(`/lecturer/classes/${id}`)}
                    >
                        {classInfo?.className || 'Chi tiết lớp'}
                    </Link>
                    <Typography color="text.primary" variant="body2">
                        Quản lý Projects
                    </Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate(`/lecturer/classes/${id}`)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
                            Quản lý Projects — {classInfo?.className}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Tổng số: {projects.length} project đang thực hiện
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                    >
                        Tạo Project mới
                    </Button>
                </Box>
            </Box>

            {/* Projects Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Tên Project</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Nhóm phụ trách</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Team Leader</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">
                                    Thông tin chi tiết
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">
                                    Hành động
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Chưa có project nào. Hãy tạo project mới và gán cho nhóm.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((p, i) => {
                                    const group = groups.find((g) => g.id === p.groupId);
                                    return (
                                        <TableRow key={p.id} hover>
                                            <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AssignmentIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {p.projectName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={p.groupName}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {group?.teamLeaderName ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {group.teamLeaderName}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                                        Chưa gán
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {p.hasProjectInfo ? (
                                                    <Chip label="Đã điền" color="success" size="small" />
                                                ) : (
                                                    <Chip
                                                        label="Chưa có"
                                                        color="default"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Sửa tên">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => {
                                                            setEditTarget(p);
                                                            setEditName(p.projectName);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xem thông tin chi tiết">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => navigate(`/lecturer/projects/${p.id}/info`)}
                                                    >
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa Project">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteTarget(p)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Create Project Dialog */}
            <Dialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo Project mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Chọn nhóm</InputLabel>
                            <Select
                                value={selectedGroupId}
                                label="Chọn nhóm"
                                onChange={(e) => setSelectedGroupId(e.target.value as number)}
                                sx={{ borderRadius: 2 }}
                            >
                                {groups
                                    .filter((g) => !projects.some((p) => p.groupId === g.id))
                                    .map((g) => (
                                        <MenuItem key={g.id} value={g.id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {g.groupName}
                                                <Chip
                                                    label={`${g.totalMembers} thành viên`}
                                                    size="small"
                                                    sx={{ ml: 'auto' }}
                                                />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                {groups.filter((g) => !projects.some((p) => p.groupId === g.id)).length === 0 && (
                                    <MenuItem disabled>Tất cả nhóm đã có project</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Tên Project"
                            fullWidth
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Ví dụ: Hệ thống quản lý bán hàng"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={creating || !selectedGroupId || !newProjectName}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        {creating ? 'Đang tạo...' : 'Tạo Project'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Sửa tên Project</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Tên Project"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setEditTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleUpdate} disabled={updating || !editName}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {updating ? 'Đang lưu...' : 'Lưu lại'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn xóa Project <strong>{deleteTarget?.projectName}</strong> của nhóm <strong>{deleteTarget?.groupName}</strong>?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        Mọi dữ liệu thông tin chi tiết project, tasks liên quan cũng sẽ bị xóa.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {deleting ? 'Đang xóa...' : 'Xóa Project'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectManagement;
