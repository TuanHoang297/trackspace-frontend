import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Paper, Chip, Skeleton, TextField, Button, Grid, Divider, Avatar,
} from '@mui/material';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import GitHubIcon from '@mui/icons-material/GitHub';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import projectService from '../../api/services/projectService';
import jiraService from '../../api/services/jiraService';
import githubService from '../../api/services/githubService';
import groupService from '../../api/services/groupService';
import type { ProjectResponse } from '../../types/project.types';
import type { JiraConnectionResponse } from '../../types/jira.types';
import type { GitHubConnectionResponse } from '../../types/github.types';
import type { ProjectInfoResponse, ProjectInfoRequest } from '../../api/types/types';
import type { GroupMemberResponse } from '../../types/group.types';
import { toast } from 'react-toastify';
import { useRole } from '../../hooks/useRole';

interface QuickLinkProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
    onClick: () => void;
    status?: 'connected' | 'not-connected' | 'coming-soon';
}

const QuickLink: React.FC<QuickLinkProps> = ({ icon, label, description, color, onClick, status }) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 2, borderRadius: 3, cursor: 'pointer',
            border: '1px solid', borderColor: 'divider',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: color, boxShadow: `0 4px 16px ${color}20`, transform: 'translateY(-2px)' },
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: `${color}14`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                    {status === 'connected' && <CheckCircleIcon sx={{ fontSize: 14, color: '#36B37E' }} />}
                    {status === 'not-connected' && <Chip label="Chưa kết nối" size="small" sx={{ height: 16, fontSize: '0.58rem' }} />}
                    {status === 'coming-soon' && <Chip label="Coming soon" size="small" sx={{ height: 16, fontSize: '0.58rem' }} />}
                </Box>
                <Typography variant="caption" color="text.secondary">{description}</Typography>
            </Box>
        </Box>
    </Paper>
);

const ProjectOverview: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const pid = Number(projectId);
    const { isLecturer } = useRole();
    const readOnly = !isLecturer();

    // Edit state
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [problems, setProblems] = useState('');
    const [primaryActors, setPrimaryActors] = useState('');
    const [functionalRequirements, setFunctionalRequirements] = useState('');

    // ── All queries run in PARALLEL (not waterfall) ──
    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', pid],
        queryFn: async () => {
            const res = await projectService.getProjectById(pid);
            return res.data.data as ProjectResponse;
        },
        enabled: !!pid,
    });

    const { data: info } = useQuery({
        queryKey: ['project', pid, 'info'],
        queryFn: async () => {
            const res = await projectService.getProjectInfo(pid);
            const i = res.data.data as ProjectInfoResponse;
            // Sync form state when data loads
            setTopic(i.topic || '');
            setContext(i.context || '');
            setProblems(i.problems || '');
            setPrimaryActors(i.primaryActors || '');
            setFunctionalRequirements(i.functionalRequirements || '');
            return i;
        },
        enabled: !!project?.hasProjectInfo,
    });

    const { data: jiraConn } = useQuery({
        queryKey: ['jira', 'status', pid],
        queryFn: async () => {
            try {
                const res = await jiraService.getStatus(pid);
                return res.data.data as JiraConnectionResponse;
            } catch {
                return null;
            }
        },
        enabled: !!pid,
    });

    const { data: ghConns = [] } = useQuery({
        queryKey: ['github', 'connections', pid],
        queryFn: async () => {
            try {
                const res = await githubService.getConnections(pid);
                const data = res.data.data;
                return Array.isArray(data) ? data : data ? [data] : [];
            } catch {
                return [] as GitHubConnectionResponse[];
            }
        },
        enabled: !!pid,
    });

    const { data: members = [] } = useQuery({
        queryKey: ['project', pid, 'members'],
        queryFn: async () => {
            if (!project?.classId || !project?.groupId) return [] as GroupMemberResponse[];
            try {
                const res = await groupService.getMembers(project.classId, project.groupId);
                return res.data.data ?? [];
            } catch {
                return [] as GroupMemberResponse[];
            }
        },
        enabled: !!project?.classId && !!project?.groupId,
    });

    // Auto-enter edit mode if no project info and user has write access
    const shouldAutoEdit = !!project && !project.hasProjectInfo && !readOnly && !editing;
    if (shouldAutoEdit && !editing) {
        setEditing(true);
    }

    const handleSave = async () => {
        try {
            setSaving(true);
            const request: ProjectInfoRequest = {
                topic: project?.projectName || topic, context, problems, primaryActors, functionalRequirements,
            };
            const res = await projectService.saveProjectInfo(pid, request);
            // Update cache
            queryClient.setQueryData(['project', pid, 'info'], res.data.data);
            queryClient.setQueryData(['project', pid], (old: ProjectResponse | undefined) =>
                old ? { ...old, hasProjectInfo: true } : old
            );
            setEditing(false);
            toast.success('Lưu thông tin project thành công!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (projectLoading) {
        return (
            <Box sx={{ p: 4 }}>
                <Skeleton width={300} height={40} sx={{ mb: 2 }} />
                <Skeleton height={120} sx={{ borderRadius: 3, mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height={100} sx={{ borderRadius: 3 }} />)}
                </Box>
            </Box>
        );
    }

    if (!project) return null;

    const isJiraConnected = jiraConn?.connectionStatus === 'CONNECTED';
    const activeGhConns = ghConns.filter(c => c.connectionStatus === 'CONNECTED');
    const isGhConnected = activeGhConns.length > 0;
    const totalGhCommits = activeGhConns.reduce((sum, c) => sum + (c.totalCommits || 0), 0);

    const infoFields = [
        { label: 'Bối cảnh & Mục tiêu', value: info?.context },
        { label: 'Vấn đề hiện tại', value: info?.problems },
        { label: 'Đối tượng sử dụng', value: info?.primaryActors },
        { label: 'Yêu cầu chức năng', value: info?.functionalRequirements },
    ];

    const sortedMembers = [...members].sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* ── Two-column: Left = Project Info, Right = Members + Quick Links ── */}
            <Grid container spacing={3}>
                {/* ===== LEFT COLUMN ===== */}
                <Grid item xs={12} md={8}>
                    {/* Project Info Section */}
                    <Paper elevation={0} sx={{
                        p: 3, borderRadius: 3,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <InfoOutlinedIcon sx={{ color: '#3B82F6', fontSize: 22 }} />
                                <Typography variant="h6" fontWeight={700}>Thông tin Project</Typography>
                            </Box>
                            {info && !editing && !readOnly && (
                                <Button
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => setEditing(true)}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Chỉnh sửa
                                </Button>
                            )}
                        </Box>

                        {/* Project Name */}
                        <Box sx={{ mb: 2.5, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary"
                                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
                                Tên đề tài
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#1E293B' }}>
                                {project?.projectName}
                            </Typography>
                        </Box>

                        {editing && !readOnly ? (
                            /* ── Edit Mode ── */
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Điền các thông tin cơ bản về project. Thông tin này sẽ được sử dụng để tạo tài liệu SRS sau này.
                                </Typography>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Bối cảnh & Mục tiêu (Context & Objectives)"
                                            fullWidth multiline minRows={2} variant="outlined" value={context}
                                            onChange={e => setContext(e.target.value)}
                                            placeholder="Tại sao lại làm dự án này? Hệ thống giải quyết mục tiêu gì?"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Vấn đề hiện tại (Problems)"
                                            fullWidth multiline minRows={2} variant="outlined" value={problems}
                                            onChange={e => setProblems(e.target.value)}
                                            placeholder="Các vấn đề thực tiễn mà giải pháp này sẽ giải quyết..."
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}><Divider /></Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Đối tượng sử dụng (Primary Actors)"
                                            fullWidth multiline minRows={2} variant="outlined" value={primaryActors}
                                            onChange={e => setPrimaryActors(e.target.value)}
                                            placeholder="Ví dụ: Admin, Giảng viên, Sinh viên..."
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Yêu cầu chức năng cốt lõi (Core Functional Requirements)"
                                            fullWidth multiline minRows={3} variant="outlined" value={functionalRequirements}
                                            onChange={e => setFunctionalRequirements(e.target.value)}
                                            placeholder={"- Chức năng 1: Đăng nhập/Đăng ký\n- Chức năng 2: Quản lý khóa học..."}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', gap: 1.5, mt: 3, justifyContent: 'flex-end' }}>
                                    {info && (
                                        <Button
                                            variant="outlined" size="small"
                                            onClick={() => {
                                                setEditing(false);
                                                setTopic(info.topic || '');
                                                setContext(info.context || '');
                                                setProblems(info.problems || '');
                                                setPrimaryActors(info.primaryActors || '');
                                                setFunctionalRequirements(info.functionalRequirements || '');
                                            }}
                                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                                        >
                                            Hủy
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained" size="small"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                        disabled={saving || !topic.trim()}
                                        sx={{
                                            textTransform: 'none', borderRadius: 2, fontWeight: 600, px: 3,
                                            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                                            '&:hover': { background: 'linear-gradient(135deg, #2563EB, #7C3AED)' },
                                        }}
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                                    </Button>
                                </Box>
                            </Box>
                        ) : info ? (
                            /* ── View Mode ── */
                            <Box>
                                {infoFields.map((f, i) => f.value ? (
                                    <Box key={i} sx={{ mb: 2.5, '&:last-child': { mb: 0 } }}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                                            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
                                            {f.label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                            {f.value}
                                        </Typography>
                                    </Box>
                                ) : null)}
                                {info.updatedAt && (
                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block', textAlign: 'right' }}>
                                        Cập nhật lần cuối: {new Date(info.updatedAt).toLocaleString('vi-VN')}
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            /* ── Empty State ── */
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                                <Typography color="text.secondary" sx={{ mb: 0.5 }}>Chưa có thông tin project</Typography>
                                <Typography variant="caption" color="text.disabled">Giảng viên có thể điền thông tin để bắt đầu</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* ===== RIGHT COLUMN ===== */}
                <Grid item xs={12} md={4}>
                    {/* Members Section */}
                    <Paper elevation={0} sx={{
                        p: 2.5, borderRadius: 3, mb: 2.5,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <GroupsIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />
                            <Typography variant="subtitle1" fontWeight={700}>Thành viên</Typography>
                            <Chip label={`${members.length}`} size="small"
                                sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.7rem', bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: 1.5, minWidth: 24, height: 22 }} />
                        </Box>
                        {members.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                <GroupsIcon sx={{ fontSize: 36, opacity: 0.3, mb: 0.5 }} />
                                <Typography variant="body2">Chưa có thành viên</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {sortedMembers.map((m, idx) => (
                                    <Box key={m.membershipId ?? idx} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        py: 1, px: 1.5, borderRadius: 2,
                                        '&:hover': { bgcolor: '#F8FAFC' },
                                        bgcolor: m.isLeader ? 'rgba(139,92,246,0.04)' : 'transparent',
                                    }}>
                                        <Avatar sx={{
                                            width: 32, height: 32,
                                            bgcolor: m.isLeader ? '#8B5CF6' : '#3B82F6',
                                            fontSize: '0.7rem', fontWeight: 700,
                                        }}>
                                            {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem' }}>{m.fullName}</Typography>
                                                {m.isLeader && (
                                                    <Chip label="★" size="small"
                                                        sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#D97706', borderRadius: 1, minWidth: 20, px: 0 }} />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                                                {m.studentCode || m.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* Quick Links */}
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, px: 0.5 }}>Truy cập nhanh</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <QuickLink
                            icon={<ViewKanbanIcon />}
                            label="Sprint Board"
                            description={isJiraConnected
                                ? `${jiraConn?.totalSprints} sprints • ${jiraConn?.totalIssues} issues`
                                : 'Kết nối Jira để quản lý sprints'}
                            color="#3B82F6"
                            onClick={() => navigate(`/projects/${pid}/jira`)}
                            status={isJiraConnected ? 'connected' : 'not-connected'}
                        />
                        <QuickLink
                            icon={<GitHubIcon />}
                            label="GitHub"
                            description={isGhConnected
                                ? `${totalGhCommits} commits • ${activeGhConns.length} repo`
                                : 'Kết nối GitHub để xem commits'}
                            color="#24292E"
                            onClick={() => navigate(`/projects/${pid}/github`)}
                            status={isGhConnected ? 'connected' : 'not-connected'}
                        />
                        <QuickLink
                            icon={<BarChartIcon />}
                            label="Contribution"
                            description="Phân tích đóng góp thành viên"
                            color="#36B37E"
                            onClick={() => navigate(`/projects/${pid}/contribution`)}
                            status="coming-soon"
                        />
                        <QuickLink
                            icon={<DescriptionIcon />}
                            label="SRS Document"
                            description="Tạo tài liệu SRS bằng AI"
                            color="#8B5CF6"
                            onClick={() => navigate(`/projects/${pid}/srs`)}
                            status="coming-soon"
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProjectOverview;
