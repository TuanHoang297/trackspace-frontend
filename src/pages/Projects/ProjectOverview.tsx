import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
            p: 2.5, borderRadius: 3, cursor: 'pointer',
            border: '1px solid', borderColor: 'divider',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: color, boxShadow: `0 4px 16px ${color}20`, transform: 'translateY(-2px)' },
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{
                width: 48, height: 48, borderRadius: 2,
                bgcolor: `${color}14`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color,
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
                    {status === 'connected' && <CheckCircleIcon sx={{ fontSize: 16, color: '#36B37E' }} />}
                    {status === 'not-connected' && <Chip label="Chưa kết nối" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                    {status === 'coming-soon' && <Chip label="Coming soon" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                </Box>
                <Typography variant="body2" color="text.secondary">{description}</Typography>
            </Box>
        </Box>
    </Paper>
);

const ProjectOverview: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);
    const { isLecturer } = useRole();
    const readOnly = !isLecturer();

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [jiraConn, setJiraConn] = useState<JiraConnectionResponse | null>(null);
    const [ghConns, setGhConns] = useState<GitHubConnectionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<GroupMemberResponse[]>([]);

    // Project Info state
    const [info, setInfo] = useState<ProjectInfoResponse | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [problems, setProblems] = useState('');
    const [primaryActors, setPrimaryActors] = useState('');
    const [functionalRequirements, setFunctionalRequirements] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const projRes = await projectService.getProjectById(pid);
                const p = projRes.data.data;
                setProject(p);

                // Fetch project info
                if (p.hasProjectInfo) {
                    try {
                        const infoRes = await projectService.getProjectInfo(pid);
                        const i = infoRes.data.data;
                        setInfo(i);
                        setTopic(i.topic || '');
                        setContext(i.context || '');
                        setProblems(i.problems || '');
                        setPrimaryActors(i.primaryActors || '');
                        setFunctionalRequirements(i.functionalRequirements || '');
                    } catch {
                        setInfo(null);
                    }
                } else {
                    if (!readOnly) setEditing(true); // Auto open form if no info yet (for Lecturer)
                }

                try {
                    const jiraRes = await jiraService.getStatus(pid);
                    setJiraConn(jiraRes.data.data);
                } catch {
                    setJiraConn(null);
                }

                try {
                    const ghRes = await githubService.getConnections(pid);
                    const data = ghRes.data.data;
                    setGhConns(Array.isArray(data) ? data : data ? [data] : []);
                } catch {
                    setGhConns([]);
                }

                // Fetch group members
                if (p.classId && p.groupId) {
                    try {
                        const membersRes = await groupService.getMembers(p.classId, p.groupId);
                        setMembers(membersRes.data.data ?? []);
                    } catch {
                        setMembers([]);
                    }
                }
            } catch {
                setProject(null);
            } finally {
                setLoading(false);
            }
        };
        if (pid) fetchData();
    }, [pid]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const request: ProjectInfoRequest = {
                topic: project?.projectName || topic, context, problems, primaryActors, functionalRequirements,
            };
            const res = await projectService.saveProjectInfo(pid, request);
            setInfo(res.data.data);
            if (project) setProject({ ...project, hasProjectInfo: true });
            setEditing(false);
            toast.success('Lưu thông tin project thành công!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
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

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Project Header */}
            <Paper elevation={0} sx={{
                p: 3, borderRadius: 3, mb: 3,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid',
                borderLeftColor: '#3B82F6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1, color: '#1E293B' }}>
                    {project?.projectName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<GroupsIcon />} label={project?.groupName} size="small"
                        sx={{ bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontWeight: 600 }} />

                </Box>
            </Paper>

            {/* Project Info Section */}
            <Paper elevation={0} sx={{
                p: 3, borderRadius: 3, mb: 3,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
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
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
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
                                    placeholder="- Chức năng 1: Đăng nhập/Đăng ký&#10;- Chức năng 2: Quản lý khóa học..."
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
                                        // Reset to saved values
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
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                        <Typography color="text.secondary" sx={{ mb: 1 }}>Chưa có thông tin project</Typography>
                        <Typography variant="caption" color="text.disabled">Điền thông tin bên trên để bắt đầu</Typography>
                    </Box>
                )}
            </Paper>

            {/* Members Section */}
            <Paper elevation={0} sx={{
                p: 3, borderRadius: 3, mb: 3,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <GroupsIcon sx={{ color: '#8B5CF6', fontSize: 22 }} />
                    <Typography variant="h6" fontWeight={700}>Thành viên nhóm</Typography>
                    <Chip label={`${members.length} thành viên`} size="small"
                        sx={{ ml: 'auto', fontWeight: 600, fontSize: '0.72rem', bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: 1.5 }} />
                </Box>
                {members.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                        <GroupsIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body2">Chưa có thành viên nào</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {members.sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0)).map((m) => (
                            <Box key={m.membershipId} sx={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                py: 1.2, px: 1.5, borderRadius: 2,
                                '&:hover': { bgcolor: '#F8FAFC' },
                                border: '1px solid', borderColor: m.isLeader ? '#EDE9FE' : 'transparent',
                                bgcolor: m.isLeader ? 'rgba(139,92,246,0.03)' : 'transparent',
                            }}>
                                <Avatar sx={{
                                    width: 36, height: 36,
                                    bgcolor: m.isLeader ? '#8B5CF6' : '#3B82F6',
                                    fontSize: '0.8rem', fontWeight: 700,
                                }}>
                                    {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap>{m.fullName}</Typography>
                                        {m.isLeader && (
                                            <Chip label="Leader" size="small"
                                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: 1 }} />
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        {m.studentCode && `${m.studentCode} • `}{m.email}
                                    </Typography>
                                </Box>
                                <Chip label={m.role === 'TEAMLEADER' ? 'Trưởng nhóm' : 'Thành viên'} size="small"
                                    sx={{
                                        height: 20, fontSize: '0.68rem', fontWeight: 600, borderRadius: 1.5,
                                        bgcolor: m.role === 'TEAMLEADER' ? '#FEF3C7' : '#DBEAFE',
                                        color: m.role === 'TEAMLEADER' ? '#D97706' : '#2563EB',
                                    }} />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Quick Links */}
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Truy cập nhanh</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <QuickLink
                    icon={<ViewKanbanIcon />}
                    label="Sprint Board"
                    description={isJiraConnected
                        ? `${jiraConn?.totalSprints} sprints • ${jiraConn?.totalIssues} issues`
                        : 'Kết nối Jira để quản lý sprints và issues'}
                    color="#3B82F6"
                    onClick={() => navigate(`/projects/${pid}/jira`)}
                    status={isJiraConnected ? 'connected' : 'not-connected'}
                />
                <QuickLink
                    icon={<GitHubIcon />}
                    label="GitHub"
                    description={isGhConnected
                        ? `${totalGhCommits} commits • ${activeGhConns.length} repo${activeGhConns.length > 1 ? 's' : ''}`
                        : 'Kết nối GitHub để xem commits và contributors'}
                    color="#24292E"
                    onClick={() => navigate(`/projects/${pid}/github`)}
                    status={isGhConnected ? 'connected' : 'not-connected'}
                />
                <QuickLink
                    icon={<BarChartIcon />}
                    label="Contribution"
                    description="Phân tích đóng góp và đánh giá thành viên"
                    color="#36B37E"
                    onClick={() => navigate(`/projects/${pid}/contribution`)}
                    status="coming-soon"
                />
                <QuickLink
                    icon={<ViewKanbanIcon />}
                    label="SRS Document"
                    description="Tạo tài liệu SRS tự động bằng AI"
                    color="#8B5CF6"
                    onClick={() => navigate(`/projects/${pid}/srs`)}
                    status="coming-soon"
                />
            </Box>
        </Box>
    );
};

export default ProjectOverview;
