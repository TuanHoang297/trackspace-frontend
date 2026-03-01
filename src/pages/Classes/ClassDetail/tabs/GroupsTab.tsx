import React, { useState } from 'react';
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
import { toast } from 'react-toastify';
import groupService from '../../../../api/services/groupService';
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
                                            {proj
                                                ? <Chip label={proj.projectName} size="small" color="info" variant="outlined" />
                                                : <Chip label="Chưa có Project" size="small" variant="outlined" />}
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

            {/* View Members Dialog */}
            <Dialog open={!!viewGroup} onClose={() => setViewGroup(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupsIcon /> {viewGroup?.groupName}
                    </Box>
                    <Button size="small" variant="contained" startIcon={<PersonAddIcon />}
                        onClick={() => { setSelectedStudents([]); setOpenAddMembers(true); }}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Thêm thành viên
                    </Button>
                </DialogTitle>
                <DialogContent>
                    {loadingMembers ? (
                        <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Mã SV', 'Họ tên', 'Email', 'Vai trò', 'Hành động'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa có thành viên</TableCell></TableRow>
                                ) : members.map(m => (
                                    <TableRow key={m.membershipId} hover>
                                        <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{m.studentCode || 'N/A'}</Typography></TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {m.isLeader && <StarIcon fontSize="small" sx={{ color: '#ffa726', mr: 0.5, verticalAlign: 'middle' }} />}
                                            {m.fullName}
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{m.email}</TableCell>
                                        <TableCell>
                                            <Chip label={m.isLeader ? 'Leader' : 'Member'} size="small"
                                                color={m.isLeader ? 'warning' : 'default'} variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            {!m.isLeader && (
                                                <Tooltip title="Gán làm Team Leader">
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
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setViewGroup(null)} sx={{ textTransform: 'none', borderRadius: 2 }}>Đóng</Button>
                </DialogActions>
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
        </>
    );
};

export default GroupsTab;
