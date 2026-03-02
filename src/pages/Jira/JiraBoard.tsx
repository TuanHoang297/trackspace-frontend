import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, Paper, Skeleton,
    Tooltip, IconButton, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import useJira from '../../hooks/useJira';
import jiraService from '../../api/services/jiraService';
import { toast } from 'react-toastify';
import IssueCard from './components/IssueCard';
import CreateIssueDialog from './components/CreateIssueDialog';
import IssueDetailDialog from './components/IssueDetailDialog';
import SprintDialog from './components/SprintDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import projectService from '../../api/services/projectService';
import groupService from '../../api/services/groupService';
import type { JiraIssueResponse, JiraSprintResponse, JiraSprintRequest } from '../../types/jira.types';

const JiraBoard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);

    const { connection, sprints, issues, loading, refresh } = useJira(pid);

    // Role-based permissions (Jira-style)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role || '';
    const isLeader = role === 'TEAMLEADER';
    const isMember = role === 'TEAMMEMBER';
    const canManageConnection = isLeader;           // Only Team Leader can Connect/Sync/Disconnect
    const canCreateIssue = isLeader || isMember;    // Only team members can create issues/sprints
    const canUpdateStatus = isLeader || isMember;   // Only team members can update status

    // State
    const [syncing, setSyncing] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [detailIssue, setDetailIssue] = useState<JiraIssueResponse | null>(null);
    const [members, setMembers] = useState<Array<{ userId: number; fullName: string }>>([]);

    // Sprint CRUD state
    const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<JiraSprintResponse | null>(null);
    const [deleteSprintId, setDeleteSprintId] = useState<number | null>(null);

    // Fetch group members for assignee dropdown
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const projRes = await projectService.getProjectById(pid);
                const project = projRes.data.data;
                if (project?.classId && project?.groupId) {
                    const memRes = await groupService.getMembers(project.classId, project.groupId);
                    setMembers((memRes.data.data || []).map(m => ({
                        userId: m.userId,
                        fullName: m.fullName,
                    })));
                }
            } catch {
                // Members loading is best-effort
            }
        };
        if (pid) fetchMembers();
    }, [pid]);
    const [disconnectOpen, setDisconnectOpen] = useState(false);

    // Group issues by sprint
    const sprintColumns = useMemo(() => {
        return sprints.map(sprint => ({
            sprint,
            issues: issues.filter(i => i.sprintId === sprint.sprintId),
        }));
    }, [sprints, issues]);

    // Backlog = issues without sprint
    const backlogIssues = useMemo(
        () => issues.filter(i => !i.sprintId),
        [issues]
    );

    // Not connected
    if (!loading && !connection) {
        return (
            <Box sx={{ textAlign: 'center', mt: 8, px: 3 }}>
                <Box sx={{
                    width: 80, height: 80, mx: 'auto', mb: 3,
                    borderRadius: '50%', bgcolor: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <SyncIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Chưa kết nối Jira</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Liên kết Jira Cloud để quản lý Sprints và Issues tại đây
                </Typography>
                {canManageConnection ? (
                    <Button
                        variant="contained" size="large"
                        onClick={() => navigate(`/projects/${pid}/jira/connect`)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)' }}
                    >
                        Kết nối Jira ngay
                    </Button>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Yêu cầu Team Leader kết nối Jira để bắt đầu
                    </Typography>
                )}
            </Box>
        );
    }

    const handleSync = async () => {
        try {
            setSyncing(true);
            await jiraService.sync({ projectId: pid });
            toast.success('Đồng bộ hoàn tất!');
            refresh();
        } catch {
            toast.error('Đồng bộ thất bại');
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await jiraService.disconnect(pid);
            toast.success('Đã ngắt kết nối Jira');
            setDisconnectOpen(false);
            refresh();
        } catch {
            toast.error('Không thể ngắt kết nối');
        }
    };

    // Sprint CRUD handlers
    const handleCreateSprint = async (data: JiraSprintRequest) => {
        await jiraService.createSprint(data);
        toast.success('Tạo Sprint thành công!');
    };

    const handleUpdateSprint = async (data: JiraSprintRequest) => {
        if (!editingSprint) return;
        await jiraService.updateSprint(editingSprint.sprintId, data);
        toast.success('Cập nhật Sprint thành công!');
    };

    const handleDeleteSprint = async () => {
        if (deleteSprintId === null) return;
        try {
            await jiraService.deleteSprint(deleteSprintId);
            toast.success('Đã xóa Sprint');
            setDeleteSprintId(null);
            refresh();
        } catch {
            toast.error('Không thể xóa Sprint');
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box component="span" sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: connection?.connectionStatus === 'CONNECTED' ? '#36B37E' : '#FF5630',
                            display: 'inline-block',
                        }} />
                        Sprint Board
                    </Typography>
                    {connection && (
                        <Typography variant="caption" color="text.secondary">
                            {connection.projectKey} • {connection.totalSprints} sprints • {connection.totalIssues} issues •
                            Sync: {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString('vi-VN') : 'chưa'}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {canCreateIssue && (
                        <>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                                Tạo Issue
                            </Button>
                            <Button variant="outlined" startIcon={<AddIcon />}
                                onClick={() => { setEditingSprint(null); setSprintDialogOpen(true); }}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                                Tạo Sprint
                            </Button>
                        </>
                    )}
                    {canManageConnection && (
                        <>
                            <Tooltip title="Đồng bộ từ Jira">
                                <IconButton onClick={handleSync} disabled={syncing}
                                    sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <SyncIcon sx={{
                                        animation: syncing ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': { from: { transform: 'rotate(0)' }, to: { transform: 'rotate(360deg)' } },
                                    }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Ngắt kết nối Jira">
                                <IconButton onClick={() => setDisconnectOpen(true)} color="error"
                                    sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <LinkOffIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            </Box>

            {/* Sprint Columns — Horizontal Scroll */}
            {loading ? (
                <Box sx={{ display: 'flex', gap: 2, overflow: 'hidden' }}>
                    {[1, 2, 3, 4].map(i => (
                        <Paper key={i} sx={{ p: 2, minWidth: 300, borderRadius: 3 }}>
                            <Skeleton width="70%" height={24} sx={{ mb: 2 }} />
                            {[1, 2, 3].map(j => <Skeleton key={j} height={90} sx={{ mb: 1, borderRadius: 2 }} />)}
                        </Paper>
                    ))}
                </Box>
            ) : (
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    flex: 1,
                    pb: 2,
                    // Custom scrollbar
                    '&::-webkit-scrollbar': { height: 8 },
                    '&::-webkit-scrollbar-track': { bgcolor: '#f1f1f1', borderRadius: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#c1c1c1', borderRadius: 4 },
                }}>
                    {sprintColumns.map(({ sprint, issues: sprintIssues }) => {
                        const doneCount = sprintIssues.filter(i => i.status === 'Done').length;
                        const progress = sprintIssues.length > 0 ? Math.round((doneCount / sprintIssues.length) * 100) : 0;
                        const isActive = sprint.status === 'ACTIVE';

                        return (
                            <Paper
                                key={sprint.sprintId}
                                elevation={0}
                                sx={{
                                    minWidth: 300,
                                    maxWidth: 320,
                                    borderRadius: 3,
                                    border: '2px solid',
                                    borderColor: isActive ? '#36B37E' : 'divider',
                                    bgcolor: isActive ? '#F0FFF4' : '#FAFBFC',
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Sprint Header */}
                                <Box sx={{ p: 2, pb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
                                        }}>
                                            {sprint.sprintName}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                            <Chip
                                                label={sprint.status}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                                                    bgcolor: isActive ? '#C6F6D5' : sprint.status === 'CLOSED' ? '#E3FCEF' : '#EDF2F7',
                                                    color: isActive ? '#22543D' : sprint.status === 'CLOSED' ? '#006644' : '#42526E',
                                                }}
                                            />
                                            {canManageConnection && (
                                                <IconButton size="small" onClick={() => { setEditingSprint(sprint); setSprintDialogOpen(true); }}>
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Dates */}
                                    {(sprint.startDate || sprint.endDate) && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                            <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Progress */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                                flex: 1, height: 6, borderRadius: 3,
                                                bgcolor: '#E2E8F0',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 3,
                                                    bgcolor: progress >= 80 ? '#36B37E' : progress >= 40 ? '#FFAB00' : '#FF5630',
                                                },
                                            }}
                                        />
                                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                                            {progress}%
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.disabled">
                                        {doneCount}/{sprintIssues.length} issues hoàn thành
                                    </Typography>
                                </Box>

                                {/* Issues List */}
                                <Box sx={{ px: 1.5, pb: 1.5, flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
                                    {sprintIssues.length === 0 ? (
                                        <Typography variant="caption" color="text.disabled" sx={{
                                            display: 'block', textAlign: 'center', py: 4,
                                        }}>
                                            Chưa có issue
                                        </Typography>
                                    ) : (
                                        sprintIssues.map(issue => (
                                            <IssueCard
                                                key={issue.issueId}
                                                issue={issue}
                                                onClick={setDetailIssue}
                                            />
                                        ))
                                    )}
                                </Box>

                                {/* Add Issue Footer */}
                                {canCreateIssue && (
                                    <Box sx={{
                                        p: 1.5, pt: 0, borderTop: '1px dashed', borderColor: 'divider',
                                    }}>
                                        <Button
                                            fullWidth size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => setCreateOpen(true)}
                                            sx={{
                                                textTransform: 'none', color: 'text.secondary',
                                                justifyContent: 'flex-start', fontWeight: 500,
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            Thêm thẻ
                                        </Button>
                                    </Box>
                                )}
                            </Paper>
                        );
                    })}

                    {/* Backlog Column */}
                    {backlogIssues.length > 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                minWidth: 300, maxWidth: 320,
                                borderRadius: 3, border: '2px dashed', borderColor: 'divider',
                                bgcolor: '#FAFBFC',
                                flexShrink: 0,
                                display: 'flex', flexDirection: 'column',
                            }}
                        >
                            <Box sx={{ p: 2, pb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                                    Backlog
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    {backlogIssues.length} issues chưa gán sprint
                                </Typography>
                            </Box>
                            <Box sx={{ px: 1.5, pb: 1.5, flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
                                {backlogIssues.map(issue => (
                                    <IssueCard key={issue.issueId} issue={issue} onClick={setDetailIssue} />
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* Empty state */}
                    {sprintColumns.length === 0 && backlogIssues.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
                            <Typography variant="h6" color="text.secondary" fontWeight={600}>
                                Chưa có Sprint nào
                            </Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                                Nhấn "Đồng bộ từ Jira" để lấy dữ liệu Sprint và Issues
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Dialogs */}
            <CreateIssueDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { setCreateOpen(false); refresh(); }}
                projectId={pid}
                sprints={sprints}
            />
            <IssueDetailDialog
                open={!!detailIssue}
                onClose={() => setDetailIssue(null)}
                issue={detailIssue}
                onUpdated={() => { setDetailIssue(null); refresh(); }}
                canEdit={canCreateIssue}
                canUpdateStatus={canUpdateStatus}
                members={members}
            />
            <SprintDialog
                open={sprintDialogOpen}
                onClose={() => { setSprintDialogOpen(false); setEditingSprint(null); }}
                onSaved={() => { setSprintDialogOpen(false); setEditingSprint(null); refresh(); }}
                projectId={pid}
                sprint={editingSprint}
                onSubmit={editingSprint ? handleUpdateSprint : handleCreateSprint}
                onDelete={editingSprint ? () => {
                    setSprintDialogOpen(false);
                    setDeleteSprintId(editingSprint.sprintId);
                } : undefined}
            />
            <ConfirmDialog
                open={disconnectOpen}
                title="Ngắt kết nối Jira?"
                message="Dữ liệu sprint và issue sẽ bị xóa khỏi TrackSpace. Action này không thể hoàn tác."
                onConfirm={handleDisconnect}
                onCancel={() => setDisconnectOpen(false)}
            />
            <ConfirmDialog
                open={deleteSprintId !== null}
                title="Xóa Sprint?"
                message="Sprint sẽ bị xóa khỏi Jira. Các issue trong sprint sẽ chuyển về Backlog."
                onConfirm={handleDeleteSprint}
                onCancel={() => setDeleteSprintId(null)}
            />
        </Box>
    );
};

export default JiraBoard;
