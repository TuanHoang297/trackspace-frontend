import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Chip, Avatar, IconButton,
    TextField, MenuItem, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import BugReportIcon from '@mui/icons-material/BugReport';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SaveIcon from '@mui/icons-material/Save';
import jiraService from '../../../api/services/jiraService';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../../components/common/ConfirmDialog/ConfirmDialog';
import type { JiraIssueResponse } from '../../../types/jira.types';

const TYPE_ICONS: Record<string, React.ReactElement> = {
    EPIC: <AccountTreeIcon sx={{ color: '#8B5CF6' }} />,
    STORY: <AutoStoriesIcon sx={{ color: '#10B981' }} />,
    TASK: <TaskAltIcon sx={{ color: '#3B82F6' }} />,
    BUG: <BugReportIcon sx={{ color: '#EF4444' }} />,
};

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    'To Do': { bg: '#DFE1E6', color: '#42526E' },
    'In Progress': { bg: '#EFF6FF', color: '#3B82F6' },
    'Done': { bg: '#E3FCEF', color: '#006644' },
};

interface JiraUser {
    accountId: string;
    displayName: string;
    emailAddress: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    issue: JiraIssueResponse | null;
    onUpdated: () => void;
    canEdit: boolean;
    canUpdateStatus: boolean;
    members?: Array<{ userId: number; fullName: string }>;
}

const IssueDetailDialog: React.FC<Props> = ({
    open, onClose, issue, onUpdated, canEdit, canUpdateStatus, members,
}) => {
    const [statusLoading, setStatusLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dirty, setDirty] = useState(false);

    const [jiraUsers, setJiraUsers] = useState<JiraUser[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    useEffect(() => {
        if (issue) {
            setSummary(issue.summary);
            setDescription(issue.description || '');
            setPriority(issue.priority || 'Medium');
            setDueDate(issue.dueDate?.slice(0, 10) || '');
            setSelectedAccountId(issue.jiraAccountId || '');
            setDirty(false);
        }
    }, [issue]);

    useEffect(() => {
        if (open && issue && canEdit) {
            jiraService.getAssignableUsers(issue.projectId)
                .then(res => { setJiraUsers(res.data?.data || []); })
                .catch(() => { setJiraUsers([]); });
        }
    }, [open, issue?.projectId, canEdit]);

    if (!issue) return null;

    const statusStyle = STATUS_COLORS[issue.status] || STATUS_COLORS['To Do'];
    const typeIcon = TYPE_ICONS[issue.issueType] || TYPE_ICONS.TASK;

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === issue.status) return;
        try {
            setStatusLoading(true);
            await jiraService.updateStatus(issue.issueId, newStatus);
            toast.success(`Chuyển trạng thái → ${newStatus}`);
            onUpdated();
        } catch { toast.error('Không thể cập nhật trạng thái'); }
        finally { setStatusLoading(false); }
    };

    const handleAssign = async (accountId: string) => {
        if (!accountId) return;
        const user = jiraUsers.find(u => u.accountId === accountId);
        if (!user) return;
        // Try to find matching TrackSpace userId by fullName == displayName
        const matchedMember = members?.find(
            m => m.fullName.trim().toLowerCase() === user.displayName?.trim().toLowerCase()
        );
        try {
            setAssignLoading(true);
            await jiraService.assignIssue(issue.issueId, accountId, user.displayName, matchedMember?.userId);
            toast.success(`Đã gán cho ${user.displayName}!`);
            setSelectedAccountId(accountId);
            onUpdated();
        } catch { toast.error('Không thể phân công'); }
        finally { setAssignLoading(false); }
    };

    const handleDelete = async () => {
        if (deleteLoading) return; // guard duplicate calls
        try {
            setDeleteLoading(true);
            await jiraService.deleteIssue(issue.issueId);
            toast.success('Đã xóa issue thành công!');
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                toast.success('Issue đã được xóa');
            } else {
                console.error('Delete issue error:', err);
                toast.error('Không thể xóa issue');
                setDeleteLoading(false);
                return;
            }
        }
        setDeleteLoading(false);
        setDeleteConfirm(false);
        onClose();
        // Delay refresh so toast stays visible
        setTimeout(() => onUpdated(), 500);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await jiraService.updateIssue(issue.issueId, {
                projectId: issue.projectId, issueType: issue.issueType,
                summary: summary.trim(), description: description.trim() || undefined,
                priority: priority || undefined, dueDate: dueDate || undefined,
            });
            toast.success('Cập nhật issue thành công');
            setDirty(false); onUpdated();
        } catch { toast.error('Không thể cập nhật issue'); }
        finally { setSaving(false); }
    };

    const markDirty = () => { if (!dirty) setDirty(true); };
    const formatDate = (d: string | null) => !d ? '—' : new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {typeIcon}
                        <Typography variant="caption" fontWeight={700} color="text.secondary">{issue.issueKey}</Typography>
                        <Chip label={issue.issueType} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                    </Box>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    {canEdit ? (
                        <TextField fullWidth size="small" value={summary}
                            onChange={e => { setSummary(e.target.value); markDirty(); }}
                            sx={{ mb: 2, mt: 1, '& .MuiInputBase-input': { fontWeight: 700, fontSize: '1.15rem' } }} />
                    ) : (
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, mt: 1, lineHeight: 1.3 }}>{issue.summary}</Typography>
                    )}

                    {/* Status */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Trạng thái</Typography>
                        {canUpdateStatus ? (
                            <TextField select size="small" fullWidth disabled={statusLoading} value={issue.status}
                                onChange={e => handleStatusChange(e.target.value)}
                                sx={{ '& .MuiSelect-select': { fontWeight: 600, color: statusStyle.color, bgcolor: statusStyle.bg, borderRadius: 1 } }}>
                                {STATUS_OPTIONS.map(s => (
                                    <MenuItem key={s} value={s}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[s]?.color }} />{s}
                                    </Box></MenuItem>
                                ))}
                            </TextField>
                        ) : <Chip label={issue.status} sx={{ fontWeight: 600, bgcolor: statusStyle.bg, color: statusStyle.color }} />}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Description */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Mô tả</Typography>
                        {canEdit ? (
                            <TextField fullWidth multiline rows={3} size="small" placeholder="Thêm mô tả..."
                                value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} />
                        ) : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{issue.description || 'Không có mô tả'}</Typography>}
                    </Box>

                    {/* Priority + Deadline */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                        <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Mức ưu tiên</Typography>
                            {canEdit ? (
                                <TextField select size="small" fullWidth value={priority} onChange={e => { setPriority(e.target.value); markDirty(); }}>
                                    {PRIORITY_OPTIONS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                </TextField>
                            ) : <Typography variant="body2" fontWeight={600}>{issue.priority}</Typography>}
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                <CalendarTodayIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />Deadline
                            </Typography>
                            {canEdit ? (
                                <TextField type="date" size="small" fullWidth value={dueDate}
                                    onChange={e => { setDueDate(e.target.value); markDirty(); }} InputLabelProps={{ shrink: true }} />
                            ) : <Typography variant="body2" fontWeight={600} color={issue.dueDate && new Date(issue.dueDate) < new Date() && issue.status !== 'Done' ? 'error.main' : 'text.primary'}>{formatDate(issue.dueDate)}</Typography>}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Assignee */}
                    <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            <PersonIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />Người phụ trách
                        </Typography>
                        {canEdit && jiraUsers.length > 0 ? (
                            <TextField select size="small" fullWidth disabled={assignLoading} value={selectedAccountId}
                                onChange={e => handleAssign(e.target.value)}>
                                <MenuItem value=""><em>Chưa gán</em></MenuItem>
                                {jiraUsers.map(u => (
                                    <MenuItem key={u.accountId} value={u.accountId}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#3B82F6' }}>{u.displayName?.charAt(0) || '?'}</Avatar>
                                            {u.displayName}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#3B82F6' }}>{issue.assigneeName?.charAt(0) || '?'}</Avatar>
                                <Typography variant="body2" fontWeight={500}>{issue.assigneeName || 'Chưa phân công'}</Typography>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.disabled">
                            Tạo lúc: {formatDate(issue.createdAt)} • Cập nhật: {formatDate(issue.updatedAt)}
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                    <Box>
                        {canEdit && (
                            <Button onClick={() => setDeleteConfirm(true)} color="error" startIcon={<DeleteIcon />}
                                sx={{ borderRadius: 2, textTransform: 'none' }}>Xóa</Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {canEdit && dirty && (
                            <Button variant="contained" onClick={handleSave} disabled={saving || !summary.trim()}
                                startIcon={<SaveIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        )}
                        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2, textTransform: 'none' }}>Đóng</Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <ConfirmDialog open={deleteConfirm} title="Xác nhận xóa issue"
                message={<>Bạn có chắc chắn muốn xóa issue <strong>{issue?.issueKey}</strong>? Issue sẽ bị xóa khỏi cả TrackSpace và Jira.</>}
                severity="error" confirmLabel="Xóa issue" loading={deleteLoading}
                onConfirm={handleDelete} onCancel={() => setDeleteConfirm(false)} />
        </>
    );
};

export default IssueDetailDialog;
