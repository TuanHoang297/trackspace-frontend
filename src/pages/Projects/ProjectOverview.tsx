import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Chip, Skeleton,
} from '@mui/material';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import GitHubIcon from '@mui/icons-material/GitHub';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import projectService from '../../api/services/projectService';
import jiraService from '../../api/services/jiraService';
import githubService from '../../api/services/githubService';
import type { ProjectResponse } from '../../types/project.types';
import type { JiraConnectionResponse } from '../../types/jira.types';
import type { GitHubConnectionResponse } from '../../types/github.types';

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

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [jiraConn, setJiraConn] = useState<JiraConnectionResponse | null>(null);
    const [ghConn, setGhConn] = useState<GitHubConnectionResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const projRes = await projectService.getProjectById(pid);
                setProject(projRes.data.data);

                try {
                    const jiraRes = await jiraService.getStatus(pid);
                    setJiraConn(jiraRes.data.data);
                } catch {
                    setJiraConn(null);
                }

                try {
                    const ghRes = await githubService.getStatus(pid);
                    setGhConn(ghRes.data.data);
                } catch {
                    setGhConn(null);
                }
            } catch {
                setProject(null);
            } finally {
                setLoading(false);
            }
        };
        if (pid) fetchData();
    }, [pid]);

    if (loading) {
        return (
            <Box sx={{ p: 4 }}>
                <Skeleton width={300} height={40} sx={{ mb: 2 }} />
                <Skeleton height={120} sx={{ borderRadius: 3, mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height={100} sx={{ borderRadius: 3 }} />)}
                </Box>
            </Box>
        );
    }

    const isJiraConnected = jiraConn?.connectionStatus === 'CONNECTED';
    const isGhConnected = ghConn?.connectionStatus === 'CONNECTED';

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
                    <Chip icon={<CalendarTodayIcon />}
                        label={`Tạo ${new Date(project?.createdAt || '').toLocaleDateString('vi-VN')}`}
                        size="small"
                        sx={{ bgcolor: '#F1F5F9', color: '#64748B' }} />
                    {project?.hasProjectInfo && (
                        <Chip label="Đã có Project Info" size="small" color="success" />
                    )}
                </Box>
            </Paper>

            {/* Quick Stats */}
            {isJiraConnected && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                    {[
                        { label: 'Sprints', value: jiraConn?.totalSprints || 0, color: '#3B82F6' },
                        { label: 'Issues', value: jiraConn?.totalIssues || 0, color: '#10B981' },
                        { label: 'Project Key', value: jiraConn?.projectKey || '—', color: '#8B5CF6' },
                    ].map(stat => (
                        <Paper key={stat.label} elevation={0} sx={{
                            p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center',
                        }}>
                            <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
                                {stat.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {stat.label}
                            </Typography>
                        </Paper>
                    ))}
                </Box>
            )}

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
                        ? `${ghConn?.totalCommits || 0} commits • ${ghConn?.branchName}`
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
