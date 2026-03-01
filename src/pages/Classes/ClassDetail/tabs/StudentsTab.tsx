import React, { useState } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { toast } from 'react-toastify';
import classService from '../../../../api/services/classService';
import groupService from '../../../../api/services/groupService';
import type { StudentInClassResponse } from '../../../../types/class.types';
import type { GroupResponse } from '../../../../types/group.types';
import type { ProjectResponse } from '../../../../types/project.types';
import ConfirmDialog from '../../../../components/common/ConfirmDialog/ConfirmDialog';
import AssignGroupDialog from '../components/AssignGroupDialog';

interface Props {
    classId: number;
    students: StudentInClassResponse[];
    groups: GroupResponse[];
    projects: ProjectResponse[];
    onRefresh: () => void;
}

const StudentsTab: React.FC<Props> = ({ classId, students, groups, projects, onRefresh }) => {
    const [deleteTarget, setDeleteTarget] = useState<StudentInClassResponse | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [assignTarget, setAssignTarget] = useState<StudentInClassResponse | null>(null);

    const sorted = [...students].sort((a, b) => {
        if (!a.groupId && b.groupId) return 1;
        if (a.groupId && !b.groupId) return -1;
        return (a.groupName || '').localeCompare(b.groupName || '');
    });

    const handleDelete = async () => {
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

    const handleAssignGroup = async (groupId: number) => {
        if (!assignTarget) return;
        await groupService.addMember(classId, groupId, assignTarget.studentId);
        toast.success(`Đã gán ${assignTarget.fullName} vào nhóm!`);
        setAssignTarget(null);
        onRefresh();
    };

    return (
        <>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                {['#', 'Mã SV', 'Họ tên', 'Email', 'Nhóm', 'Project', 'Hành động'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sorted.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Chưa có sinh viên nào trong lớp
                                    </TableCell>
                                </TableRow>
                            ) : sorted.map((s, i) => {
                                const proj = projects.find(p => p.groupId === s.groupId);
                                const grp = groups.find(g => g.id === s.groupId);
                                const isLeader = grp?.teamLeaderId === s.studentId;
                                return (
                                    <TableRow key={s.enrollmentId} hover>
                                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                                {s.studentCode || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {isLeader && <StarIcon fontSize="small" sx={{ color: '#ffa726' }} />}
                                                <Typography variant="body2" fontWeight={isLeader ? 600 : 500}>{s.fullName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{s.email}</TableCell>
                                        <TableCell>
                                            {s.groupName ? (
                                                <Typography variant="body2" fontWeight={500}>{s.groupName}</Typography>
                                            ) : (
                                                <Tooltip title="Gán vào nhóm">
                                                    <Chip label="Chưa có nhóm" size="small" variant="outlined" color="warning"
                                                        onClick={() => setAssignTarget(s)} sx={{ cursor: 'pointer' }} />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {proj ? (
                                                <Typography variant="body2" color="text.secondary">{proj.projectName}</Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa có</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Xóa khỏi lớp">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(s)}>
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

            <AssignGroupDialog
                student={assignTarget}
                groups={groups}
                onClose={() => setAssignTarget(null)}
                onSubmit={handleAssignGroup}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xác nhận xóa"
                message={<>Xóa <strong>{deleteTarget?.fullName}</strong> khỏi lớp?</>}
                confirmLabel="Xóa"
                severity="error"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
};

export default StudentsTab;
