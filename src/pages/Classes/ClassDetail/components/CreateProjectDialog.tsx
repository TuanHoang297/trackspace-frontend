import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { toast } from 'react-toastify';
import projectService from '../../../../api/services/projectService';
import type { GroupResponse } from '../../../../types/group.types';
import type { ProjectResponse } from '../../../../types/project.types';

interface Props {
    open: boolean;
    groups: GroupResponse[];
    projects: ProjectResponse[];
    onClose: () => void;
    onCreated: () => void;
}

const CreateProjectDialog: React.FC<Props> = ({ open, groups, projects, onClose, onCreated }) => {
    const [groupId, setGroupId] = useState<number | ''>('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const availableGroups = groups.filter(g => !projects.some(p => p.groupId === g.id));

    const handleSubmit = async () => {
        if (!groupId || !name) {
            toast.error('Vui lòng chọn nhóm và nhập tên project');
            return;
        }
        try {
            setLoading(true);
            await projectService.createProject(groupId as number, { projectName: name });
            toast.success('Tạo project thành công!');
            setGroupId(''); setName('');
            onCreated();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo project thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo Project mới</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    <FormControl fullWidth>
                        <InputLabel>Chọn nhóm</InputLabel>
                        <Select value={groupId} label="Chọn nhóm"
                            onChange={(e) => setGroupId(e.target.value as number)} sx={{ borderRadius: 2 }}>
                            {availableGroups.map(g => (
                                <MenuItem key={g.id} value={g.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <GroupsIcon fontSize="small" color="action" />
                                        {g.groupName}
                                        <Chip label={`${g.totalMembers} thành viên`} size="small" sx={{ ml: 'auto' }} />
                                    </Box>
                                </MenuItem>
                            ))}
                            {availableGroups.length === 0 && <MenuItem disabled>Tất cả nhóm đã có project</MenuItem>}
                        </Select>
                    </FormControl>
                    <TextField label="Tên Project" fullWidth value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Hệ thống quản lý bán hàng"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit}
                    disabled={loading || !groupId || !name} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    {loading ? 'Đang tạo...' : 'Tạo Project'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateProjectDialog;
