import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, Chip, IconButton, Tooltip, Typography, Skeleton,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
import { useRole } from '../../../../hooks/useRole';

interface Props {
    classId: number;
    groups: GroupResponse[];
    projects: ProjectResponse[];
    students: StudentInClassResponse[];
    onRefresh: () => void;
}

const GroupsTab: React.FC<Props> = ({ classId, groups, projects, students, onRefresh }) => {
    const navigate = useNavigate();
    const { isAdmin, isLecturer } = useRole();
    const readOnly = !isAdmin() && !isLecturer();
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
            {!readOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Tạo nhóm
                    </Button>
                </Box>
            )}

            {groups.length === 0 ? (
                <Card sx={{
                    p: 6, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                    bgcolor: 'transparent', boxShadow: 'none',
                }}>
                    <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={500}>Chưa có nhóm nào</Typography>
                    <Typography variant="caption" color="text.disabled">Bấm "Tạo nhóm" để bắt đầu</Typography>
                </Card>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                    gap: 2,
                }}>
                    {groups.map((g, i) => {
                        const proj = projects.find(p => p.groupId === g.id);
                        const palettes = [
                            { g1: '#3B82F6', g2: '#8B5CF6', bg: '#EEF2FF', light: 'rgba(59,130,246,0.08)' },
                            { g1: '#10B981', g2: '#059669', bg: '#ECFDF5', light: 'rgba(16,185,129,0.08)' },
                            { g1: '#F59E0B', g2: '#D97706', bg: '#FFFBEB', light: 'rgba(245,158,11,0.08)' },
                            { g1: '#EF4444', g2: '#DC2626', bg: '#FEF2F2', light: 'rgba(239,68,68,0.08)' },
                            { g1: '#8B5CF6', g2: '#7C3AED', bg: '#F5F3FF', light: 'rgba(139,92,246,0.08)' },
                            { g1: '#EC4899', g2: '#DB2777', bg: '#FDF2F8', light: 'rgba(236,72,153,0.08)' },
                        ];
                        const pal = palettes[i % palettes.length];

                        return (
                            <Card
                                key={g.id}
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                                    border: '1px solid',
                                    borderColor: 'rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        boxShadow: `0 20px 40px -12px ${pal.g1}30`,
                                        borderColor: `${pal.g1}40`,
                                    },
                                }}
                                onClick={() => openMembersDialog(g)}
                            >
                                {/* ── Gradient Header ── */}
                                <Box sx={{
                                    background: `linear-gradient(135deg, ${pal.g1} 0%, ${pal.g2} 100%)`,
                                    px: 2, pt: 2, pb: 2.5,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&::before': {
                                        content: '""', position: 'absolute',
                                        top: -20, right: -20,
                                        width: 80, height: 80,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(255,255,255,0.12)',
                                    },
                                    '&::after': {
                                        content: '""', position: 'absolute',
                                        bottom: -15, left: '50%',
                                        width: 50, height: 50,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(255,255,255,0.08)',
                                    },
                                }}>
                                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                                        <Box sx={{
                                            width: 38, height: 38, borderRadius: 2,
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(10px)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <GroupsIcon sx={{ fontSize: 20, color: '#fff' }} />
                                        </Box>
                                    </Box>

                                    <Typography variant="h6" fontWeight={800} sx={{
                                        color: '#fff', fontSize: '1rem', lineHeight: 1.2,
                                        mt: 1.5, position: 'relative', zIndex: 1,
                                    }}>
                                        {g.groupName}
                                    </Typography>
                                    {g.description && (
                                        <Typography variant="caption" noWrap display="block" sx={{
                                            color: 'rgba(255,255,255,0.75)', mt: 0.3,
                                            position: 'relative', zIndex: 1,
                                        }}>
                                            {g.description}
                                        </Typography>
                                    )}
                                </Box>

                                {/* ── Body ── */}
                                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#fff' }}>
                                    {/* Project */}
                                    <Box onClick={e => e.stopPropagation()}>
                                        {proj ? (
                                            <Box sx={{
                                                p: 1.5, borderRadius: 2,
                                                bgcolor: pal.light,
                                                border: `1px solid ${pal.g1}18`,
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                                    <ViewKanbanIcon sx={{ fontSize: 14, color: pal.g1 }} />
                                                    <Typography variant="caption" fontWeight={700} sx={{ color: pal.g1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.6rem' }}>
                                                        Project
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#1E293B', fontSize: '0.82rem' }}>
                                                    {proj.projectName}
                                                </Typography>
                                            </Box>
                                        ) : !readOnly ? (
                                            <Box
                                                onClick={() => { setCreateProjGroup(g); setNewProjName(''); }}
                                                sx={{
                                                    p: 1.5, borderRadius: 2,
                                                    border: '1.5px dashed',
                                                    borderColor: '#CBD5E1',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { borderColor: pal.g1, bgcolor: pal.light },
                                                }}
                                            >
                                                <Typography variant="caption" fontWeight={600} sx={{ color: '#94A3B8' }}>
                                                    + Gán Project
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ p: 1.5, borderRadius: 2, border: '1.5px dashed', borderColor: '#E2E8F0', textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.disabled" fontStyle="italic">Chưa có project</Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Stats Row */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
                                            {g.teamLeaderName ? (
                                                <>
                                                    <StarIcon sx={{ fontSize: 14, color: '#F59E0B', flexShrink: 0 }} />
                                                    <Typography variant="caption" fontWeight={600} noWrap sx={{ color: '#475569' }}>
                                                        {g.teamLeaderName}
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                                    Chưa có leader
                                                </Typography>
                                            )}
                                        </Box>
                                        <Chip
                                            icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                                            label={g.totalMembers}
                                            size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: '0.7rem', height: 22,
                                                bgcolor: pal.light, color: pal.g1,
                                                '& .MuiChip-icon': { color: pal.g1 },
                                            }}
                                        />
                                    </Box>

                                    {/* Workspace Button */}
                                    {proj && (
                                        <Box onClick={e => e.stopPropagation()} sx={{ mt: 'auto' }}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="contained"
                                                startIcon={<ViewKanbanIcon sx={{ fontSize: '16px !important' }} />}
                                                onClick={() => navigate(`/projects/${proj.id}`)}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.78rem',
                                                    borderRadius: 2,
                                                    py: 0.8,
                                                    background: `linear-gradient(135deg, ${pal.g1} 0%, ${pal.g2} 100%)`,
                                                    boxShadow: `0 4px 12px ${pal.g1}35`,
                                                    '&:hover': {
                                                        boxShadow: `0 6px 20px ${pal.g1}50`,
                                                    },
                                                }}
                                            >
                                                Mở Workspace
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        );
                    })}
                </Box>
            )}

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
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid #E2E8F0',
                    borderTop: '4px solid #3B82F6',
                    borderRadius: '12px 12px 0 0',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <GroupsIcon sx={{ color: '#3B82F6' }} />
                                <Typography variant="h6" fontWeight={700} color="#1E293B">{viewGroup?.groupName}</Typography>
                                <Chip label={`${members.length} thành viên`} size="small"
                                    sx={{ bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontWeight: 600, height: 22 }} />
                            </Box>
                            {viewGroup?.description && (
                                <Typography variant="body2" color="text.secondary">{viewGroup.description}</Typography>
                            )}
                        </Box>
                        <IconButton onClick={() => setViewGroup(null)} sx={{ color: '#94A3B8' }}>
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
                                            {!readOnly && (
                                                <Button
                                                    size="small" variant="outlined"
                                                    onClick={() => { setCreateProjGroup(viewGroup); setNewProjName(proj.projectName); }}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                                                    Đổi tên
                                                </Button>
                                            )}
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
                                        {!readOnly && (
                                            <Button
                                                size="small" variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => { setCreateProjGroup(viewGroup); setNewProjName(''); }}
                                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                                                Tạo Project
                                            </Button>
                                        )}
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
                                        bgcolor: m.isLeader ? '#F59E0B' : '#3B82F6',
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
                                    {!readOnly && (
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
                                    )}
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
                            <List sx={{ maxHeight: 350, overflow: 'auto', bgcolor: '#F8FAFC', borderRadius: 2 }}>
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
