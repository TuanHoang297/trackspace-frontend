import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Chip, IconButton, Tooltip,
    Table, TableBody, TableCell, TableHead, TableRow,
    Skeleton, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import groupService from '../../../api/services/groupService';
import type { GroupResponse, GroupMemberResponse } from '../../../types/group.types';
import type { StudentInClassResponse } from '../../../types/class.types';

interface Props {
    classId: number;
    group: GroupResponse | null;
    students: StudentInClassResponse[];
    onClose: () => void;
    onRefresh: () => void;
}

const MembersDialog: React.FC<Props> = ({ classId, group, students, onClose, onRefresh }) => {
    const [members, setMembers] = useState<GroupMemberResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
    const [adding, setAdding] = useState(false);

    // Fetch when group changes
    React.useEffect(() => {
        if (!group) return;
        setLoading(true);
        groupService.getMembers(classId, group.id)
            .then(r => setMembers(r.data.data))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, [group, classId]);

    const refreshMembers = async () => {
        if (!group) return;
        const r = await groupService.getMembers(classId, group.id);
        setMembers(r.data.data);
    };

    const handleAddMember = async () => {
        if (!group || !selectedStudent) return;
        try {
            setAdding(true);
            await groupService.addMember(classId, group.id, selectedStudent as number);
            toast.success('Thêm thành viên thành công!');
            setOpenAdd(false);
            setSelectedStudent('');
            await refreshMembers();
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Thêm thất bại');
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (m: GroupMemberResponse) => {
        if (!group) return;
        try {
            await groupService.removeMember(classId, group.id, m.userId);
            toast.success(`Đã xóa ${m.fullName} khỏi nhóm`);
            await refreshMembers();
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleAssignLeader = async (m: GroupMemberResponse) => {
        if (!group) return;
        try {
            await groupService.assignLeader(classId, group.id, m.userId);
            toast.success(`${m.fullName} đã trở thành Team Leader!`);
            await refreshMembers();
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gán leader thất bại');
        }
    };

    const available = students.filter(s => !members.some(m => m.userId === s.studentId));

    return (
        <>
            <Dialog open={!!group} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupsIcon color="primary" />
                        <Typography fontWeight={700}>{group?.groupName}</Typography>
                        <Chip label={`${members.length} thành viên`} size="small" color="primary" variant="outlined" />
                    </Box>
                    <Button size="small" variant="contained" startIcon={<PersonAddIcon />}
                        onClick={() => { setSelectedStudent(''); setOpenAdd(true); }}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Thêm thành viên
                    </Button>
                </DialogTitle>
                <DialogContent>
                    {loading ? (
                        <Box>{[1, 2, 3].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}</Box>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Mã SV', 'Họ tên', 'Email', 'Vai trò', 'Hành động'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            Chưa có thành viên nào
                                        </TableCell>
                                    </TableRow>
                                ) : members.map(m => (
                                    <TableRow key={m.membershipId} hover>
                                        <TableCell>
                                            {m.studentCode
                                                ? <Chip label={m.studentCode} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                                                : <Typography variant="caption" color="text.disabled">N/A</Typography>}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {m.isLeader && <StarIcon fontSize="small" sx={{ color: '#ffa726', mr: 0.5, verticalAlign: 'middle' }} />}
                                            {m.fullName}
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{m.email}</TableCell>
                                        <TableCell>
                                            <Chip label={m.isLeader ? 'Leader' : 'Member'} size="small"
                                                color={m.isLeader ? 'warning' : 'default'} variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            {!m.isLeader && (
                                                <Tooltip title="Gán làm Team Leader">
                                                    <IconButton size="small" color="warning" onClick={() => handleAssignLeader(m)}>
                                                        <StarIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Xóa khỏi nhóm">
                                                <IconButton size="small" color="error" onClick={() => handleRemove(m)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Add Member sub-dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Thêm thành viên vào {group?.groupName}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Chọn sinh viên</InputLabel>
                        <Select value={selectedStudent} label="Chọn sinh viên"
                            onChange={e => setSelectedStudent(e.target.value as number)} sx={{ borderRadius: 2 }}>
                            {available.map(s => (
                                <MenuItem key={s.studentId} value={s.studentId}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {s.studentCode && <Chip label={s.studentCode} size="small" sx={{ fontFamily: 'monospace', fontSize: 10 }} />}
                                        {s.fullName} ({s.email})
                                    </Box>
                                </MenuItem>
                            ))}
                            {available.length === 0 && <MenuItem disabled>Không còn sinh viên nào để thêm</MenuItem>}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpenAdd(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAddMember}
                        disabled={adding || !selectedStudent} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {adding ? 'Đang thêm...' : 'Thêm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MembersDialog;
