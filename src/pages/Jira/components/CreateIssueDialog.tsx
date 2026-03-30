import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Box, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { JiraIssueRequest } from '../../../types/jira.types';
import type { JiraSprintResponse } from '../../../types/jira.types';
import jiraService from '../../../api/services/jiraService';
import { toast } from 'react-toastify';

const ISSUE_TYPES = ['TASK', 'STORY', 'BUG', 'EPIC', 'SUBTASK'];
const PRIORITIES = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    projectId: number;
    sprints: JiraSprintResponse[];
    members?: Array<{ userId: number; fullName: string }>;
    defaultSprintId?: number | null;
}

const CreateIssueDialog: React.FC<Props> = ({
    open, onClose, onCreated, projectId, sprints, members = [], defaultSprintId,
}) => {
    const [form, setForm] = useState<Partial<JiraIssueRequest>>({
        projectId,
        issueType: 'TASK',
        priority: 'Medium',
        summary: '',
        description: '',
        sprintId: defaultSprintId ?? undefined,
    });
    const [loading, setLoading] = useState(false);

    // Sync defaultSprintId when dialog opens
    React.useEffect(() => {
        if (open && defaultSprintId !== undefined && defaultSprintId !== null) {
            setForm(prev => ({ ...prev, sprintId: defaultSprintId }));
        }
    }, [open, defaultSprintId]);

    const handleChange = (field: keyof JiraIssueRequest, value: unknown) => {
        // Không cho phép thay đổi issueType
        if (field === 'issueType') return;
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.summary?.trim()) {
            toast.warning('Vui lòng nhập Summary');
            return;
        }
        try {
            setLoading(true);
            await jiraService.createIssue({
                projectId,
                issueType: 'TASK', // Luôn là TASK
                summary: form.summary!,
                description: form.description,
                priority: form.priority,
                sprintId: form.sprintId,
                assigneeId: form.assigneeId,
                dueDate: form.dueDate,
            });
            toast.success('Tạo issue thành công!');
            onCreated();
            handleReset();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Không thể tạo issue';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({ projectId, issueType: 'TASK', priority: 'Medium', summary: '', description: '' });
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleReset} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" component="div" fontWeight={700}>Tạo Issue Mới</Typography>
                <IconButton onClick={handleReset} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                {/* Issue Type (TASK cố định) + Priority */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Loại Issue"
                        fullWidth
                        size="small"
                        value="TASK"
                        InputProps={{ readOnly: true }}
                        helperText="Chỉ cho phép tạo TASK"
                    />
                    <TextField
                        select label="Mức ưu tiên" fullWidth size="small"
                        value={form.priority || 'Medium'}
                        onChange={e => handleChange('priority', e.target.value)}
                    >
                        {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </TextField>
                </Box>

                {/* Summary */}
                <TextField
                    label="Summary *" fullWidth size="small"
                    placeholder="Viết tóm tắt nội dung issue..."
                    value={form.summary || ''}
                    onChange={e => handleChange('summary', e.target.value)}
                />

                {/* Description */}
                <TextField
                    label="Mô tả chi tiết" fullWidth multiline rows={3} size="small"
                    placeholder="Mô tả đầy đủ yêu cầu, acceptance criteria..."
                    value={form.description || ''}
                    onChange={e => handleChange('description', e.target.value)}
                />

                {/* Sprint + Assignee */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select label="Sprint" fullWidth size="small"
                        value={form.sprintId ?? ''}
                        onChange={e => handleChange('sprintId', e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <MenuItem value="">Không chọn</MenuItem>
                        {sprints.map(s => (
                            <MenuItem key={s.sprintId} value={s.sprintId}>{s.sprintName}</MenuItem>
                        ))}
                    </TextField>
                    {members.length > 0 && (
                        <TextField
                            select label="Người phụ trách" fullWidth size="small"
                            value={form.assigneeId ?? ''}
                            onChange={e => handleChange('assigneeId', e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <MenuItem value="">Chưa gán</MenuItem>
                            {members.map(m => (
                                <MenuItem key={m.userId} value={m.userId}>{m.fullName}</MenuItem>
                            ))}
                        </TextField>
                    )}
                </Box>

                {/* Due Date */}
                <TextField
                    label="Deadline" type="date" fullWidth size="small"
                    InputLabelProps={{ shrink: true }}
                    value={form.dueDate || ''}
                    onChange={e => handleChange('dueDate', e.target.value)}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleReset} color="inherit">Hủy</Button>
                <Button
                    onClick={handleSubmit} variant="contained" disabled={loading}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    {loading ? 'Đang tạo...' : 'Tạo Issue'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateIssueDialog;
