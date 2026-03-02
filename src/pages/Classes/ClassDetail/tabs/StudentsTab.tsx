import React, { useState } from 'react';
import {
    Box, Card, Chip, Typography, Avatar, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import { toast } from 'react-toastify';

import groupService from '../../../../api/services/groupService';
import type { StudentInClassResponse } from '../../../../types/class.types';
import type { GroupResponse } from '../../../../types/group.types';
import type { ProjectResponse } from '../../../../types/project.types';


interface Props {
    classId: number;
    students: StudentInClassResponse[];
    groups: GroupResponse[];
    projects: ProjectResponse[];
    onRefresh: () => void;
}

const ACCENT = '#3B82F6';

const StudentsTab: React.FC<Props> = ({ classId, students, groups, projects, onRefresh }) => {

    // Group dropdown
    const [groupMenuAnchor, setGroupMenuAnchor] = useState<HTMLElement | null>(null);
    const [groupMenuStudent, setGroupMenuStudent] = useState<StudentInClassResponse | null>(null);

    const sorted = [...students].sort((a, b) => {
        if (!a.groupId && b.groupId) return 1;
        if (a.groupId && !b.groupId) return -1;
        return (a.groupName || '').localeCompare(b.groupName || '');
    });



    const handleGroupChange = async (groupId: number | null) => {
        if (!groupMenuStudent) return;
        setGroupMenuAnchor(null);

        const s = groupMenuStudent;
        setGroupMenuStudent(null);

        try {
            if (groupId === null) {
                // Remove from current group
                if (s.groupId) {
                    await groupService.removeMember(classId, s.groupId, s.studentId);
                    toast.success(`Đã xóa ${s.fullName} khỏi nhóm`);
                    onRefresh();
                }
            } else {
                // Same group → do nothing
                if (s.groupId === groupId) return;
                // Remove from old group first
                if (s.groupId) {
                    await groupService.removeMember(classId, s.groupId, s.studentId);
                }
                // Add to new group
                await groupService.addMember(classId, groupId, s.studentId);
                toast.success(
                    s.groupId
                        ? `Đã chuyển ${s.fullName} sang nhóm mới!`
                        : `Đã gán ${s.fullName} vào nhóm!`
                );
                onRefresh();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const openGroupMenu = (e: React.MouseEvent<HTMLElement>, s: StudentInClassResponse) => {
        setGroupMenuAnchor(e.currentTarget);
        setGroupMenuStudent(s);
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const avatarColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];
    const inGroup = students.filter(s => s.groupId).length;
    const noGroup = students.filter(s => !s.groupId).length;

    return (
        <>
            {/* ── Stat Pills ── */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Tổng', val: students.length, color: ACCENT, icon: <PersonIcon sx={{ fontSize: 15 }} /> },
                    { label: 'Đã vào nhóm', val: inGroup, color: '#10B981', icon: <GroupsIcon sx={{ fontSize: 15 }} /> },
                    { label: 'Chưa có nhóm', val: noGroup, color: '#F59E0B', icon: <GroupAddIcon sx={{ fontSize: 15 }} /> },
                ].map(s => (
                    <Box key={s.label} sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, borderRadius: 2,
                        bgcolor: `${s.color}0A`, border: `1px solid ${s.color}20`,
                    }}>
                        <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.val}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>{s.label}</Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Table ── */}
            {sorted.length === 0 ? (
                <Card sx={{
                    p: 6, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                    bgcolor: 'transparent', boxShadow: 'none',
                }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">Chưa có sinh viên nào trong lớp</Typography>
                </Card>
            ) : (
                <Card sx={{
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{
                                    bgcolor: '#FAFBFC',
                                    borderBottom: '2px solid #F1F5F9',
                                }}>
                                    {['#', 'Sinh viên', 'Mã SV', 'Nhóm', 'Project'].map((h, idx) => (
                                        <TableCell key={idx} sx={{
                                            fontWeight: 700,
                                            fontSize: '0.68rem',
                                            color: '#94A3B8',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            py: 1.5,
                                            fontFamily: "'Inter', sans-serif",
                                            borderBottom: 'none',
                                            ...(h === '#' ? { width: 50, textAlign: 'center' } : {}),
                                        }}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sorted.map((s, i) => {
                                    const proj = projects.find(p => p.groupId === s.groupId);
                                    const grp = groups.find(g => g.id === s.groupId);
                                    const isLeader = grp?.teamLeaderId === s.studentId;
                                    const color = avatarColors[i % avatarColors.length];

                                    return (
                                        <TableRow
                                            key={s.enrollmentId}
                                            sx={{
                                                transition: 'background 0.1s ease',
                                                '&:hover': { bgcolor: '#F8FAFD' },
                                                '& td': { borderBottom: '1px solid #F1F5F9', py: 1.25 },
                                            }}
                                        >
                                            {/* # */}
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography sx={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    color: '#CBD5E1',
                                                }}>
                                                    {i + 1}
                                                </Typography>
                                            </TableCell>

                                            {/* Sinh viên */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{
                                                        width: 36, height: 36,
                                                        bgcolor: `${color}14`,
                                                        color: color,
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}>
                                                        {getInitials(s.fullName)}
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography noWrap sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.85rem',
                                                                color: '#1E293B',
                                                                fontFamily: "'Inter', sans-serif",
                                                                letterSpacing: '-0.01em',
                                                            }}>
                                                                {s.fullName}
                                                            </Typography>
                                                            {isLeader && (
                                                                <Tooltip title="Team Leader" arrow>
                                                                    <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                        <Typography noWrap sx={{
                                                            fontSize: '0.72rem',
                                                            color: '#94A3B8',
                                                            fontFamily: "'Inter', sans-serif",
                                                        }}>
                                                            {s.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Mã SV */}
                                            <TableCell>
                                                <Chip
                                                    label={s.studentCode || '—'}
                                                    size="small"
                                                    sx={{
                                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                        fontSize: '0.72rem',
                                                        fontWeight: 500,
                                                        height: 24,
                                                        bgcolor: '#F1F5F9',
                                                        color: '#475569',
                                                        letterSpacing: '0.02em',
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Nhóm — clickable dropdown */}
                                            <TableCell>
                                                <Chip
                                                    icon={s.groupName
                                                        ? <GroupsIcon sx={{ fontSize: '13px !important' }} />
                                                        : <GroupAddIcon sx={{ fontSize: '13px !important' }} />
                                                    }
                                                    label={s.groupName || 'Chưa có nhóm'}
                                                    size="small"
                                                    variant={s.groupName ? 'filled' : 'outlined'}
                                                    onClick={(e) => openGroupMenu(e, s)}
                                                    sx={{
                                                        fontWeight: s.groupName ? 600 : 500,
                                                        fontSize: '0.72rem',
                                                        height: 26,
                                                        cursor: 'pointer',
                                                        fontFamily: "'Inter', sans-serif",
                                                        transition: 'all 0.15s ease',
                                                        ...(s.groupName ? {
                                                            bgcolor: 'rgba(59,130,246,0.08)',
                                                            color: '#3B82F6',
                                                            '& .MuiChip-icon': { color: '#3B82F6' },
                                                            '&:hover': { bgcolor: 'rgba(59,130,246,0.15)' },
                                                        } : {
                                                            borderStyle: 'dashed',
                                                            borderColor: '#F59E0B',
                                                            color: '#D97706',
                                                            '& .MuiChip-icon': { color: '#D97706' },
                                                            '&:hover': { bgcolor: 'rgba(245,158,11,0.06)' },
                                                        }),
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Project */}
                                            <TableCell>
                                                {proj ? (
                                                    <Typography noWrap sx={{
                                                        fontSize: '0.78rem',
                                                        color: '#64748B',
                                                        fontWeight: 500,
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}>
                                                        {proj.projectName}
                                                    </Typography>
                                                ) : (
                                                    <Typography sx={{
                                                        fontSize: '0.75rem',
                                                        color: '#CBD5E1',
                                                        fontStyle: 'italic',
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}>
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>

                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Footer */}
                    <Box sx={{
                        px: 2.5, py: 1.5,
                        bgcolor: '#FAFBFC',
                        borderTop: '1px solid #F1F5F9',
                        display: 'flex', justifyContent: 'space-between',
                    }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: "'Inter', sans-serif" }}>
                            Hiển thị {sorted.length} sinh viên
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: "'Inter', sans-serif" }}>
                            {inGroup}/{students.length} đã có nhóm
                        </Typography>
                    </Box>
                </Card>
            )}

            {/* ── Group Dropdown Menu ── */}
            <Menu
                anchorEl={groupMenuAnchor}
                open={!!groupMenuAnchor}
                onClose={() => { setGroupMenuAnchor(null); setGroupMenuStudent(null); }}
                PaperProps={{
                    sx: {
                        borderRadius: 2.5,
                        minWidth: 200,
                        maxHeight: 320,
                        boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        mt: 0.5,
                    },
                }}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            >
                {/* "No group" option */}
                <MenuItem
                    onClick={() => handleGroupChange(null)}
                    selected={!groupMenuStudent?.groupId}
                    sx={{
                        py: 1, gap: 1.5,
                        fontSize: '0.82rem',
                        fontFamily: "'Inter', sans-serif",
                        color: '#94A3B8',
                        fontStyle: 'italic',
                        borderBottom: '1px solid #F1F5F9',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0 }}>
                        <BlockIcon sx={{ fontSize: 16, color: '#CBD5E1' }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{
                        fontSize: '0.82rem',
                        fontFamily: "'Inter', sans-serif",
                        fontStyle: 'italic',
                        color: '#94A3B8',
                    }}>
                        Không có nhóm
                    </ListItemText>
                    {!groupMenuStudent?.groupId && (
                        <CheckIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    )}
                </MenuItem>

                {/* Group list */}
                {groups.map(g => {
                    const isCurrentGroup = groupMenuStudent?.groupId === g.id;
                    return (
                        <MenuItem
                            key={g.id}
                            onClick={() => handleGroupChange(g.id)}
                            selected={isCurrentGroup}
                            sx={{
                                py: 1, gap: 1,
                                fontSize: '0.82rem',
                                fontFamily: "'Inter', sans-serif",
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(59,130,246,0.06)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 0 }}>
                                <GroupsIcon sx={{ fontSize: 16, color: isCurrentGroup ? '#3B82F6' : '#94A3B8' }} />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{
                                fontSize: '0.82rem',
                                fontWeight: isCurrentGroup ? 600 : 400,
                                fontFamily: "'Inter', sans-serif",
                                color: isCurrentGroup ? '#3B82F6' : '#1E293B',
                            }}>
                                {g.groupName}
                            </ListItemText>
                            <Chip
                                label={g.totalMembers}
                                size="small"
                                sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 600,
                                    bgcolor: '#F1F5F9', color: '#94A3B8',
                                }}
                            />
                            {isCurrentGroup && (
                                <CheckIcon sx={{ fontSize: 16, color: '#3B82F6', ml: 0.5 }} />
                            )}
                        </MenuItem>
                    );
                })}
            </Menu>

        </>
    );
};

export default StudentsTab;
