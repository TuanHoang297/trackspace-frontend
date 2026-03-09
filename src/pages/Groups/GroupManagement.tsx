import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Card, Button, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip,
    Breadcrumbs, Link, Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import groupService from '../../api/services/groupService';
import classService from '../../api/services/classService';
import type { ClassResponse } from '../../types/class.types';
import type { GroupResponse, CreateGroupRequest } from '../../types/group.types';
import type { StudentInClassResponse } from '../../types/class.types';
import GroupFormDialog from './components/GroupFormDialog';
import MembersDialog from './components/MembersDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';

const GroupManagement: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const id = Number(classId);

    // Dialog state
    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<GroupResponse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [viewGroup, setViewGroup] = useState<GroupResponse | null>(null);

    // Parallel data fetching with React Query cache
    const { data: classInfo = null, isLoading: classLoading } = useQuery({
        queryKey: ['class', id],
        queryFn: async () => { const r = await classService.getClassById(id); return r.data.data as ClassResponse; },
        enabled: !!id,
    });
    const { data: groups = [], isLoading: groupsLoading } = useQuery({
        queryKey: ['class', id, 'groups'],
        queryFn: async () => { const r = await groupService.getGroups(id); return r.data.data as GroupResponse[]; },
        enabled: !!id,
    });
    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ['class', id, 'students'],
        queryFn: async () => { const r = await classService.getStudents(id); return r.data.data as StudentInClassResponse[]; },
        enabled: !!id,
    });
    const loading = classLoading || groupsLoading || studentsLoading;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['class', id] });

    const handleCreate = async (data: CreateGroupRequest) => {
        await groupService.createGroup(id, data);
        toast.success('Tạo nhóm thành công!');
        invalidate();
    };

    const handleEdit = async (data: CreateGroupRequest) => {
        if (!editTarget) return;
        await groupService.updateGroup(id, editTarget.id, data);
        toast.success('Cập nhật nhóm thành công');
        setEditTarget(null);
        invalidate();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await groupService.deleteGroup(id, deleteTarget.id);
            toast.success(`Đã xóa nhóm ${deleteTarget.groupName}`);
            setDeleteTarget(null);
            if (viewGroup?.id === deleteTarget.id) setViewGroup(null);
            invalidate();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa nhóm thất bại');
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
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link component="button" variant="body2" underline="hover" color="inherit"
                        onClick={() => navigate('/lecturer/classes')}>Môn học</Link>
                    <Link component="button" variant="body2" underline="hover" color="inherit"
                        onClick={() => navigate(`/lecturer/classes/${id}`)}>
                        {classInfo?.subjectName ?? classInfo?.classCode ?? 'Chi tiết lớp học'}
                    </Link>
                    <Typography color="text.primary" variant="body2">Quản lý Nhóm</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate(`/lecturer/classes/${id}`)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B' }}>
                            Quản lý Nhóm — {classInfo?.subjectName ?? classInfo?.classCode}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Tổng số: {groups.length} nhóm
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}>
                        Tạo nhóm mới
                    </Button>
                </Box>
            </Box>

            {/* Groups Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                {['#', 'Tên nhóm', 'Mô tả', 'Team Leader', 'Thành viên', 'Hành động'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700 }}
                                        align={['Thành viên', 'Hành động'].includes(h) ? 'center' : 'left'}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Chưa có nhóm nào. Hãy tạo nhóm mới.
                                    </TableCell>
                                </TableRow>
                            ) : groups.map((g, i) => (
                                <TableRow key={g.id} hover sx={{ cursor: 'pointer' }} onClick={() => setViewGroup(g)}>
                                    <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{g.groupName}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', maxWidth: 300 }}>
                                        {g.description || <Typography variant="body2" fontStyle="italic" color="text.disabled">Chưa có mô tả</Typography>}
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
                                                onClick={() => setEditTarget(g)}>
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Dialogs */}
            <GroupFormDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSubmit={async (data) => { await handleCreate(data); setOpenCreate(false); }}
            />

            <GroupFormDialog
                open={!!editTarget}
                editTarget={editTarget}
                onClose={() => setEditTarget(null)}
                onSubmit={handleEdit}
            />

            <MembersDialog
                classId={id}
                group={viewGroup}
                students={students}
                onClose={() => setViewGroup(null)}
                onRefresh={invalidate}
            />

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
        </Box>
    );
};

export default GroupManagement;
