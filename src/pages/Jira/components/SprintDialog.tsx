import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Divider, Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { JiraSprintResponse, JiraSprintRequest } from '../../../types/jira.types';

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    projectId: number;
    sprint?: JiraSprintResponse | null; // null = create mode
    onSubmit: (data: JiraSprintRequest) => Promise<void>;
    onDelete?: () => void; // only shown in edit mode
}

const SprintDialog: React.FC<Props> = ({ open, onClose, onSaved, projectId, sprint, onSubmit, onDelete }) => {
    const isEdit = !!sprint;
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sprint) {
            setName(sprint.sprintName);
            setStartDate(sprint.startDate?.slice(0, 10) || '');
            setEndDate(sprint.endDate?.slice(0, 10) || '');
            setGoal(sprint.sprintGoal || '');
        } else {
            setName(''); setStartDate(''); setEndDate(''); setGoal('');
        }
    }, [sprint, open]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await onSubmit({
                projectId,
                name: name.trim(),
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                goal: goal.trim() || undefined,
            });
            onSaved();
        } catch {
            // toast handled by caller
        } finally {
            setLoading(false);
        }
    };

    const statusColor = sprint?.status === 'ACTIVE' ? '#36B37E'
        : sprint?.status === 'CLOSED' ? '#6B7280' : '#64748B';
    const statusLabel = sprint?.status === 'ACTIVE' ? 'Active'
        : sprint?.status === 'CLOSED' ? 'Closed' : 'Future';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isEdit ? 'Chỉnh sửa Sprint' : 'Tạo Sprint mới'}
                {isEdit && sprint && (
                    <Chip
                        size="small"
                        label={statusLabel}
                        sx={{
                            bgcolor: `${statusColor}20`, color: statusColor,
                            fontWeight: 700, fontSize: '0.7rem',
                        }}
                    />
                )}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField label="Tên Sprint" value={name} onChange={e => setName(e.target.value)}
                        required fullWidth size="small" />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Ngày bắt đầu" type="date" value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }} fullWidth size="small" />
                        <TextField label="Ngày kết thúc" type="date" value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }} fullWidth size="small" />
                    </Box>
                    <TextField label="Mục tiêu Sprint" value={goal} onChange={e => setGoal(e.target.value)}
                        multiline rows={2} fullWidth size="small" />
                </Box>

                {/* Delete section — only in edit mode */}
                {isEdit && onDelete && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Button
                            color="error" size="small"
                            startIcon={<DeleteIcon />}
                            onClick={onDelete}
                            sx={{ textTransform: 'none' }}
                        >
                            Xóa Sprint này
                        </Button>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading || !name.trim()}
                    sx={{ borderRadius: 2 }}>
                    {loading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo Sprint'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SprintDialog;
