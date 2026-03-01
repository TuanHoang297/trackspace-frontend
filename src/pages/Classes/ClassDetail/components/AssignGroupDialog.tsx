import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem, Box, Chip,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import type { StudentInClassResponse } from '../../../../types/class.types';
import type { GroupResponse } from '../../../../types/group.types';

interface Props {
    student: StudentInClassResponse | null;
    groups: GroupResponse[];
    onClose: () => void;
    onSubmit: (groupId: number) => Promise<void>;
}

const AssignGroupDialog: React.FC<Props> = ({ student, groups, onClose, onSubmit }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedGroupId) return;
        try {
            setLoading(true);
            await onSubmit(selectedGroupId as number);
            setSelectedGroupId('');
        } catch { /* error handled in parent */ }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={!!student} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                Gán nhóm cho {student?.fullName}
                {student?.studentCode && <Chip label={student.studentCode} size="small" sx={{ ml: 1, fontFamily: 'monospace' }} />}
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Chọn nhóm</InputLabel>
                    <Select value={selectedGroupId} label="Chọn nhóm"
                        onChange={(e) => setSelectedGroupId(e.target.value as number)} sx={{ borderRadius: 2 }}>
                        {groups.map(g => (
                            <MenuItem key={g.id} value={g.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupsIcon fontSize="small" color="action" />
                                    {g.groupName}
                                    <Chip label={`${g.totalMembers} thành viên`} size="small" sx={{ ml: 'auto' }} />
                                </Box>
                            </MenuItem>
                        ))}
                        {groups.length === 0 && <MenuItem disabled>Chưa có nhóm nào trong lớp</MenuItem>}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit}
                    disabled={loading || !selectedGroupId} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang gán...' : 'Gán vào nhóm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignGroupDialog;
