import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
    Box, Typography, Dialog, Avatar, Chip, IconButton, Tooltip, Paper, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CommitIcon from '@mui/icons-material/Commit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StarIcon from '@mui/icons-material/Star';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import githubService from '../../../api/services/githubService';
import jiraService from '../../../api/services/jiraService';
import type { GitHubCommitResponse } from '../../../types/github.types';
import type { JiraIssueResponse, JiraSprintResponse } from '../../../types/jira.types';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
} from 'recharts';

import ScoreRing from './ScoreRing';
import MiniProgress from './MiniProgress';
import { DetailSparkline } from './ActivitySparkline';
import { GRADIENTS, AVATAR_COLORS, DOMAIN_META, getInitials } from './constants';
import type { ContributionResponse } from '../../../types/contribution.types';

interface TeamAverages {
    commits: number;
    linesAdded: number;
    taskCompletionRate: number;
    contributionScore: number;
}

interface MemberDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    member: ContributionResponse | null;
    projectId: number;
    rank: number;
    contributionPercent: number;
    teamAverages: TeamAverages;
}


/* ── Stat Card (for GitHub/Jira details) ── */
const StatCard: React.FC<{
    icon: React.ReactNode; label: string; value: string | number; color: string; bg: string; border: string;
}> = ({ icon, label, value, color, bg, border }) => (
    <Paper elevation={0} sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        bgcolor: bg, borderRadius: 2.5, px: 1.5, py: 1,
        border: `1px solid ${border}`,
        transition: 'transform 0.15s',
        '&:hover': { transform: 'scale(1.02)' },
    }}>
        <Box sx={{ color, display: 'flex', flexShrink: 0 }}>{icon}</Box>
        <Typography fontSize="0.8rem" color="text.secondary" fontWeight={600}>{label}</Typography>
        <Typography fontSize="0.9rem" fontWeight={800} sx={{ ml: 'auto', color, fontFamily: "'JetBrains Mono', monospace" }}>
            {value}
        </Typography>
    </Paper>
);


const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
    open, onClose, member, projectId, rank, contributionPercent, teamAverages,
}) => {
    const [drawerView, setDrawerView] = useState<'overview' | 'commits' | 'tasks'>('overview');
    const [commits, setCommits] = useState<GitHubCommitResponse[]>([]);
    const [commitsLoading, setCommitsLoading] = useState(false);
    const [tasks, setTasks] = useState<JiraIssueResponse[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [sprintMap, setSprintMap] = useState<Record<number, string>>({});
    const bodyRef = useRef<HTMLDivElement>(null);
    const [bodyHeight, setBodyHeight] = useState<number | undefined>(undefined);

    // Capture body height from overview before switching to commits
    useLayoutEffect(() => {
        if (drawerView === 'overview' && bodyRef.current) {
            setBodyHeight(bodyRef.current.offsetHeight);
        }
    }, [drawerView]);

    // Also capture after Dialog open transition completes (fixes first-click sizing)
    useEffect(() => {
        if (open && drawerView === 'overview') {
            const timer = setTimeout(() => {
                if (bodyRef.current) setBodyHeight(bodyRef.current.offsetHeight);
            }, 350); // wait for MUI Dialog transition
            return () => clearTimeout(timer);
        }
    }, [open, drawerView]);

    // Reset view when dialog opens/closes
    useEffect(() => { if (!open) setDrawerView('overview'); }, [open]);

    const handleOpenCommits = () => {
        // Re-capture height right before switching
        if (bodyRef.current) setBodyHeight(bodyRef.current.offsetHeight);
        setDrawerView('commits');
        setCommitsLoading(true);
        githubService.getCommits(projectId, { userId: member!.userId })
            .then(res => setCommits(res.data?.data || []))
            .catch(() => setCommits([]))
            .finally(() => setCommitsLoading(false));
    };

    const handleOpenTasks = () => {
        if (bodyRef.current) setBodyHeight(bodyRef.current.offsetHeight);
        setDrawerView('tasks');
        setTasksLoading(true);
        Promise.all([
            jiraService.getIssues(projectId, { assigneeId: member!.userId }),
            jiraService.getSprints(projectId),
        ])
            .then(([issuesRes, sprintsRes]) => {
                setTasks(issuesRes.data?.data || []);
                const sprints: JiraSprintResponse[] = sprintsRes.data?.data || [];
                const map: Record<number, string> = {};
                sprints.forEach(s => { map[s.sprintId] = s.sprintName; });
                setSprintMap(map);
            })
            .catch(() => { setTasks([]); setSprintMap({}); })
            .finally(() => setTasksLoading(false));
    };

    const timeAgo = (d: string) => {
        const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const days = Math.floor(h / 24);
        return days < 30 ? `${days}d ago` : new Date(d).toLocaleDateString('vi-VN');
    };

    if (!member) return null;

    const avatarColor = AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length];
    const domain = DOMAIN_META[member.domain] || DOMAIN_META.UNKNOWN;
    const rankGradient = rank === 1 ? GRADIENTS.gold : rank === 2 ? GRADIENTS.silver : rank === 3 ? GRADIENTS.bronze : 'linear-gradient(135deg, #334155, #475569)';
    const rankGlow = rank === 1 ? 'rgba(245,158,11,0.4)' : rank === 2 ? 'rgba(192,192,192,0.3)' : rank === 3 ? 'rgba(205,127,50,0.3)' : 'none';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: '85%', maxWidth: 960,
                    maxHeight: '90vh',
                    borderRadius: 4, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                },
            }}
        >
            {/* ═══ Dark Header ═══ */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E2A4A 100%)',
                px: 3, py: 2,
                display: 'flex', alignItems: 'center', gap: 2,
                position: 'relative', overflow: 'hidden',
                '&::before': {
                    content: '""', position: 'absolute',
                    top: -60, right: -60, width: 200, height: 200,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    borderRadius: '50%',
                },
                '&::after': {
                    content: '""', position: 'absolute',
                    bottom: -40, left: '20%', width: 150, height: 150,
                    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
                    borderRadius: '50%',
                },
            }}>
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box sx={{ position: 'absolute', inset: -5, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor}, #8B5CF6)`, opacity: 0.4, filter: 'blur(4px)' }} />
                    <Avatar sx={{
                        width: 48, height: 48, position: 'relative',
                        bgcolor: avatarColor + '25', color: '#fff',
                        fontWeight: 800, fontSize: 18,
                        border: `3px solid ${avatarColor}`,
                        boxShadow: `0 0 20px ${avatarColor}40`,
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        {getInitials(member.fullName)}
                    </Avatar>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                    <Typography fontWeight={800} fontSize="1.1rem" color="#F1F5F9"
                        sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.2, wordBreak: 'break-word' }}>
                        {member.fullName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip label={domain.label} size="small"
                            sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${domain.color}20`, color: domain.color, borderRadius: 1.5, border: `1px solid ${domain.color}30` }} />
                        <Box sx={{
                            px: 1.2, py: 0.4, borderRadius: 1.5,
                            background: rankGradient,
                            display: 'flex', alignItems: 'center',
                            boxShadow: rankGlow !== 'none' ? `0 2px 10px ${rankGlow}` : undefined,
                        }}>
                            <Typography fontSize="0.75rem" fontWeight={900} color="#fff"
                                sx={{ fontFamily: "'JetBrains Mono', monospace", textShadow: rank <= 3 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}>
                                #{rank}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{
                    color: 'rgba(148,163,184,0.5)', alignSelf: 'flex-start',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* ═══ Body ═══ */}
            <Box ref={bodyRef} sx={{ p: 2, bgcolor: '#F8FAFC', flex: 1, ...((drawerView === 'commits' || drawerView === 'tasks') && bodyHeight ? { height: bodyHeight, maxHeight: bodyHeight, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : { overflowY: 'auto' }) }}>

              {drawerView === 'overview' ? (
                <>
                {/* Row 1: Score + GitHub & Jira Stats */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 2, mb: 2 }}>

                    {/* Left: Score Overview */}
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <SectionLabel>SCORE OVERVIEW</SectionLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            <ScoreRing score={contributionPercent} size={76} thickness={5} />
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <MiniProgress label="GitHub Impact" value={member.githubImpactScore} color="#3B82F6" />
                                <MiniProgress label="Jira Execution" value={member.jiraExecutionScore} color="#10B981" />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.8 }}>
                            {[
                                { label: 'Active', value: `${member.activeDays}d`, tip: 'Số ngày có hoạt động', color: '#1E293B', bg: '#F1F5F9', border: 'rgba(30,41,59,0.08)' },
                                { label: 'Consistency', value: member.consistencyFactor.toFixed(2), tip: 'Độ đều đặn (0-1)', color: '#8B5CF6', bg: '#F5F3FF', border: 'rgba(139,92,246,0.12)' },
                                { label: 'Churn', value: member.codeChurnRate.toFixed(2), tip: 'Tỷ lệ code sửa lại', color: member.codeChurnRate > 1.5 ? '#EF4444' : '#64748B', bg: member.codeChurnRate > 1.5 ? '#FEF2F2' : '#F8FAFC', border: member.codeChurnRate > 1.5 ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.08)' },
                            ].map(s => (
                                <Tooltip key={s.label} title={s.tip} arrow placement="top">
                                    <Box sx={{ textAlign: 'center', py: 0.8, bgcolor: s.bg, borderRadius: 2, border: `1px solid ${s.border}`, cursor: 'help' }}>
                                        <Typography fontSize="0.85rem" fontWeight={800} sx={{ fontFamily: "'JetBrains Mono', monospace", color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                                        <Typography fontSize="0.55rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</Typography>
                                    </Box>
                                </Tooltip>
                            ))}
                        </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', gap: 0 }}>
                            {/* GitHub Column */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                                    <GitHubIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                                    <Typography fontSize="0.78rem" fontWeight={700} color="#3B82F6">GitHub</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Paper elevation={0} onClick={handleOpenCommits} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        bgcolor: '#EFF6FF', borderRadius: 2, px: 1.2, py: 0.8,
                                        border: '1px solid rgba(59,130,246,0.12)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        '&:hover': { bgcolor: '#DBEAFE' },
                                    }}>
                                        <CommitIcon sx={{ fontSize: 14, color: '#3B82F6' }} />
                                        <Typography fontSize="0.72rem" color="text.secondary" fontWeight={600}>Commits</Typography>
                                        <Typography fontSize="0.82rem" fontWeight={800} sx={{ ml: 'auto', color: '#3B82F6', fontFamily: "'JetBrains Mono', monospace" }}>
                                            {member.totalCommits}
                                        </Typography>
                                        <OpenInNewIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                                    </Paper>
                                    <StatCard icon={<AddIcon sx={{ fontSize: 14 }} />} label="Added" value={`+${member.linesAdded.toLocaleString()}`}
                                        color="#16A34A" bg="#F0FDF4" border="rgba(22,163,74,0.12)" />
                                    <StatCard icon={<RemoveIcon sx={{ fontSize: 14 }} />} label="Deleted" value={`-${member.linesDeleted.toLocaleString()}`}
                                        color="#DC2626" bg="#FEF2F2" border="rgba(220,38,38,0.12)" />
                                </Box>
                            </Box>

                            {/* Divider */}
                            <Box sx={{ width: '1px', bgcolor: 'divider', mx: 1.5, my: 0.5 }} />

                            {/* Jira Column */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                                    <svg width="16" height="16" viewBox="0 0 256 256">
                                        <defs>
                                            <linearGradient id="jiraBlue1" x1="98.03%" y1="0.22%" x2="58.17%" y2="40.08%">
                                                <stop offset="18%" stopColor="#0052CC"/>
                                                <stop offset="100%" stopColor="#2684FF"/>
                                            </linearGradient>
                                            <linearGradient id="jiraBlue2" x1="100.17%" y1="0.05%" x2="55.76%" y2="44.47%">
                                                <stop offset="18%" stopColor="#0052CC"/>
                                                <stop offset="100%" stopColor="#2684FF"/>
                                            </linearGradient>
                                        </defs>
                                        <path d="M244.658 0H121.707a55.502 55.502 0 0 0 55.502 55.502h22.649V77.37c.02 30.625 24.841 55.447 55.5 55.502V10.993C255.358 4.923 250.228 0 244.658 0" fill="#2684FF"/>
                                        <path d="M183.822 61.262H60.872c.019 30.625 24.84 55.447 55.501 55.502h22.649v21.868c.02 30.597 24.798 55.45 55.502 55.502V72.255c0-6.07-5.13-10.993-10.702-10.993" fill="url(#jiraBlue1)"/>
                                        <path d="M122.943 122.524H0c0 30.653 24.84 55.502 55.502 55.502h22.72v21.868c.02 30.597 24.798 55.45 55.502 55.502V133.517c0-6.07-5.202-10.993-10.78-10.993" fill="url(#jiraBlue2)"/>
                                    </svg>
                                    <Typography fontSize="0.78rem" fontWeight={700} color="#2684FF">Jira</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Paper elevation={0} onClick={handleOpenTasks} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        bgcolor: '#F5F3FF', borderRadius: 2, px: 1.2, py: 0.8,
                                        border: '1px solid rgba(139,92,246,0.12)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        '&:hover': { bgcolor: '#EDE9FE' },
                                    }}>
                                        <AssignmentTurnedInIcon sx={{ fontSize: 14, color: '#8B5CF6' }} />
                                        <Typography fontSize="0.72rem" color="text.secondary" fontWeight={600}>Tasks</Typography>
                                        <Typography fontSize="0.82rem" fontWeight={800} sx={{ ml: 'auto', color: '#8B5CF6', fontFamily: "'JetBrains Mono', monospace" }}>
                                            {member.tasksCompleted}/{member.tasksAssigned}
                                        </Typography>
                                        <OpenInNewIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                                    </Paper>
                                    <StatCard icon={<StarIcon sx={{ fontSize: 14 }} />} label="Rate" value={`${Math.round(member.taskCompletionRate)}%`}
                                        color={member.taskCompletionRate >= 70 ? '#10B981' : '#F59E0B'}
                                        bg={member.taskCompletionRate >= 70 ? '#F0FDF4' : '#FFFBEB'}
                                        border={member.taskCompletionRate >= 70 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'} />
                                    <StatCard icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />} label="Overdue" value={member.overdueTaskCount}
                                        color={member.overdueTaskCount > 0 ? '#EF4444' : '#16A34A'}
                                        bg={member.overdueTaskCount > 0 ? '#FEF2F2' : '#F0FDF4'}
                                        border={member.overdueTaskCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(22,163,74,0.12)'} />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Row 2: Radar Chart + Timeline side by side */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' }, gap: 2 }}>
                    {/* Left: Team Comparison Radar */}
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <SectionLabel>TEAM COMPARISON</SectionLabel>
                        <ResponsiveContainer width="100%" height={180}>
                            <RadarChart cx="50%" cy="50%" outerRadius="72%"
                                data={(() => {
                                    const metrics = [
                                        { name: 'Commits', member: member.totalCommits, team: teamAverages.commits },
                                        { name: 'Lines', member: member.linesAdded, team: teamAverages.linesAdded },
                                        { name: 'Tasks', member: member.taskCompletionRate, team: teamAverages.taskCompletionRate },
                                        { name: 'Score', member: member.contributionScore, team: teamAverages.contributionScore },
                                    ];
                                    const maxVals = metrics.map(m => Math.max(m.member, m.team, 1));
                                    return metrics.map((m, i) => ({
                                        subject: m.name,
                                        member: Math.round((m.member / maxVals[i]) * 100),
                                        team: Math.round((m.team / maxVals[i]) * 100),
                                        memberRaw: m.member,
                                        teamRaw: m.team,
                                    }));
                                })()}
                            >
                                <PolarGrid stroke="#E2E8F0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} />
                                <Radar name="Team Avg" dataKey="team" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.1} strokeDasharray="4 3" strokeWidth={1.5} />
                                <Radar name="Member" dataKey="member" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.72rem' }}
                                    formatter={(_: any, name: string, props: any) => {
                                        const raw = name === 'Member' ? props.payload.memberRaw : props.payload.teamRaw;
                                        return [typeof raw === 'number' ? raw.toLocaleString() : raw, name];
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '0.65rem', fontWeight: 600 }} iconSize={7} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* Right: Activity Timeline */}
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                        <SectionLabel>ACTIVITY TIMELINE</SectionLabel>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <DetailSparkline userId={member.userId} projectId={projectId} />
                        </Box>
                    </Paper>
                </Box>
                </>
              ) : drawerView === 'commits' ? (
                /* ═══ Commits View ═══ */
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* Back button + Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <IconButton onClick={() => setDrawerView('overview')} size="small"
                            sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}>
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <GitHubIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={700} fontSize="0.9rem" color="#1E293B">
                                Commit History
                            </Typography>
                            <Typography fontSize="0.7rem" color="text.secondary">
                                {commitsLoading ? 'Loading...' : `${commits.length} commit${commits.length !== 1 ? 's' : ''} by ${member.fullName}`}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Commit List */}
                    {commitsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>
                            <CircularProgress size={32} sx={{ color: '#3B82F6' }} />
                        </Box>
                    ) : commits.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <CommitIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                            <Typography color="text.secondary" fontSize="0.85rem">No commits found</Typography>
                        </Box>
                    ) : (() => {
                        const repoLabels = [...new Set(commits.map(c => c.repoLabel || ''))];
                        const hasMultiRepo = repoLabels.length > 1;
                        const repoColor: Record<string, string> = { FRONTEND: '#3B82F6', BACKEND: '#8B5CF6' };
                        const repoIcon: Record<string, string> = { FRONTEND: '🖥️', BACKEND: '⚙️' };

                        const grouped = hasMultiRepo
                            ? repoLabels.map(label => ({ label, commits: commits.filter(c => (c.repoLabel || '') === label) }))
                            : [{ label: '', commits }];

                        return (
                            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                {grouped.map((group, gi) => (
                                    <Box key={group.label || 'all'}>
                                        {hasMultiRepo && (
                                            <Box sx={{
                                                px: 2, py: 1.2,
                                                bgcolor: repoColor[group.label] === '#3B82F6' ? '#EFF6FF' : repoColor[group.label] === '#8B5CF6' ? '#F5F3FF' : '#F8FAFC',
                                                borderBottom: '1px solid #E2E8F0',
                                                ...(gi > 0 ? { borderTop: '2px solid #E2E8F0', mt: 0.5 } : {}),
                                                display: 'flex', alignItems: 'center', gap: 1,
                                            }}>
                                                <Typography fontSize="0.75rem" fontWeight={700}
                                                    sx={{ color: repoColor[group.label] || '#64748B' }}>
                                                    {repoIcon[group.label] || '📁'} {group.label || 'Unknown'}
                                                </Typography>
                                                <Typography fontSize="0.65rem" fontWeight={500} color="text.secondary">
                                                    ({group.commits.length} commits)
                                                </Typography>
                                            </Box>
                                        )}
                                        {group.commits.map((c, i) => (
                                            <Box key={c.commitSha || i} sx={{
                                                px: 2.5, py: 1.5,
                                                borderBottom: i < group.commits.length - 1 ? '1px solid #F1F5F9' : 'none',
                                                '&:hover': { bgcolor: '#F8FAFC' },
                                                transition: 'background 0.12s',
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                    <Box sx={{
                                                        width: 28, height: 28, borderRadius: '50%',
                                                        bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0, mt: 0.2,
                                                    }}>
                                                        <CommitIcon sx={{ fontSize: 14, color: '#3B82F6' }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography fontSize="0.82rem" fontWeight={600} color="#1E293B"
                                                            sx={{
                                                                lineHeight: 1.4,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}>
                                                            {c.commitMessage}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5, flexWrap: 'wrap' }}>
                                                            <Typography fontSize="0.68rem" color="text.secondary">{timeAgo(c.commitDate)}</Typography>
                                                            {c.repoLabel && hasMultiRepo && (
                                                                <Chip label={c.repoLabel} size="small" sx={{
                                                                    height: 18, fontSize: '0.58rem', fontWeight: 700,
                                                                    bgcolor: repoColor[c.repoLabel] === '#3B82F6' ? '#DBEAFE' : repoColor[c.repoLabel] === '#8B5CF6' ? '#EDE9FE' : '#F1F5F9',
                                                                    color: repoColor[c.repoLabel] || '#64748B',
                                                                    borderRadius: 1,
                                                                }} />
                                                            )}
                                                            {c.branchName && (
                                                                <Chip label={c.branchName} size="small" sx={{
                                                                    height: 18, fontSize: '0.6rem', bgcolor: '#EFF6FF',
                                                                    color: '#3B82F6', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                                                                    maxWidth: 140, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                                                                }} />
                                                            )}
                                                            <Chip
                                                                label={c.commitSha?.substring(0, 7)}
                                                                size="small"
                                                                onClick={() => navigator.clipboard.writeText(c.commitSha || '')}
                                                                sx={{
                                                                    height: 18, fontSize: '0.62rem', cursor: 'pointer',
                                                                    fontFamily: "'JetBrains Mono', monospace",
                                                                    bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 600,
                                                                    '&:hover': { bgcolor: '#E2E8F0' },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 0.8, flexShrink: 0, mt: 0.3 }}>
                                                        {c.linesAdded > 0 && (
                                                            <Typography fontSize="0.68rem" fontWeight={700} color="#22C55E"
                                                                sx={{ fontFamily: "'JetBrains Mono', monospace" }}>+{c.linesAdded}</Typography>
                                                        )}
                                                        {c.linesDeleted > 0 && (
                                                            <Typography fontSize="0.68rem" fontWeight={700} color="#EF4444"
                                                                sx={{ fontFamily: "'JetBrains Mono', monospace" }}>-{c.linesDeleted}</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Paper>
                        );
                    })()}
                </Box>
              ) : tasks !== undefined ? (
                /* ═══ Tasks View ═══ */
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* Back button + Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <IconButton onClick={() => setDrawerView('overview')} size="small"
                            sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}>
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <AssignmentTurnedInIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={700} fontSize="0.9rem" color="#1E293B">
                                Task List
                            </Typography>
                            <Typography fontSize="0.7rem" color="text.secondary">
                                {tasksLoading ? 'Loading...' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} assigned to ${member.fullName}`}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Task List */}
                    {tasksLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>
                            <CircularProgress size={32} sx={{ color: '#8B5CF6' }} />
                        </Box>
                    ) : tasks.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <AssignmentTurnedInIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                            <Typography color="text.secondary" fontSize="0.85rem">No tasks found</Typography>
                        </Box>
                    ) : (
                        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                            {(() => {
                                // Group tasks by sprintId, sorted by sprintId ascending, backlog last
                                const grouped = new Map<number | null, JiraIssueResponse[]>();
                                tasks.forEach(t => {
                                    const key = t.sprintId;
                                    if (!grouped.has(key)) grouped.set(key, []);
                                    grouped.get(key)!.push(t);
                                });
                                const sortedKeys = [...grouped.keys()].sort((a, b) => {
                                    if (a === null) return 1;
                                    if (b === null) return -1;
                                    return a - b;
                                });
                                return sortedKeys.map(sprintId => (
                                    <Box key={sprintId ?? 'backlog'}>
                                        {/* Sprint Header */}
                                        <Box sx={{ px: 2, py: 1, bgcolor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 1 }}>
                                            <Typography fontSize="0.72rem" fontWeight={700} color="#475569" sx={{ letterSpacing: '0.03em' }}>
                                                {sprintId ? (sprintMap[sprintId] || `Sprint #${sprintId}`) : 'Backlog'}
                                                <Typography component="span" fontSize="0.65rem" fontWeight={500} color="text.secondary" sx={{ ml: 1 }}>
                                                    ({grouped.get(sprintId)!.length})
                                                </Typography>
                                            </Typography>
                                        </Box>
                                        {grouped.get(sprintId)!.map((t, i, arr) => {
                                            const statusColor = t.status === 'Done' ? '#16A34A' : t.status === 'In Progress' ? '#2563EB' : '#64748B';
                                            const statusBg = t.status === 'Done' ? '#F0FDF4' : t.status === 'In Progress' ? '#EFF6FF' : '#F1F5F9';
                                            const priorityColor = t.priority === 'Highest' || t.priority === 'High' ? '#EF4444' : t.priority === 'Medium' ? '#F59E0B' : '#64748B';
                                            return (
                                                <Box key={t.issueId} sx={{
                                                    px: 2.5, py: 1.5,
                                                    borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
                                                    '&:hover': { bgcolor: '#F8FAFC' },
                                                    transition: 'background 0.12s',
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                        <Box sx={{
                                                            width: 28, height: 28, borderRadius: '50%',
                                                            bgcolor: statusBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0, mt: 0.2,
                                                        }}>
                                                            <AssignmentTurnedInIcon sx={{ fontSize: 14, color: statusColor }} />
                                                        </Box>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography fontSize="0.82rem" fontWeight={600} color="#1E293B"
                                                                sx={{ lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {t.summary}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5, flexWrap: 'wrap' }}>
                                                                <Chip label={t.issueKey} size="small" sx={{
                                                                    height: 18, fontSize: '0.62rem', fontWeight: 600,
                                                                    fontFamily: "'JetBrains Mono', monospace",
                                                                    bgcolor: '#F1F5F9', color: '#64748B',
                                                                }} />
                                                                <Chip label={t.status} size="small" sx={{
                                                                    height: 18, fontSize: '0.6rem', fontWeight: 700,
                                                                    bgcolor: statusBg, color: statusColor,
                                                                }} />
                                                                <Chip label={t.priority} size="small" sx={{
                                                                    height: 18, fontSize: '0.6rem', fontWeight: 600,
                                                                    bgcolor: `${priorityColor}12`, color: priorityColor,
                                                                }} />
                                                                <Chip label={t.issueType} size="small" sx={{
                                                                    height: 18, fontSize: '0.6rem', fontWeight: 600,
                                                                    bgcolor: '#EFF6FF', color: '#3B82F6',
                                                                }} />
                                                                {t.dueDate && (
                                                                    <Typography fontSize="0.65rem" color="text.secondary">
                                                                        Due: {new Date(t.dueDate).toLocaleDateString('vi-VN')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ));
                            })()}
                        </Paper>
                    )}
                </Box>
              ) : null}
            </Box>
        </Dialog>
    );
};

/* ── Helpers ── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary"
        sx={{ mb: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {children}
    </Typography>
);

export default MemberDetailDrawer;
