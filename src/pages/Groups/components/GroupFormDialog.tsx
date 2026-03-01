import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField,
} from '@mui/material';
import type { GroupResponse, CreateGroupRequest } from '../../../types/group.types';

interface Props {
    open: boolean;
    editTarget?: GroupResponse | null;   // null = Create mode, set = Edit mode
    onClose: () => void;
    onSubmit: (data: CreateGroupRequest) => Promise<void>;
}

const GroupFormDialog: React.FC<Props> = ({ open, editTarget, onClose, onSubmit }) => {
    const isEdit = !!editTarget;
    const [data, setData] = useState<CreateGroupRequest>({ groupName: '', description: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editTarget) {
            setData({ groupName: editTarget.groupName, description: editTarget.description || '' });
        } else {
            setData({ groupName: '', description: '' });
        }
    }, [editTarget, open]);

    const handleSubmit = async () => {
        if (!data.groupName.trim()) return;
        try {
            setLoading(true);
            await onSubmit(data);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                {isEdit ? `Sửa nhóm: ${editTarget?.groupName}` : 'Tạo nhóm mới'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <TextField label="Tên nhóm" fullWidth required value={data.groupName}
                        onChange={e => setData({ ...data, groupName: e.target.value })}
                        placeholder="Ví dụ: Nhóm 1"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField label="Mô tả (optional)" fullWidth multiline rows={3}
                        value={data.description || ''}
                        onChange={e => setData({ ...data, description: e.target.value })}
                        placeholder="Mô tả ngắn về nhóm..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit}
                    disabled={loading || !data.groupName.trim()} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : (isEdit ? 'Lưu thay đổi' : 'Tạo nhóm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GroupFormDialog;
