import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Box, Typography, IconButton, Paper, CircularProgress, Avatar, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CommitIcon from '@mui/icons-material/Commit';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StarIcon from '@mui/icons-material/Star';
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
import { AVATAR_COLORS, getInitials } from './constants';
import type { ContributionResponse } from '../../../types/contribution.types';

export interface TeamAverages {
    commits: number;
    linesAdded: number;
    taskCompletionRate: number;
    contributionScore: number;
}

export interface MemberDashboardViewProps {
    member: ContributionResponse | null;
    projectId: number;
    rank: number;
    contributionPercent: number;
    teamAverages: TeamAverages;
    onClose?: () => void;
    isModal?: boolean;
}

/* ── Plush Stat Item ── */
const PlushStat: React.FC<{
    label: string; value: string | number; subValue?: React.ReactNode; icon?: React.ReactNode; color?: string;
}> = ({ label, value, subValue, icon, color = '#0F172A' }) => (
    <Box sx={{
        display: 'flex', flexDirection: 'column', gap: 1,
        p: 2, borderRadius: 3, bgcolor: '#FAFAFA',
        border: '1px solid rgba(0,0,0,0.02)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)',
        alignItems: 'center', textAlign: 'center',
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            {icon && <Box sx={{ color, display: 'flex', '& > svg': { fontSize: 16 } }}>{icon}</Box>}
            <Typography fontSize="0.75rem" color="#64748B" fontWeight={600} sx={{ letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, justifyContent: 'center' }}>
            <Typography fontSize="1.4rem" fontWeight={800} sx={{ color: '#0F172A', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                {value}
            </Typography>
            {subValue && (
                <Typography fontSize="0.75rem" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>{subValue}</Typography>
            )}
        </Box>
    </Box>
);

const MemberDashboardView: React.FC<MemberDashboardViewProps> = ({
    member, projectId, rank, contributionPercent, teamAverages, onClose, isModal = false
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
        if (isModal && drawerView === 'overview') {
            const timer = setTimeout(() => {
                if (bodyRef.current) setBodyHeight(bodyRef.current.offsetHeight);
            }, 350); // wait for MUI Dialog transition
            return () => clearTimeout(timer);
        }
    }, [isModal, drawerView]);

    // Scroll position preservation for non-modal view
    const savedScrollY = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (savedScrollY.current !== null) {
            window.scrollTo(0, savedScrollY.current);
            savedScrollY.current = null;
        }
    }, [drawerView]);

    // Clear minHeight after data loads to allow natural sizing
    useEffect(() => {
        if (!commitsLoading && !tasksLoading && containerRef.current) {
            containerRef.current.style.minHeight = '';
        }
    }, [commitsLoading, tasksLoading]);

    const handleOpenCommits = () => {
        if (!isModal) {
            savedScrollY.current = window.scrollY;
            if (containerRef.current) containerRef.current.style.minHeight = `${containerRef.current.offsetHeight}px`;
        } else {
            if (bodyRef.current) setBodyHeight(bodyRef.current.offsetHeight);
        }
        setDrawerView('commits');
        setCommitsLoading(true);
        githubService.getCommits(projectId, { userId: member!.userId })
            .then(res => setCommits(res.data?.data || []))
            .catch(() => setCommits([]))
            .finally(() => setCommitsLoading(false));
    };

    const handleOpenTasks = () => {
        if (!isModal) {
            savedScrollY.current = window.scrollY;
            if (containerRef.current) containerRef.current.style.minHeight = `${containerRef.current.offsetHeight}px`;
        } else {
            if (bodyRef.current) setBodyHeight(bodyRef.current.offsetHeight);
        }
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

    return (
        <Box ref={containerRef} sx={{
            display: 'flex', flexDirection: 'column', height: '100%',
            borderRadius: isModal ? 0 : 4,
            bgcolor: '#F8FAFC',
            overflow: 'hidden',
        }}>
            {/* ═══ VIP Header ═══ */}
            <Box sx={{
                px: 4, py: 3,
                display: 'flex', alignItems: 'center', gap: 3,
                background: '#FFFFFF',
                borderBottom: '1px solid rgba(226,232,240,0.8)',
                position: 'relative', zIndex: 10,
                boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
            }}>
                <Box sx={{ position: 'relative' }}>
                    <Box sx={{ position: 'absolute', inset: -4, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor}, #8B5CF6)`, opacity: 0.3, filter: 'blur(6px)' }} />
                    <Avatar sx={{
                        width: 56, height: 56, position: 'relative',
                        bgcolor: '#FFFFFF', color: avatarColor,
                        fontWeight: 800, fontSize: 20,
                        border: `2px solid ${avatarColor}40`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        {getInitials(member.fullName)}
                    </Avatar>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={800} fontSize="1.3rem" color="#0F172A"
                        sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {member.fullName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.8 }}>
                        {member.role && member.role !== 'UNKNOWN' && (
                            <Typography fontSize="0.8rem" fontWeight={600} color="#64748B">
                                {member.role.charAt(0) + member.role.slice(1).toLowerCase()} Engineer
                            </Typography>
                        )}
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                            <Typography fontSize="0.75rem" fontWeight={700} color="#D97706">
                                Rank #{rank}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                {onClose && (
                    <IconButton onClick={onClose} sx={{ 
                        bgcolor: '#F1F5F9', color: '#64748B', 
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A', transform: 'scale(1.05)' } 
                    }}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* ═══ Premium Body ═══ */}
            <Box ref={bodyRef} sx={{ p: { xs: 2.5, md: 4 }, flex: 1, bgcolor: '#F1F5F9', ...((drawerView === 'commits' || drawerView === 'tasks') && bodyHeight ? { height: bodyHeight, maxHeight: bodyHeight, overflow: 'auto', display: 'flex', flexDirection: 'column' } : { overflowY: 'auto' }) }}>

              {drawerView === 'overview' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    
                    {/* Row 1: The 3 Core Pillars */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
                        
                        {/* Overall Score */}
                        <Paper elevation={0} sx={{ 
                            p: 3, borderRadius: 4, 
                            border: '1px solid rgba(255,255,255,0.8)', 
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.02)',
                            display: 'flex', flexDirection: 'column',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, position: 'relative' }}>
                                <Typography fontSize="1.1rem" fontWeight={800} color="#0F172A">Performance Score</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2.5, xl: 3 }, flex: 1, position: 'relative' }}>
                                <ScoreRing score={contributionPercent} size={76} thickness={6} />
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0, justifyContent: 'center' }}>
                                    <MiniProgress label="Code Score" value={member.codeScore} color="#3B82F6" />
                                    <MiniProgress label="Task Score" value={member.taskScore} color="#10B981" />
                                    <MiniProgress label="Consistency" value={member.consistencyScore} color="#F59E0B" />
                                </Box>
                            </Box>
                        </Paper>

                        {/* GitHub Pillar */}
                        <Paper elevation={0} onClick={handleOpenCommits} sx={{ 
                            p: 3, borderRadius: 4, 
                            border: '1px solid rgba(255,255,255,0.8)', 
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.02)',
                            display: 'flex', flexDirection: 'column', cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 40px -10px rgba(59,130,246,0.15), 0 2px 10px rgba(59,130,246,0.05)', borderColor: '#BFDBFE' }
                        }}>
                            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, position: 'relative' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#EFF6FF', color: '#3B82F6', display: 'flex' }}>
                                        <GitHubIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography fontSize="1.1rem" fontWeight={800} color="#0F172A">GitHub</Typography>
                                </Box>
                                <OpenInNewIcon sx={{ fontSize: 18, color: '#CBD5E1' }} />
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                <PlushStat label="Commits" value={member.totalCommits} icon={<CommitIcon />} color="#3B82F6" />
                                <PlushStat label="Active Days" value={member.activeDays} />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3, mt: 'auto', px: 1, justifyContent: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                                    <Typography fontSize="0.85rem" fontWeight={700} color="#10B981" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>+{member.linesAdded.toLocaleString()}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                                    <Typography fontSize="0.85rem" fontWeight={700} color="#EF4444" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>-{member.linesDeleted.toLocaleString()}</Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Jira Pillar */}
                        <Paper elevation={0} onClick={handleOpenTasks} sx={{ 
                            p: 3, borderRadius: 4, 
                            border: '1px solid rgba(255,255,255,0.8)', 
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.02)',
                            display: 'flex', flexDirection: 'column', cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 40px -10px rgba(139,92,246,0.15), 0 2px 10px rgba(139,92,246,0.05)', borderColor: '#DDD6FE' }
                        }}>
                            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, position: 'relative' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#F5F3FF', color: '#8B5CF6', display: 'flex' }}>
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                            <path d="M11.53 2c0 2.4-1.97 4.35-4.35 4.35h-5.2C.88 6.35 0 7.23 0 8.35v5.2c0 2.4 1.97 4.35 4.35 4.35h5.2c1.1 0 1.98-.88 1.98-2V2zM24 10.35c0 2.4-1.97 4.35-4.35 4.35h-5.2c-1.1 0-1.98-.88-1.98-2v-5.2c0-2.4 1.97-4.35 4.35-4.35h5.2c1.1 0 1.98.88 1.98 2v5.2zM12.47 14c0-2.4 1.97-4.35 4.35-4.35h5.2c1.1 0 1.98.88 1.98 2v5.2c0 2.4-1.97 4.35-4.35 4.35h-5.2c-1.1 0-1.98-.88-1.98-2v-5.2z" />
                                        </svg>
                                    </Box>
                                    <Typography fontSize="1.1rem" fontWeight={800} color="#0F172A">Jira</Typography>
                                </Box>
                                <OpenInNewIcon sx={{ fontSize: 18, color: '#CBD5E1' }} />
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                <PlushStat label="Resolved" value={member.tasksCompleted} subValue={<span style={{ color: '#94A3B8' }}>/ {member.tasksAssigned}</span>} color="#8B5CF6" />
                                <PlushStat label="Completion" value={`${Math.round(member.taskCompletionRate)}%`} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto', px: 1, justifyContent: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: member.overdueTaskCount > 0 ? '#EF4444' : '#94A3B8', boxShadow: member.overdueTaskCount > 0 ? '0 0 8px #EF444480' : 'none' }} />
                                <Typography fontSize="0.85rem" fontWeight={600} color="#64748B">Overdue Tasks:</Typography>
                                <Typography fontSize="0.9rem" fontWeight={800} color={member.overdueTaskCount > 0 ? '#EF4444' : '#0F172A'} sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{member.overdueTaskCount}</Typography>
                            </Box>
                        </Paper>
                    </Box>

                    {/* Row 2: Radar + Timeline */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 5fr' }, gap: 3 }}>
                        {/* Radar */}
                        <Paper elevation={0} sx={{ 
                            p: 3, borderRadius: 4, 
                            border: '1px solid rgba(255,255,255,0.8)', 
                            background: '#FFFFFF',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
                            display: 'flex', flexDirection: 'column' 
                        }}>
                            <Typography fontSize="1rem" fontWeight={800} color="#0F172A" sx={{ mb: 2 }}>Team Comparison</Typography>
                            <Box sx={{ flex: 1, minHeight: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="60%"
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
                                        <PolarGrid stroke="#F1F5F9" strokeWidth={1} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                                        <Radar name="Team Avg" dataKey="team" stroke="#CBD5E1" fill="#F8FAFC" fillOpacity={0.5} strokeDasharray="3 3" strokeWidth={2} />
                                        <Radar name="Member" dataKey="member" stroke="#8B5CF6" fill="url(#vipColorMember)" fillOpacity={1} strokeWidth={2} style={{ filter: 'drop-shadow(0 4px 10px rgba(139,92,246,0.3))' }} />
                                        <defs>
                                            <linearGradient id="vipColorMember" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '12px 16px', fontSize: '0.8rem', fontWeight: 600 }}
                                            formatter={(_: any, name: string, props: any) => {
                                                const raw = name === 'Member' ? props.payload.memberRaw : props.payload.teamRaw;
                                                return [typeof raw === 'number' ? raw.toLocaleString() : raw, name];
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', paddingTop: 10 }} iconSize={8} iconType="circle" />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>

                        {/* Timeline */}
                        <Paper id="activity-timeline" elevation={0} sx={{ 
                            p: 3, borderRadius: 4, 
                            border: '1px solid rgba(255,255,255,0.8)', 
                            background: '#FFFFFF',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
                            display: 'flex', flexDirection: 'column' 
                        }}>
                            <Typography fontSize="1rem" fontWeight={800} color="#0F172A" sx={{ mb: 2 }}>Activity Pipeline</Typography>
                            <Box sx={{ flex: 1, minHeight: 220, mt: 1 }}>
                                <DetailSparkline userId={member.userId} projectId={projectId} activeDays={member.activeDays} />
                            </Box>
                        </Paper>
                    </Box>

                </Box>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
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
        </Box>
    );
};

/* ── Helpers ── */

export default MemberDashboardView;
