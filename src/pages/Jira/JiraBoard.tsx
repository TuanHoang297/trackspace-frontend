import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, Paper, Skeleton,
    Tooltip, IconButton, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

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
import {
    DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
    type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

/* ── Draggable Issue Wrapper ── */
const DraggableIssue: React.FC<{
    issue: JiraIssueResponse;
    onClick: (issue: JiraIssueResponse) => void;
    disabled?: boolean;
}> = ({ issue, onClick, disabled }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `issue-${issue.issueId}`,
        data: { issue },
        disabled,
    });
    const style: React.CSSProperties = {
        ...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}),
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        opacity: isDragging ? 0.3 : 1,
        cursor: disabled ? 'default' : 'grab',
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...(disabled ? {} : { ...listeners, ...attributes })}
        >
            <IssueCard issue={issue} onClick={onClick} />
        </Box>
    );
};

/* ── Droppable Sprint Column Wrapper ── */
const DroppableSprint: React.FC<{
    sprintId: number | null; // null = backlog
    children: React.ReactNode;
}> = ({ sprintId, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: sprintId !== null ? `sprint-${sprintId}` : 'backlog',
    });
    return (
        <Box
            ref={setNodeRef}
            sx={{
                flex: 1, minHeight: 0,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                transition: 'background-color 0.2s',
                bgcolor: isOver ? 'rgba(59,130,246,0.06)' : 'transparent',
                borderRadius: 2,
                border: isOver ? '2px dashed #3B82F6' : '2px dashed transparent',
            }}
        >
            {children}
        </Box>
    );
};

const JiraBoard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);

    const { connection, sprints, issues, setIssues, loading, refresh, loadLocal } = useJira(pid);

    // Role-based permissions (Jira-style)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role || '';
    const isLeader = role === 'TEAMLEADER';
    const isMember = role === 'TEAMMEMBER';
    const canManageConnection = isLeader;                // Only Team Leader can Disconnect
    const canCreateIssue = isLeader || isMember;         // Only team members can create issues/sprints
    const canUpdateStatus = isLeader || isMember;        // Only team members can update status

    // State
    const [createOpen, setCreateOpen] = useState(false);
    const [detailIssue, setDetailIssue] = useState<JiraIssueResponse | null>(null);
    const [members, setMembers] = useState<Array<{ userId: number; fullName: string }>>([]);

    // Sprint CRUD state
    const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<JiraSprintResponse | null>(null);
    const [deleteSprintId, setDeleteSprintId] = useState<number | null>(null);

    // Sprint status change
    const [statusConfirm, setStatusConfirm] = useState<{
        sprint: JiraSprintResponse;
        targetStatus: 'ACTIVE' | 'CLOSED';
    } | null>(null);
    const [statusChanging, setStatusChanging] = useState(false);
    const [startSprintDates, setStartSprintDates] = useState({ startDate: '', endDate: '' });

    // DnD state
    const [activeIssue, setActiveIssue] = useState<JiraIssueResponse | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const issue = event.active.data.current?.issue as JiraIssueResponse | undefined;
        if (issue) setActiveIssue(issue);
    }, []);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        setActiveIssue(null);
        const { active, over } = event;
        if (!over) return;

        const issue = active.data.current?.issue as JiraIssueResponse;
        if (!issue) return;

        // Parse target sprint ID
        const overId = String(over.id);
        let targetSprintId: number | null = null;
        if (overId === 'backlog') {
            targetSprintId = null;
        } else if (overId.startsWith('sprint-')) {
            targetSprintId = Number(overId.replace('sprint-', ''));
        } else if (overId.startsWith('issue-')) {
            // Dropped on another issue — find that issue's sprint
            const targetIssueId = Number(overId.replace('issue-', ''));
            const targetIssue = issues.find(i => i.issueId === targetIssueId);
            targetSprintId = targetIssue?.sprintId ?? null;
        } else {
            return;
        }

        if (issue.sprintId === targetSprintId) return;

        // Optimistic update — move issue immediately in UI
        const prevIssues = [...issues];
        setIssues(prev => prev.map(i =>
            i.issueId === issue.issueId ? { ...i, sprintId: targetSprintId } : i
        ));

        try {
            await jiraService.updateIssue(issue.issueId, {
                projectId: pid,
                sprintId: targetSprintId ?? undefined,
                issueType: issue.issueType,
                summary: issue.summary,
                description: issue.description ?? undefined,
                priority: issue.priority,
            });
            const targetName = targetSprintId
                ? sprints.find(s => s.sprintId === targetSprintId)?.sprintName || 'Sprint'
                : 'Backlog';
            toast.success(`Đã chuyển ${issue.issueKey} → ${targetName}`);
        } catch {
            setIssues(prevIssues);
            toast.error(`Không thể chuyển ${issue.issueKey}`);
        }
    }, [pid, sprints, issues, setIssues, refresh]);

    // Pre-fill dates when opening Start Sprint dialog
    useEffect(() => {
        if (statusConfirm?.targetStatus === 'ACTIVE') {
            setStartSprintDates({
                startDate: statusConfirm.sprint.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                endDate: statusConfirm.sprint.endDate?.slice(0, 10) || '',
            });
        }
    }, [statusConfirm]);

    const handleStatusChange = async (overrideDates?: { startDate: string; endDate: string }) => {
        if (!statusConfirm) return;
        setStatusChanging(true);
        const dates = overrideDates || {
            startDate: statusConfirm.sprint.startDate || undefined,
            endDate: statusConfirm.sprint.endDate || undefined,
        };
        try {
            await jiraService.updateSprint(statusConfirm.sprint.sprintId, {
                projectId: pid,
                name: statusConfirm.sprint.sprintName,
                startDate: dates.startDate || undefined,
                endDate: dates.endDate || undefined,
                goal: statusConfirm.sprint.sprintGoal || undefined,
                status: statusConfirm.targetStatus,
            });
            toast.success(
                statusConfirm.targetStatus === 'ACTIVE' ? 'Sprint đã được bắt đầu!' : 'Sprint đã hoàn thành!'
            );
            setStatusConfirm(null);
            refresh();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || 'Thao tác thất bại — Jira từ chối thay đổi trạng thái';
            toast.error(msg);
        } finally {
            setStatusChanging(false);
        }
    };

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

    // Sort: ACTIVE → CLOSED → FUTURE, then by sprintId ascending
    const sprintColumns = useMemo(() => {
        const statusOrder: Record<string, number> = { ACTIVE: 0, CLOSED: 1, FUTURE: 2 };
        const sorted = [...sprints].sort((a, b) => {
            const oa = statusOrder[a.status] ?? 9;
            const ob = statusOrder[b.status] ?? 9;
            if (oa !== ob) return oa - ob;
            return a.sprintId - b.sprintId;
        });
        return sorted.map(sprint => ({
            sprint,
            issues: issues.filter(i => i.sprintId === sprint.sprintId),
        }));
    }, [sprints, issues]);

    // Backlog = issues without sprint
    const backlogIssues = useMemo(
        () => issues.filter(i => !i.sprintId),
        [issues]
    );

    // Not connected — redirect to connect page
    const isConnected = connection?.connectionStatus === 'CONNECTED';
    if (!loading && (!connection || !isConnected)) {
        navigate(`/projects/${pid}/jira/connect`, { replace: true });
        return null;
    }



    const handleDisconnect = async () => {
        try {
            await jiraService.disconnect(pid);
            toast.success('Đã ngắt kết nối Jira');
            setDisconnectOpen(false);
            navigate(`/projects/${pid}/jira/connect`);
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
        console.log('=== handleUpdateSprint ===', { editingSprint, data });
        if (!editingSprint) {
            console.error('editingSprint is NULL — skipping update!');
            return;
        }
        try {
            console.log('Calling jiraService.updateSprint with sprintId:', editingSprint.sprintId);
            const res = await jiraService.updateSprint(editingSprint.sprintId, data);
            console.log('=== updateSprint RESPONSE ===', res.data);
            toast.success(data.status ? 'Đã cập nhật trạng thái Sprint!' : 'Cập nhật Sprint thành công!');
        } catch (err: unknown) {
            console.error('=== updateSprint ERROR ===', err);
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || 'Cập nhật Sprint thất bại';
            toast.error(msg);
            throw err; // re-throw so SprintDialog stays open
        }
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
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } }}>
                        <Box component="span" sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: connection?.connectionStatus === 'CONNECTED' ? '#36B37E' : '#FF5630',
                            display: 'inline-block',
                        }} />
                        Sprint Board
                    </Typography>
                    {connection && (
                        <Typography variant="caption" color="text.secondary">
                            {connection.projectKey} • {connection.totalSprints} sprints • {connection.totalIssues} issues
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {canCreateIssue && (
                        <>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1.5, sm: 2 } }}>
                                Tạo Issue
                            </Button>
                            <Button variant="outlined" startIcon={<AddIcon />}
                                onClick={() => { setEditingSprint(null); setSprintDialogOpen(true); }}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1.5, sm: 2 } }}>
                                Tạo Sprint
                            </Button>
                        </>
                    )}
                    {canManageConnection && (
                        <Tooltip title="Ngắt kết nối Jira">
                            <IconButton onClick={() => setDisconnectOpen(true)} color="error"
                                sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                <LinkOffIcon />
                            </IconButton>
                        </Tooltip>
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <Box sx={{
                        display: 'flex',
                        gap: { xs: 1.5, sm: 2 },
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        flex: 1,
                        minHeight: 0,
                        pb: 1,
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
                                        minWidth: { xs: 260, sm: 280, md: 300 },
                                        maxWidth: { xs: 280, sm: 300, md: 320 },
                                        height: '100%',
                                        borderRadius: 3,
                                        border: '2px solid',
                                        borderColor: isActive ? '#36B37E' : 'divider',
                                        bgcolor: isActive ? '#F0FFF4' : '#FAFBFC',
                                        flexShrink: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
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
                                                    onClick={canManageConnection && sprint.status !== 'CLOSED' ? () => {
                                                        setStatusConfirm({
                                                            sprint,
                                                            targetStatus: sprint.status === 'FUTURE' ? 'ACTIVE' : 'CLOSED',
                                                        });
                                                    } : undefined}
                                                    sx={{
                                                        height: 20, fontSize: '0.6rem', fontWeight: 700,
                                                        bgcolor: isActive ? '#C6F6D5' : sprint.status === 'CLOSED' ? '#E3FCEF' : '#EDF2F7',
                                                        color: isActive ? '#22543D' : sprint.status === 'CLOSED' ? '#006644' : '#42526E',
                                                        cursor: canManageConnection && sprint.status !== 'CLOSED' ? 'pointer' : 'default',
                                                        transition: 'all 0.2s',
                                                        '&:hover': canManageConnection && sprint.status !== 'CLOSED' ? {
                                                            transform: 'scale(1.05)',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                        } : {},
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

                                    {/* Issues List — Droppable */}
                                    <DroppableSprint sprintId={sprint.sprintId}>
                                        <Box sx={{ px: 1.5, pb: 1.5, flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                            {sprintIssues.length === 0 ? (
                                                <Typography variant="caption" color="text.disabled" sx={{
                                                    display: 'block', textAlign: 'center', py: 4,
                                                }}>
                                                    Kéo issue vào đây
                                                </Typography>
                                            ) : (
                                                sprintIssues.map(issue => (
                                                    <DraggableIssue
                                                        key={issue.issueId}
                                                        issue={issue}
                                                        onClick={setDetailIssue}
                                                        disabled={!canCreateIssue}
                                                    />
                                                ))
                                            )}
                                        </Box>
                                    </DroppableSprint>

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
                                    minWidth: { xs: 260, sm: 280, md: 300 }, maxWidth: { xs: 280, sm: 300, md: 320 },
                                    height: '100%',
                                    borderRadius: 3, border: '2px dashed', borderColor: 'divider',
                                    bgcolor: '#FAFBFC',
                                    flexShrink: 0,
                                    display: 'flex', flexDirection: 'column',
                                    overflow: 'hidden',
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
                                <DroppableSprint sprintId={null}>
                                    <Box sx={{ px: 1.5, pb: 1.5, flex: 1, overflowY: 'auto', minHeight: 60 }}>
                                        {backlogIssues.map(issue => (
                                            <DraggableIssue key={issue.issueId} issue={issue} onClick={setDetailIssue} disabled={!canCreateIssue} />
                                        ))}
                                    </Box>
                                </DroppableSprint>
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

                    {/* Drag Overlay */}
                    <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                        {activeIssue && (
                            <Box sx={{
                                width: 290,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                                borderRadius: 2,
                                cursor: 'grabbing',
                            }}>
                                <IssueCard issue={activeIssue} onClick={() => { }} />
                            </Box>
                        )}
                    </DragOverlay>
                </DndContext>
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
                onSaved={() => { setSprintDialogOpen(false); setEditingSprint(null); loadLocal(); }}
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
            {/* Start Sprint Dialog — with date fields like Jira */}
            <Dialog open={!!statusConfirm && statusConfirm.targetStatus === 'ACTIVE'}
                onClose={() => setStatusConfirm(null)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Start Sprint</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {statusConfirm?.sprint.sprintName}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Ngày bắt đầu" type="date" size="small" fullWidth required
                            value={startSprintDates.startDate}
                            onChange={e => setStartSprintDates(d => ({ ...d, startDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                        <TextField label="Ngày kết thúc" type="date" size="small" fullWidth required
                            value={startSprintDates.endDate}
                            onChange={e => setStartSprintDates(d => ({ ...d, endDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setStatusConfirm(null)} disabled={statusChanging}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={() => handleStatusChange(startSprintDates)}
                        disabled={statusChanging || !startSprintDates.startDate || !startSprintDates.endDate}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#36B37E', '&:hover': { bgcolor: '#2D9A6E' } }}>
                        {statusChanging ? 'Đang xử lý...' : 'Start Sprint'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Complete Sprint — simple confirm */}
            <ConfirmDialog
                open={!!statusConfirm && statusConfirm.targetStatus === 'CLOSED'}
                title="Complete Sprint?"
                message={`Bạn có chắc muốn hoàn thành "${statusConfirm?.sprint.sprintName}"? Sprint sẽ được đóng lại.`}
                onConfirm={() => handleStatusChange()}
                onCancel={() => setStatusConfirm(null)}
                confirmLabel="Complete Sprint"
                severity="info"
                loading={statusChanging}
            />
        </Box>
    );
};

export default JiraBoard;
