import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, Typography, Skeleton,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import { toast } from 'react-toastify';
import groupService from '../../../../api/services/groupService';
import projectService from '../../../../api/services/projectService';
import type { GroupResponse, GroupMemberResponse, CreateGroupRequest } from '../../../../types/group.types';
import type { StudentInClassResponse } from '../../../../types/class.types';
import type { ProjectResponse } from '../../../../types/project.types';
import ConfirmDialog from '../../../../components/common/ConfirmDialog/ConfirmDialog';

interface Props {
    classId: number;
    groups: GroupResponse[];
    projects: ProjectResponse[];
    students: StudentInClassResponse[];
    onRefresh: () => void;
}

const GroupsTab: React.FC<Props> = ({ classId, groups, projects, students, onRefresh }) => {
    const navigate = useNavigate();
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newGroup, setNewGroup] = useState<CreateGroupRequest>({ groupName: '', description: '' });

    const [editTarget, setEditTarget] = useState<GroupResponse | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [updating, setUpdating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [viewGroup, setViewGroup] = useState<GroupResponse | null>(null);
    const [members, setMembers] = useState<GroupMemberResponse[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [openAddMembers, setOpenAddMembers] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [addingMembers, setAddingMembers] = useState(false);

    // Create Project inline
    const [createProjGroup, setCreateProjGroup] = useState<GroupResponse | null>(null);
    const [newProjName, setNewProjName] = useState('');
    const [creatingProj, setCreatingProj] = useState(false);

    const handleCreate = async () => {
        if (!newGroup.groupName) { toast.error('Tên nhóm không được để trống'); return; }
        try {
            setCreating(true);
            await groupService.createGroup(classId, newGroup);
            toast.success('Tạo nhóm thành công!');
            setOpenCreate(false);
            setNewGroup({ groupName: '', description: '' });
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Tạo nhóm thất bại'); }
        finally { setCreating(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget || !editName) return;
        try {
            setUpdating(true);
            await groupService.updateGroup(classId, editTarget.id, { groupName: editName, description: editDesc });
            toast.success('Cập nhật nhóm thành công');
            setEditTarget(null);
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Cập nhật thất bại'); }
        finally { setUpdating(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await groupService.deleteGroup(classId, deleteTarget.id);
            toast.success(`Đã xóa nhóm ${deleteTarget.groupName}`);
            setDeleteTarget(null);
            if (viewGroup?.id === deleteTarget.id) setViewGroup(null);
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Xóa nhóm thất bại'); }
        finally { setDeleting(false); }
    };

    const openMembersDialog = async (group: GroupResponse) => {
        setViewGroup(group);
        setLoadingMembers(true);
        try {
            const res = await groupService.getMembers(classId, group.id);
            setMembers(res.data.data);
        } catch { setMembers([]); }
        finally { setLoadingMembers(false); }
    };

    const refreshMembers = async () => {
        if (!viewGroup) return;
        const res = await groupService.getMembers(classId, viewGroup.id);
        setMembers(res.data.data);
    };

    const handleAddMembers = async () => {
        if (!viewGroup || selectedStudents.length === 0) { toast.error('Chọn ít nhất một sinh viên'); return; }
        try {
            setAddingMembers(true);
            let ok = 0;
            for (const sid of selectedStudents) {
                try { await groupService.addMember(classId, viewGroup.id, sid); ok++; } catch { }
            }
            toast.success(`Đã thêm ${ok}/${selectedStudents.length} thành viên vào nhóm!`);
            setOpenAddMembers(false);
            setSelectedStudents([]);
            await refreshMembers();
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Thêm thành viên thất bại'); }
        finally { setAddingMembers(false); }
    };

    const handleRemoveMember = async (m: GroupMemberResponse) => {
        if (!viewGroup) return;
        try {
            await groupService.removeMember(classId, viewGroup.id, m.userId);
            toast.success(`Đã xóa ${m.fullName} khỏi nhóm`);
            await refreshMembers();
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Xóa thành viên thất bại'); }
    };

    const handleAssignLeader = async (m: GroupMemberResponse) => {
        if (!viewGroup) return;
        try {
            await groupService.assignLeader(classId, viewGroup.id, m.userId);
            toast.success(`${m.fullName} đã trở thành Team Leader!`);
            await refreshMembers();
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Gán leader thất bại'); }
    };

    const availableStudents = students.filter(s => !s.groupId && !members.some(m => m.userId === s.studentId));
    const toggleStudent = (id: number) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAll = () => setSelectedStudents(selectedStudents.length === availableStudents.length ? [] : availableStudents.map(s => s.studentId));

    const handleCreateProject = async () => {
        if (!createProjGroup || !newProjName.trim()) { toast.error('Nhập tên project'); return; }
        try {
            setCreatingProj(true);
            const existingProj = projects.find(p => p.groupId === createProjGroup.id);
            if (existingProj) {
                await projectService.updateProject(existingProj.id, { projectName: newProjName });
                toast.success('Đã cập nhật tên project!');
            } else {
                await projectService.createProject(createProjGroup.id, { projectName: newProjName });
                toast.success('Tạo project thành công!');
            }
            setCreateProjGroup(null);
            setNewProjName('');
            onRefresh();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Thao tác thất bại'); }
        finally { setCreatingProj(false); }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    Tạo nhóm
                </Button>
            </Box>

            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                {['#', 'Tên nhóm', 'Project', 'Team Leader', 'Thành viên', 'Hành động'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700 }} align={['Thành viên', 'Hành động'].includes(h) ? 'center' : 'left'}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Chưa có nhóm nào</TableCell></TableRow>
                            ) : groups.map((g, i) => {
                                const proj = projects.find(p => p.groupId === g.id);
                                return (
                                    <TableRow key={g.id} hover sx={{ cursor: 'pointer' }} onClick={() => openMembersDialog(g)}>
                                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{g.groupName}</Typography>
                                            {g.description && <Typography variant="caption" color="text.secondary">{g.description}</Typography>}
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            {proj ? (
                                                <Tooltip title="Quản lý dự án" arrow>
                                                    <Chip
                                                        label={proj.projectName}
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                        icon={<ViewKanbanIcon sx={{ fontSize: '16px !important' }} />}
                                                        onClick={() => navigate(`/projects/${proj.id}`)}
                                                        sx={{
                                                            cursor: 'pointer', maxWidth: 280, fontWeight: 600,
                                                            '&:hover': { bgcolor: '#E3F2FD', borderColor: '#1976d2' },
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Chip
                                                    label="+ Tạo Project"
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => { setCreateProjGroup(g); setNewProjName(''); }}
                                                    sx={{
                                                        cursor: 'pointer', borderStyle: 'dashed',
                                                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {g.teamLeaderName ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <StarIcon fontSize="small" sx={{ color: '#ffa726' }} />
                                                    <Typography variant="body2">{g.teamLeaderName}</Typography>
                                                </Box>
                                            ) : <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa gán</Typography>}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={g.totalMembers} size="small" color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center" onClick={e => e.stopPropagation()}>
                                            <Tooltip title="Sửa nhóm">
                                                <IconButton size="small" color="primary"
                                                    onClick={() => { setEditTarget(g); setEditName(g.groupName); setEditDesc(g.description || ''); }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa nhóm">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(g)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Create Group Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo nhóm mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField label="Tên nhóm" fullWidth value={newGroup.groupName}
                            onChange={e => setNewGroup({ ...newGroup, groupName: e.target.value })}
                            placeholder="Ví dụ: Nhóm 1" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Mô tả (optional)" fullWidth multiline rows={2} value={newGroup.description || ''}
                            onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
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

            {/* Edit Group Dialog */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Sửa thông tin nhóm</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField label="Tên nhóm" fullWidth value={editName} onChange={e => setEditName(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Mô tả" fullWidth multiline rows={2} value={editDesc}
                            onChange={e => setEditDesc(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setEditTarget(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleUpdate} disabled={updating || !editName}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {updating ? 'Đang lưu...' : 'Lưu lại'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Xác nhận xóa nhóm"
                message={<>Xóa nhóm <strong>{deleteTarget?.groupName}</strong>? Tất cả thành viên sẽ bị xóa khỏi nhóm.</>}
                confirmLabel="Xóa nhóm"
                severity="error"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* View Group Detail Dialog */}
            <Dialog open={!!viewGroup} onClose={() => setViewGroup(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {/* Header */}
                <Box sx={{
                    p: 3, pb: 2,
                    background: 'linear-gradient(135deg, #1B2A4A 0%, #2D3E5F 100%)',
                    color: '#fff',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <GroupsIcon />
                                <Typography variant="h6" fontWeight={700}>{viewGroup?.groupName}</Typography>
                                <Chip label={`${members.length} thành viên`} size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, height: 22 }} />
                            </Box>
                            {viewGroup?.description && (
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>{viewGroup.description}</Typography>
                            )}
                        </Box>
                        <IconButton onClick={() => setViewGroup(null)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                <DialogContent sx={{ p: 3 }}>
                    {/* Project Section */}
                    {(() => {
                        const proj = viewGroup ? projects.find(p => p.groupId === viewGroup.id) : null;
                        return (
                            <Box sx={{
                                p: 2, mb: 3, borderRadius: 2,
                                border: '1px solid', borderColor: 'divider',
                                bgcolor: '#FAFBFC',
                            }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                                    Project
                                </Typography>
                                {proj ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={700}>{proj.projectName}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {proj.hasProjectInfo ? '✅ Đã điền thông tin' : '📝 Chưa điền thông tin'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small" variant="outlined"
                                                onClick={() => { setCreateProjGroup(viewGroup); setNewProjName(proj.projectName); }}
                                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                                                Đổi tên
                                            </Button>
                                            <Button
                                                size="small" variant="contained"
                                                startIcon={<ViewKanbanIcon />}
                                                onClick={() => { setViewGroup(null); navigate(`/projects/${proj.id}`); }}
                                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                                                Mở Workspace
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                            Chưa có project — tạo để sử dụng Jira, GitHub, Contribution
                                        </Typography>
                                        <Button
                                            size="small" variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => { setCreateProjGroup(viewGroup); setNewProjName(''); }}
                                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                                            Tạo Project
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}

                    {/* Members Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700}>Danh sách thành viên</Typography>
                        <Button size="small" variant="contained" startIcon={<PersonAddIcon />}
                            onClick={() => { setSelectedStudents([]); setOpenAddMembers(true); }}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                            Thêm thành viên
                        </Button>
                    </Box>

                    {loadingMembers ? (
                        <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={56} sx={{ mb: 0.5, borderRadius: 2 }} />)}</Box>
                    ) : members.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                            <Typography>Chưa có thành viên nào</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {members.map(m => (
                                <Box
                                    key={m.membershipId}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        p: 1.5, borderRadius: 2,
                                        border: '1px solid', borderColor: m.isLeader ? '#FFE0B2' : 'divider',
                                        bgcolor: m.isLeader ? '#FFF8E1' : 'transparent',
                                        '&:hover': { bgcolor: m.isLeader ? '#FFF3E0' : '#F5F5F5' },
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {/* Avatar */}
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        bgcolor: m.isLeader ? '#FF9800' : '#1976d2',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                                    }}>
                                        {m.fullName.split(' ').pop()?.charAt(0).toUpperCase() || '?'}
                                    </Box>

                                    {/* Info */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>{m.fullName}</Typography>
                                            {m.isLeader && <StarIcon sx={{ fontSize: 16, color: '#FF9800' }} />}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" noWrap>{m.email}</Typography>
                                    </Box>

                                    {/* Student Code */}
                                    {m.studentCode && (
                                        <Chip label={m.studentCode} size="small"
                                            sx={{ fontFamily: 'monospace', fontSize: 11, height: 22, fontWeight: 600 }} />
                                    )}

                                    {/* Role */}
                                    <Chip
                                        label={m.isLeader ? 'Leader' : 'Member'}
                                        size="small"
                                        sx={{
                                            fontWeight: 700, fontSize: '0.65rem', width: 70,
                                            bgcolor: m.isLeader ? '#FF9800' : '#E0E0E0',
                                            color: m.isLeader ? '#fff' : '#616161',
                                        }}
                                    />

                                    {/* Actions */}
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {!m.isLeader && (
                                            <Tooltip title="Gán làm Team Leader">
                                                <IconButton size="small" onClick={() => handleAssignLeader(m)}
                                                    sx={{ color: '#FF9800' }}>
                                                    <StarIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Xóa khỏi nhóm">
                                            <IconButton size="small" onClick={() => handleRemoveMember(m)} color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Members Dialog */}
            <Dialog open={openAddMembers} onClose={() => setOpenAddMembers(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Thêm thành viên vào {viewGroup?.groupName}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>Chọn sinh viên chưa có nhóm để thêm vào nhóm</Typography>
                </DialogTitle>
                <DialogContent>
                    {availableStudents.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>Không còn sinh viên nào để thêm vào nhóm</Alert>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Đã chọn: {selectedStudents.length}/{availableStudents.length}</Typography>
                                <Button size="small" onClick={toggleAll} sx={{ textTransform: 'none' }}>
                                    {selectedStudents.length === availableStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <List sx={{ maxHeight: 350, overflow: 'auto', bgcolor: '#f8f9fa', borderRadius: 2 }}>
                                {availableStudents.map(s => (
                                    <ListItem key={s.studentId} disablePadding>
                                        <ListItemButton onClick={() => toggleStudent(s.studentId)} sx={{ borderRadius: 1, mb: 0.5 }}>
                                            <ListItemIcon>
                                                <Checkbox edge="start" checked={selectedStudents.includes(s.studentId)} disableRipple />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {s.studentCode && <Chip label={s.studentCode} size="small" sx={{ fontFamily: 'monospace', fontSize: 10, height: 20 }} />}
                                                    <Typography variant="body2" fontWeight={500}>{s.fullName}</Typography>
                                                </Box>}
                                                secondary={s.email}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenAddMembers(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAddMembers}
                        disabled={addingMembers || selectedStudents.length === 0} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {addingMembers ? 'Đang thêm...' : `Thêm (${selectedStudents.length})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create / Rename Project Dialog */}
            <Dialog open={!!createProjGroup} onClose={() => setCreateProjGroup(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {createProjGroup && projects.find(p => p.groupId === createProjGroup.id)
                        ? `Đổi tên Project — ${createProjGroup.groupName}`
                        : `Tạo Project cho ${createProjGroup?.groupName}`}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Tên Project" fullWidth autoFocus
                        value={newProjName}
                        onChange={e => setNewProjName(e.target.value)}
                        placeholder="Ví dụ: Hệ thống quản lý bán hàng"
                        sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setCreateProjGroup(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleCreateProject}
                        disabled={creatingProj || !newProjName.trim()}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {creatingProj ? 'Đang xử lý...'
                            : (createProjGroup && projects.find(p => p.groupId === createProjGroup.id) ? 'Lưu' : 'Tạo Project')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GroupsTab;
