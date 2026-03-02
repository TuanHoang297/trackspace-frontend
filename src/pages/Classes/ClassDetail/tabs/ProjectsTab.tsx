import React, { useState } from 'react';
import {
    Box, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, Typography, Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import projectService from '../../../../api/services/projectService';
import type { ProjectResponse } from '../../../../types/project.types';
import type { GroupResponse } from '../../../../types/group.types';
import ConfirmDialog from '../../../../components/common/ConfirmDialog/ConfirmDialog';
import CreateProjectDialog from '../../../../pages/Classes/ClassDetail/components/CreateProjectDialog';
import { useRole } from '../../../../hooks/useRole';

interface Props {
    projects: ProjectResponse[];
    groups: GroupResponse[];
    onRefresh: () => void;
}

const ProjectsTab: React.FC<Props> = ({ projects, groups, onRefresh }) => {
    const navigate = useNavigate();
    const { isReadOnly } = useRole();
    const readOnly = isReadOnly();
    const [openCreate, setOpenCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ProjectResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await projectService.deleteProject(deleteTarget.id);
            toast.success('Đã xóa project');
            setDeleteTarget(null);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa thất bại');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {!readOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Tạo Project
                    </Button>
                </Box>
            )}

            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                {['#', 'Tên Project', 'Nhóm phụ trách', 'Team Leader', 'Thông tin', 'Hành động'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700 }}
                                        align={['Thông tin', 'Hành động'].includes(h) ? 'center' : 'left'}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Chưa có project nào. Hãy tạo project mới.
                                    </TableCell>
                                </TableRow>
                            ) : projects.map((p, i) => {
                                const group = groups.find(g => g.id === p.groupId);
                                return (
                                    <TableRow key={p.id} hover>
                                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{p.projectName}</TableCell>
                                        <TableCell><Chip label={p.groupName} size="small" variant="outlined" color="primary" /></TableCell>
                                        <TableCell>
                                            {group?.teamLeaderName ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <StarIcon fontSize="small" sx={{ color: '#ffa726' }} />
                                                    <Typography variant="body2">{group.teamLeaderName}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.disabled" fontStyle="italic">Chưa gán</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {p.hasProjectInfo
                                                ? <Chip label="Đã điền" color="success" size="small" />
                                                : <Chip label="Chưa có" size="small" variant="outlined" />}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Xem thông tin chi tiết">
                                                <IconButton size="small" color="info"
                                                    onClick={() => navigate(`/lecturer/projects/${p.id}/info`)}>
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {!readOnly && (
                                                <Tooltip title="Xóa Project">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <CreateProjectDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                groups={groups}
                projects={projects}
                onCreated={() => { setOpenCreate(false); onRefresh(); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xác nhận xóa Project"
                message={<>Xóa project <strong>{deleteTarget?.projectName}</strong> của nhóm <strong>{deleteTarget?.groupName}</strong>?</>}
                confirmLabel="Xóa Project"
                severity="error"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
};

export default ProjectsTab;
