import React, { useState } from 'react';
import {
    Box, Typography, Paper, Avatar, Chip, Tooltip,
    Button, Slider, Collapse, Skeleton, Dialog, DialogContent, IconButton,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CommitIcon from '@mui/icons-material/Commit';
import AddIcon from '@mui/icons-material/Add';
import CalculateIcon from '@mui/icons-material/Calculate';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RemoveIcon from '@mui/icons-material/Remove';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CloseIcon from '@mui/icons-material/Close';
import useContribution, { useHeatmap } from '../../hooks/useContribution';
import type { ContributionResponse, HeatmapResponse } from '../../types/contribution.types';

/* ═══════════ Design Tokens ═══════════ */
const GRADIENTS = {
    gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
    silver: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
    bronze: 'linear-gradient(135deg, #CD7F32, #B8860B)',
    blue: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    green: 'linear-gradient(135deg, #10B981, #059669)',
    purple: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    amber: 'linear-gradient(135deg, #F59E0B, #D97706)',
    header: 'linear-gradient(135deg, #0F172A 0%, #1E2A4A 50%, #2D3A5C 100%)',
};
const AVATAR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];
const DOMAIN_META: Record<string, { color: string; bg: string; label: string }> = {
    FRONTEND: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Frontend' },
    BACKEND: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Backend' },
    BOTH: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Full Stack' },
    UNKNOWN: { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: 'Unassigned' },
};

const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

/* ═══════════ Score Ring ═══════════ */
const ScoreRing: React.FC<{ score: number; size?: number; thickness?: number }> = ({
    score, size = 72, thickness = 5,
}) => {
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (Math.min(score, 100) / 100) * circumference;
    const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : score >= 25 ? '#EF4444' : '#94A3B8';

    return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id={`ring-${score}-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={thickness} />
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={`url(#ring-${score}-${size})`} strokeWidth={thickness}
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
            </svg>
            <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography fontWeight={800} fontSize={size * 0.28}
                    sx={{ fontFamily: "'Inter', sans-serif", color, lineHeight: 1 }}>
                    {Math.round(score)}
                </Typography>
                <Typography fontSize={size * 0.11} color="text.secondary" fontWeight={600}
                    sx={{ lineHeight: 1, mt: 0.2, letterSpacing: '0.02em' }}>
                    0-100
                </Typography>
            </Box>
        </Box>
    );
};

/* ═══════════ Heatmap Calendar ═══════════ */
const HeatmapCalendar: React.FC<{ data: HeatmapResponse | null; loading: boolean; compact?: boolean }> = ({ data, loading, compact = false }) => {
    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
            <Typography fontSize="0.6rem" color="text.secondary">Loading...</Typography>
        </Box>
    );
    if (!data || data.entries.length === 0) return null;

    const maxCommits = Math.max(...data.entries.map(e => e.commitCount), 1);
    const dateMap = new Map(data.entries.map(e => [e.date, e]));
    const totalDays = compact ? 60 : 90;
    const days: { date: string; level: number; commits: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        const commits = entry?.commitCount || 0;
        days.push({ date: dateStr, level: commits === 0 ? 0 : Math.ceil((commits / maxCommits) * 4), commits });
    }
    const lvlColors = ['rgba(148,163,184,0.08)', '#9BE9A8', '#40C463', '#30A14E', '#216E39'];
    const cellSize = compact ? 9 : 11;
    const gap = compact ? '2px' : '3px';

    // Group days into weeks (columns) for proper calendar layout
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];
    days.forEach((d, idx) => {
        const dayOfWeek = new Date(d.date).getDay();
        if (idx === 0) {
            // Pad first week
            for (let j = 0; j < dayOfWeek; j++) {
                currentWeek.push({ date: '', level: -1, commits: 0 });
            }
        }
        currentWeek.push(d);
        if (dayOfWeek === 6 || idx === days.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    const months: string[] = [];
    const monthPositions: { label: string; col: number }[] = [];
    weeks.forEach((week, wi) => {
        const firstValid = week.find(d => d.date);
        if (firstValid && firstValid.date) {
            const m = firstValid.date.substring(0, 7);
            if (!months.includes(m)) {
                months.push(m);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthIdx = parseInt(m.split('-')[1]) - 1;
                monthPositions.push({ label: monthNames[monthIdx], col: wi });
            }
        }
    });

    return (
        <Box>
            {/* Month labels */}
            <Box sx={{ display: 'flex', gap, mb: 0.3, pl: 0 }}>
                {monthPositions.map((mp, idx) => {
                    const nextCol = idx < monthPositions.length - 1 ? monthPositions[idx + 1].col : weeks.length;
                    const span = nextCol - mp.col;
                    return (
                        <Typography key={mp.label + mp.col} fontSize="0.55rem" color="text.secondary" fontWeight={600}
                            sx={{ width: `calc(${span} * (${cellSize}px + ${gap}))`, flexShrink: 0 }}>
                            {mp.label}
                        </Typography>
                    );
                })}
            </Box>
            {/* Heatmap grid - weeks as columns, days as rows */}
            <Box sx={{ display: 'flex', gap }}>
                {weeks.map((week, wi) => (
                    <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap }}>
                        {week.map((d, di) => (
                            d.level === -1 ? (
                                <Box key={di} sx={{ width: cellSize, height: cellSize }} />
                            ) : (
                                <Tooltip key={d.date} title={`${d.date}: ${d.commits} commits`} arrow placement="top">
                                    <Box sx={{
                                        width: cellSize, height: cellSize, borderRadius: '2px',
                                        bgcolor: lvlColors[d.level],
                                        transition: 'transform 0.1s',
                                        '&:hover': { transform: 'scale(1.5)' },
                                    }} />
                                </Tooltip>
                            )
                        ))}
                    </Box>
                ))}
            </Box>
            {/* Legend */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.5, justifyContent: 'flex-end' }}>
                <Typography fontSize="0.5rem" color="text.secondary">0</Typography>
                {lvlColors.map((c, i) => (
                    <Box key={i} sx={{
                        width: 8, height: 8, borderRadius: '1.5px', bgcolor: c,
                        border: i === 0 ? '1px solid rgba(148,163,184,0.2)' : 'none',
                    }} />
                ))}
                <Typography fontSize="0.5rem" color="text.secondary">High</Typography>
            </Box>
        </Box>
    );
};

const MemberHeatmap: React.FC<{ userId: number; projectId: number; compact?: boolean }> = ({ userId, projectId, compact }) => {
    const { data, isLoading } = useHeatmap(userId, projectId, true);
    return <HeatmapCalendar data={data ?? null} loading={isLoading} compact={compact} />;
};

/* ═══════════ Mini Progress Bar ═══════════ */
const MiniProgress: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography fontSize="0.62rem" color="text.secondary" fontWeight={600}>{label}</Typography>
            <Typography fontSize="0.62rem" fontWeight={800} sx={{ color, fontFamily: "'Inter', sans-serif" }}>
                {Math.round(value)}
            </Typography>
        </Box>
        <Box sx={{ height: 5, borderRadius: 3, bgcolor: `${color}12`, overflow: 'hidden' }}>
            <Box sx={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(value, 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}BB)`,
                transition: 'width 0.8s ease',
            }} />
        </Box>
    </Box>
);

/* ═══════════ Member Card (Grid layout - shows everything) ═══════════ */
const MemberCard: React.FC<{
    m: ContributionResponse;
    rank: number;
    projectId: number;
    onOpenDetail: (m: ContributionResponse) => void;
}> = ({ m, rank, projectId, onOpenDetail }) => {
    const avatarColor = AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length];
    const domain = DOMAIN_META[m.domain] || DOMAIN_META.UNKNOWN;
    const isTop3 = rank <= 3;
    const podiumGradient = rank === 1 ? GRADIENTS.gold : rank === 2 ? GRADIENTS.silver : GRADIENTS.bronze;

    return (
        <Paper elevation={0}
            onClick={() => onOpenDetail(m)}
            sx={{
                borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
                border: '1px solid', borderColor: (m.inactive || m.hasLowContribution) ? 'rgba(239,68,68,0.35)' : 'divider',
                borderLeft: (m.inactive || m.hasLowContribution) ? '3px solid #EF4444' : undefined,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: (m.inactive || m.hasLowContribution) ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.3)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    transform: 'translateY(-4px)',
                },
            }}
        >
            {/* Top accent for top 3 */}
            {isTop3 && (
                <Box sx={{ height: 3, background: podiumGradient }} />
            )}

            <Box sx={{ p: 2 }}>
                {/* ── Header: Medal + Avatar + Name ── */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {/* Medal / Rank badge - LEFT of avatar */}
                    {rank === 1 ? (
                        <Typography fontSize="1.25rem" lineHeight={1}>🥇</Typography>
                    ) : rank === 2 ? (
                        <Typography fontSize="1.25rem" lineHeight={1}>🥈</Typography>
                    ) : rank === 3 ? (
                        <Typography fontSize="1.25rem" lineHeight={1}>🥉</Typography>
                    ) : (
                        <Box sx={{
                            width: 26, height: 26, borderRadius: '50%',
                            bgcolor: 'rgba(148,163,184,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Typography fontSize="0.7rem" fontWeight={800} color="text.secondary">
                                {rank}
                            </Typography>
                        </Box>
                    )}
                    {/* Avatar */}
                    <Avatar sx={{
                        width: 38, height: 38,
                        background: `linear-gradient(135deg, ${avatarColor}25, ${avatarColor}10)`,
                        color: avatarColor,
                        fontWeight: 700, fontSize: 13,
                        fontFamily: "'Inter', sans-serif",
                        border: `2px solid ${avatarColor}35`,
                    }}>
                        {getInitials(m.fullName)}
                    </Avatar>
                    {/* Name + Domain */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} fontSize="0.85rem" noWrap
                            sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.2 }}>
                            {m.fullName}
                        </Typography>
                        <Chip label={domain.label} size="small"
                            sx={{
                                height: 18, fontSize: '0.55rem', fontWeight: 700, mt: 0.3,
                                bgcolor: domain.bg, color: domain.color, borderRadius: 1,
                            }} />
                    </Box>
                </Box>

                {/* ── Score Ring + Progress Bars ── */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ScoreRing score={m.contributionScore} size={64} thickness={4} />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <MiniProgress label="GitHub Impact" value={m.githubImpactScore} color="#3B82F6" />
                        <MiniProgress label="Jira Execution" value={m.jiraExecutionScore} color="#10B981" />
                    </Box>
                </Box>

                {/* ── Metric Chips ── */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CommitIcon sx={{ fontSize: 12, color: '#64748B' }} />
                        <Typography fontSize="0.65rem" color="text.secondary" fontWeight={600}>
                            Commits count
                        </Typography>
                        <Typography fontSize="0.65rem" fontWeight={800} sx={{ ml: 'auto', color: '#1E293B' }}>
                            {m.totalCommits}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AssignmentTurnedInIcon sx={{ fontSize: 12, color: '#64748B' }} />
                        <Typography fontSize="0.65rem" color="text.secondary" fontWeight={600}>
                            Tasks done
                        </Typography>
                        <Typography fontSize="0.65rem" fontWeight={800} sx={{ ml: 'auto', color: '#1E293B' }}>
                            {m.tasksCompleted}/{m.tasksAssigned}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AddIcon sx={{ fontSize: 12, color: '#3FB950' }} />
                        <Typography fontSize="0.65rem" fontWeight={700} sx={{ color: '#3FB950', fontFamily: "'JetBrains Mono', monospace" }}>
                            {m.linesAdded.toLocaleString()} added
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <RemoveIcon sx={{ fontSize: 12, color: '#F85149' }} />
                        <Typography fontSize="0.65rem" fontWeight={700} sx={{ color: '#F85149', fontFamily: "'JetBrains Mono', monospace" }}>
                            {m.linesDeleted.toLocaleString()} deleted
                        </Typography>
                    </Box>
                </Box>

                {/* ── Stats Grid ── */}
                <Box sx={{ mb: 1.5 }}>
                    <Typography fontSize="0.65rem" fontWeight={700} color="text.secondary" sx={{ mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        📊 Stats
                    </Typography>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5,
                        bgcolor: 'rgba(248,250,252,0.8)', borderRadius: 1.5, p: 1,
                        border: '1px solid', borderColor: 'rgba(226,232,240,0.6)',
                    }}>
                        {[
                            { label: 'Total', value: Math.round(m.contributionScore) },
                            { label: 'Commits', value: m.totalCommits },
                            { label: 'Lines', value: `${(m.linesAdded / 1000).toFixed(0)}K` },
                            { label: 'Active', value: `${m.activeDays}d` },
                            { label: 'Consist', value: m.consistencyFactor.toFixed(1) },
                            { label: 'Churn', value: m.codeChurnRate.toFixed(1) },
                        ].map(s => (
                            <Box key={s.label} sx={{ textAlign: 'center' }}>
                                <Typography fontSize="0.72rem" fontWeight={800}
                                    sx={{ fontFamily: "'Inter', sans-serif", color: '#1E293B', lineHeight: 1 }}>
                                    {s.value}
                                </Typography>
                                <Typography fontSize="0.5rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.2 }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ── Heatmap ── */}
                <MemberHeatmap userId={m.userId} projectId={projectId} compact />
            </Box>

        </Paper>
    );
};

/* ═══════════ Detail Dialog (Expanded View - Image 2) ═══════════ */
const DetailSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    accentColor: string;
    score?: number;
    children: React.ReactNode;
}> = ({ title, icon, accentColor, score, children }) => (
    <Box sx={{
        borderLeft: `3px solid ${accentColor}`,
        pl: 2, py: 1,
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: accentColor, display: 'flex' }}>{icon}</Box>
                <Typography fontWeight={700} fontSize="0.88rem" sx={{ fontFamily: "'Inter', sans-serif" }}>
                    {title}
                </Typography>
            </Box>
            {score !== undefined && (
                <Typography fontWeight={800} fontSize="0.88rem" sx={{ color: accentColor, fontFamily: "'Inter', sans-serif" }}>
                    {Math.round(score)}/100
                </Typography>
            )}
        </Box>
        {children}
    </Box>
);

const MemberDetailDialog: React.FC<{
    member: ContributionResponse | null;
    rank: number;
    projectId: number;
    open: boolean;
    onClose: () => void;
}> = ({ member, rank, projectId, open, onClose }) => {
    if (!member) return null;
    const m = member;
    const avatarColor = AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length];
    const domain = DOMAIN_META[m.domain] || DOMAIN_META.UNKNOWN;
    const isTop3 = rank <= 3;
    const podiumGradient = rank === 1 ? GRADIENTS.gold : rank === 2 ? GRADIENTS.silver : GRADIENTS.bronze;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{
                sx: { borderRadius: 4, maxHeight: '85vh' },
            }}>
            <DialogContent sx={{ p: 0 }}>
                {/* Close button */}
                <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>

                {/* ── Member Overview Bar ── */}
                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: 'rgba(248,250,252,0.5)',
                }}>
                    <Avatar sx={{
                        width: 52, height: 52,
                        background: `linear-gradient(135deg, ${avatarColor}25, ${avatarColor}10)`,
                        color: avatarColor, fontWeight: 700, fontSize: 18,
                        fontFamily: "'Inter', sans-serif",
                        border: `2px solid ${avatarColor}35`,
                    }}>
                        {getInitials(m.fullName)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} fontSize="1.1rem"
                            sx={{ fontFamily: "'Inter', sans-serif" }}>
                            {m.fullName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
                            <Chip label={domain.label} size="small"
                                sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: domain.bg, color: domain.color, borderRadius: 1.5 }} />
                            {m.smartCoderBonus > 1.1 && (
                                <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '11px !important', color: '#F59E0B !important' }} />}
                                    label="Smart Coder" size="small"
                                    sx={{ height: 20, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderRadius: 1.5 }} />
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                        <ScoreRing score={m.contributionScore} size={60} thickness={4} />
                        <Box sx={{
                            width: 32, height: 32, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            ...(isTop3 ? {
                                background: podiumGradient,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            } : {
                                bgcolor: '#F1F5F9', border: '1.5px solid', borderColor: 'divider',
                            }),
                        }}>
                            {isTop3 ? (
                                <EmojiEventsIcon sx={{ fontSize: 16, color: '#fff' }} />
                            ) : (
                                <Typography fontWeight={800} fontSize="0.75rem" color="text.secondary">#{rank}</Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ── Detail Sections ── */}
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* GitHub Impact */}
                    <DetailSection title="GitHub Impact" icon={<GitHubIcon sx={{ fontSize: 18 }} />}
                        accentColor="#3B82F6" score={m.githubImpactScore}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
                            {[
                                { label: 'commits', value: m.totalCommits, color: '#1E293B' },
                                { label: 'lines added', value: `+${m.linesAdded.toLocaleString()}`, color: '#3FB950' },
                                { label: 'lines deleted', value: `-${m.linesDeleted.toLocaleString()}`, color: '#F85149' },
                                { label: 'bug fixes', value: m.bugFixCommits, color: '#F59E0B' },
                            ].map(s => (
                                <Box key={s.label} sx={{ textAlign: 'center' }}>
                                    <Typography fontWeight={800} fontSize="0.95rem"
                                        sx={{ color: s.color, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
                                        {s.value}
                                    </Typography>
                                    <Typography fontSize="0.55rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.3 }}>
                                        {s.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        <Typography fontSize="0.65rem" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>
                            90 days of commit history
                        </Typography>
                        <MemberHeatmap userId={m.userId} projectId={projectId} />
                    </DetailSection>

                    {/* Jira Execution */}
                    <DetailSection title="Jira Execution" icon={<TaskAltIcon sx={{ fontSize: 18 }} />}
                        accentColor="#10B981" score={m.jiraExecutionScore}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                            {[
                                { label: 'Tasks completed', value: `${m.tasksCompleted}/${m.tasksAssigned}`, color: '#1E293B' },
                                { label: 'Completion rate', value: `${Math.round(m.taskCompletionRate)}%`, color: m.taskCompletionRate >= 70 ? '#10B981' : '#F59E0B' },
                                { label: 'In progress', value: m.tasksInProgress, color: '#3B82F6' },
                                { label: 'Reworks', value: m.reworkCount, color: m.reworkCount > 3 ? '#EF4444' : '#64748B' },
                            ].map(s => (
                                <Box key={s.label} sx={{ textAlign: 'center' }}>
                                    <Typography fontWeight={800} fontSize="0.95rem"
                                        sx={{ color: s.color, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
                                        {s.value}
                                    </Typography>
                                    <Typography fontSize="0.55rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.3 }}>
                                        {s.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </DetailSection>

                    {/* Consistency & Quality */}
                    <DetailSection title="Consistency & Quality" icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
                        accentColor="#8B5CF6">
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                            {[
                                { label: 'Active days', value: m.activeDays, color: '#1E293B' },
                                { label: 'Consistency Factor', value: `×${m.consistencyFactor.toFixed(2)}`, color: '#8B5CF6' },
                                { label: 'Smart Bonus', value: `×${m.smartCoderBonus.toFixed(2)}`, color: m.smartCoderBonus > 1.1 ? '#F59E0B' : '#64748B' },
                                { label: 'Code Churn Rate', value: m.codeChurnRate.toFixed(2), color: m.codeChurnRate > 1.5 ? '#EF4444' : '#64748B' },
                            ].map(s => (
                                <Box key={s.label} sx={{ textAlign: 'center' }}>
                                    <Typography fontWeight={800} fontSize="0.95rem"
                                        sx={{ color: s.color, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
                                        {s.value}
                                    </Typography>
                                    <Typography fontSize="0.55rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.3 }}>
                                        {s.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </DetailSection>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

/* ═══════════ Main Page ═══════════ */
const ContributionPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const { dashboard, loading, recalculating, recalculate } = useContribution(pid);
    const [feWeight, setFeWeight] = useState(50);
    const [showConfig, setShowConfig] = useState(false);
    const [formulaOpen, setFormulaOpen] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);
    const [selectedMember, setSelectedMember] = useState<ContributionResponse | null>(null);
    const [selectedRank, setSelectedRank] = useState(0);

    const handleRecalculate = async () => {
        await recalculate(feWeight / 100);
    };

    const handleOpenDetail = (m: ContributionResponse, rank: number) => {
        setSelectedMember(m);
        setSelectedRank(rank);
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="rounded" height={100} sx={{ mb: 3, borderRadius: 3 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 3 }} />)}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={350} sx={{ borderRadius: 3 }} />)}
                </Box>
            </Box>
        );
    }

    if (!dashboard) {
        return (
            <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography fontSize="3rem" sx={{ mb: 2 }}>📊</Typography>
                <Typography fontWeight={700} fontSize="1.1rem" sx={{ mb: 0.5 }}>No contribution data yet</Typography>
                <Typography fontSize="0.85rem" color="text.secondary">
                    Connect GitHub & Jira, then click Recalculate.
                </Typography>
            </Box>
        );
    }

    const members = dashboard.memberContributions || [];
    const anomalies = dashboard.detectedAnomalies || [];

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

            {/* ══════════ Hero Header ══════════ */}
            <Paper elevation={0} sx={{
                p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
                background: GRADIENTS.header, color: '#fff',
            }}>
                <Box sx={{
                    position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)',
                }} />
                <Box sx={{
                    position: 'absolute', bottom: -30, left: '30%', width: 150, height: 150,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent)',
                }} />
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="h5" fontWeight={800}
                                sx={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                                Contribution Analytics
                            </Typography>
                            <StarIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={() => setFormulaOpen(true)}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600,
                                fontSize: '0.78rem', borderRadius: 2.5, px: 2,
                                border: '1px solid rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            }}>
                            <CalculateIcon sx={{ fontSize: 14, mr: 0.5 }} /> Formula
                        </Button>
                        <Button size="small" onClick={() => setShowConfig(!showConfig)}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600,
                                fontSize: '0.78rem', borderRadius: 2.5, px: 2,
                                border: '1px solid rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            }}>
                            ⚙️ Weights
                        </Button>
                        <Button size="small" startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                            onClick={handleRecalculate} disabled={recalculating}
                            sx={{
                                textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                                borderRadius: 2.5, px: 2.5, color: '#fff',
                                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                                '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.6)' },
                                '&.Mui-disabled': { opacity: 0.6 },
                            }}>
                            {recalculating ? 'Calculating...' : 'Recalculate'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* ══════════ Weights Config ══════════ */}
            <Collapse in={showConfig}>
                <Paper elevation={0} sx={{
                    p: 2.5, mb: 2.5, borderRadius: 3,
                    border: '1px solid', borderColor: 'divider',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.04))',
                }}>
                    <Typography fontWeight={700} fontSize="0.85rem" sx={{ mb: 1.5 }}>Domain Weighting</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={`FE ${feWeight}%`} size="small"
                            sx={{ fontWeight: 700, bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', minWidth: 65 }} />
                        <Slider value={feWeight} onChange={(_, v) => setFeWeight(v as number)}
                            min={0} max={100} step={5}
                            sx={{
                                flex: 1, color: '#3B82F6',
                                '& .MuiSlider-track': { background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' },
                                '& .MuiSlider-thumb': { boxShadow: '0 0 8px rgba(59,130,246,0.4)' },
                            }} />
                        <Chip label={`BE ${100 - feWeight}%`} size="small"
                            sx={{ fontWeight: 700, bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981', minWidth: 65 }} />
                    </Box>
                </Paper>
            </Collapse>

            {/* ══════════ Summary Stats ══════════ */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
                {
                    [
                        {
                            label: 'Team Members', value: dashboard.totalMembers, color: '#3B82F6', bg: '#EFF6FF',
                            icon: <Box component="span" sx={{ fontSize: 16 }}>👥</Box>
                        },
                        {
                            label: 'Total Commits', value: dashboard.totalCommits.toLocaleString(), color: '#10B981', bg: '#ECFDF5',
                            icon: <CommitIcon sx={{ fontSize: 16, color: '#10B981' }} />
                        },
                        {
                            label: 'Lines Written', value: dashboard.totalLinesAdded.toLocaleString(), color: '#8B5CF6', bg: '#F5F3FF',
                            icon: <Box component="span" sx={{ fontSize: 16 }}>💻</Box>
                        },
                        {
                            label: 'Task Completion', value: `${Math.round(dashboard.overallCompletionRate)}%`, color: '#EF4444', bg: '#FEF2F2',
                            icon: <AssignmentTurnedInIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                        },
                    ].map((s) => (
                        <Paper key={s.label} elevation={0} sx={{
                            p: 2, borderRadius: 2.5,
                            border: '1px solid', borderColor: 'divider',
                            bgcolor: '#FFFFFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
                        }}>
                            <Box>
                                <Typography fontSize="0.75rem" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
                                    {s.label}
                                </Typography>
                                <Typography fontWeight={800} fontSize="1.5rem"
                                    sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1, color: '#1E293B' }}>
                                    {s.value}
                                </Typography>
                            </Box>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '12px',
                                bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {s.icon}
                            </Box>
                        </Paper>
                    ))
                }
            </Box>

            {/* ══════════ Anomaly Alerts (expandable gradient banner) ══════════ */}
            {
                anomalies.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                        <Box
                            onClick={() => setShowAlerts(!showAlerts)}
                            sx={{
                                px: 2.5, py: 1.5,
                                background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #D97706 100%)',
                                borderRadius: showAlerts ? '12px 12px 0 0' : '12px',
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { opacity: 0.95 },
                            }}
                        >
                            <WarningAmberIcon sx={{ fontSize: 18, color: '#fff' }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography fontSize="0.82rem" fontWeight={700} sx={{ color: '#fff' }}>
                                    ⚠ {anomalies.length} Issues Detected
                                </Typography>
                                <Typography fontSize="0.65rem" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {showAlerts ? 'Click to collapse' : 'Click to view details'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center',
                                }}>
                                    <NotificationsIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                                    <Box sx={{
                                        position: 'absolute', top: -4, right: -6,
                                        width: 16, height: 16, borderRadius: '50%',
                                        bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography fontSize="0.55rem" fontWeight={800} sx={{ color: '#DC2626' }}>
                                            {anomalies.length}
                                        </Typography>
                                    </Box>
                                </Box>
                                {showAlerts ? (
                                    <KeyboardArrowUpIcon sx={{ fontSize: 20, color: '#fff' }} />
                                ) : (
                                    <KeyboardArrowDownIcon sx={{ fontSize: 20, color: '#fff' }} />
                                )}
                            </Box>
                        </Box>
                        <Collapse in={showAlerts}>
                            <Paper elevation={0} sx={{
                                borderRadius: '0 0 12px 12px',
                                border: '1px solid rgba(239,68,68,0.15)',
                                borderTop: 'none',
                                overflow: 'hidden',
                            }}>
                                {anomalies.map((a: string, i: number) => {
                                    const isInactive = a.includes('INACTIVE');
                                    const isLow = a.includes('LOW_CONTRIBUTION');
                                    const dotColor = isInactive ? '#EF4444' : isLow ? '#F59E0B' : '#6366F1';
                                    const badgeLabel = isInactive ? 'INACTIVE' : isLow ? 'LOW' : 'ALERT';
                                    const badgeBg = isInactive ? 'rgba(239,68,68,0.1)' : isLow ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)';
                                    const badgeColor = isInactive ? '#DC2626' : isLow ? '#D97706' : '#6366F1';
                                    return (
                                        <Box key={i} sx={{
                                            px: 2.5, py: 1.5,
                                            display: 'flex', alignItems: 'center', gap: 1.5,
                                            borderBottom: i < anomalies.length - 1 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                            bgcolor: '#FFFFFF',
                                        }}>
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                bgcolor: dotColor, flexShrink: 0,
                                            }} />
                                            <Typography fontSize="0.78rem" color="text.primary" sx={{ flex: 1 }}>
                                                {a}
                                            </Typography>
                                            <Chip label={badgeLabel} size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.55rem', fontWeight: 800,
                                                    bgcolor: badgeBg, color: badgeColor,
                                                    borderRadius: 1,
                                                }} />
                                        </Box>
                                    );
                                })}
                            </Paper>
                        </Collapse>
                    </Box>
                )
            }

            {/* ══════════ Team Members (Card Grid) ══════════ */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: 2,
                    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <PeopleAltIcon sx={{ fontSize: 16, color: '#fff' }} />
                </Box>
                <Typography fontWeight={800} fontSize="0.95rem" sx={{ fontFamily: "'Inter', sans-serif" }}>
                    Team Members
                </Typography>
                <Chip label={members.length} size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }} />
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: members.length <= 3 ? `repeat(${members.length}, 1fr)` : 'repeat(4, 1fr)',
                },
                gap: 2, mb: 3,
            }}>
                {members.map((m: ContributionResponse, i: number) => (
                    <MemberCard key={m.userId} m={m} rank={i + 1} projectId={pid}
                        onOpenDetail={(member) => handleOpenDetail(member, i + 1)} />
                ))}
            </Box>

            {
                members.length === 0 && (
                    <Paper elevation={0} sx={{
                        p: 6, textAlign: 'center', borderRadius: 4,
                        border: '2px dashed', borderColor: 'divider',
                    }}>
                        <Typography fontSize="2.5rem" sx={{ mb: 1.5 }}>📊</Typography>
                        <Typography fontWeight={700}>No contribution data yet</Typography>
                        <Typography fontSize="0.85rem" color="text.secondary">
                            Connect GitHub & Jira, then click Recalculate.
                        </Typography>
                    </Paper>
                )
            }

            {/* ══════════ Detail Dialog ══════════ */}
            <MemberDetailDialog
                member={selectedMember}
                rank={selectedRank}
                projectId={pid}
                open={!!selectedMember}
                onClose={() => setSelectedMember(null)}
            />

            {/* ══════════ Formula Dialog V3 ══════════ */}
            <Dialog open={formulaOpen} onClose={() => setFormulaOpen(false)}
                maxWidth="sm" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4, overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                    }
                }}>
                {/* Dark Header */}
                <Box sx={{
                    px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E2A4A 100%)',
                }}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                    }}>
                        <CalculateIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800} fontSize="1.05rem"
                            sx={{ fontFamily: "'Inter', sans-serif", color: '#fff' }}>
                            Scoring Formula
                        </Typography>
                        <Typography fontSize="0.68rem" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            How contribution score is calculated
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setFormulaOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 3, bgcolor: '#FAFBFC' }}>
                    {/* Dark Formula Card */}
                    <Box sx={{
                        p: 2.5, borderRadius: 3, mb: 3,
                        background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        {/* Subtle glow */}
                        <Box sx={{
                            position: 'absolute', top: -20, right: -20,
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)',
                        }} />
                        <Typography fontSize="0.6rem" fontWeight={700} letterSpacing="0.12em"
                            sx={{ color: 'rgba(148,163,184,0.7)', mb: 1, textTransform: 'uppercase' }}>
                            Formula
                        </Typography>
                        <Typography fontSize="0.72rem" fontWeight={700}
                            sx={{
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                color: '#E2E8F0', lineHeight: 1.8,
                                whiteSpace: 'nowrap', overflow: 'hidden',
                            }}>
                            <Box component="span" sx={{ color: '#93C5FD' }}>Score</Box>
                            {' = ('}
                            <Box component="span" sx={{ color: '#60A5FA' }}>GitHub</Box>
                            {' × 50% + '}
                            <Box component="span" sx={{ color: '#34D399' }}>Jira</Box>
                            {' × 50%) × '}
                            <Box component="span" sx={{ color: '#A78BFA' }}>Consistency</Box>
                            {' × (1 − '}
                            <Box component="span" sx={{ color: '#F87171' }}>Churn</Box>
                            {') + Bonus'}
                        </Typography>
                    </Box>

                    {/* Section label */}
                    <Typography fontSize="0.68rem" fontWeight={700} color="text.secondary"
                        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Score Components
                    </Typography>

                    {/* Component Cards with left border accent */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                        {[
                            { label: 'GitHub Impact', desc: 'Commits, Lines Added/Deleted, Bug Fixes', color: '#3B82F6', weight: '50%', icon: <GitHubIcon sx={{ fontSize: 20 }} /> },
                            { label: 'Jira Execution', desc: 'Task Completion Rate, Rework Count', color: '#10B981', weight: '50%', icon: <TaskAltIcon sx={{ fontSize: 20 }} /> },
                            { label: 'Consistency', desc: 'Active Days / Total Days (multiplier)', color: '#8B5CF6', weight: '×', icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} /> },
                            { label: 'Code Churn', desc: 'High churn = penalty on score', color: '#EF4444', weight: '−', icon: <WarningAmberIcon sx={{ fontSize: 20 }} /> },
                        ].map(f => (
                            <Box key={f.label} sx={{
                                p: 2, borderRadius: 2.5,
                                bgcolor: '#FFFFFF',
                                border: '1px solid', borderColor: 'rgba(226,232,240,0.8)',
                                borderLeft: `3px solid ${f.color}`,
                                transition: 'all 0.2s',
                                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transform: 'translateY(-1px)' },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
                                    <Box sx={{
                                        width: 38, height: 38, borderRadius: '50%',
                                        bgcolor: f.color + '10',
                                        color: f.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {f.icon}
                                    </Box>
                                    <Typography fontSize="0.9rem" fontWeight={700} sx={{ flex: 1, fontFamily: "'Inter', sans-serif" }}>
                                        {f.label}
                                    </Typography>
                                    <Chip label={f.weight} size="small"
                                        sx={{
                                            height: 24, fontWeight: 800, fontSize: '0.75rem',
                                            bgcolor: f.color + '12', color: f.color,
                                            borderRadius: 1.5,
                                        }} />
                                </Box>
                                <Typography fontSize="0.78rem" color="text.secondary" sx={{ pl: 6.25 }}>
                                    {f.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Got it button */}
                    <Button fullWidth onClick={() => setFormulaOpen(false)}
                        sx={{
                            mt: 3, py: 1.25,
                            textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                            borderRadius: 2.5, color: '#fff',
                            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                            '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.5)' },
                        }}>
                        Got it
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ContributionPage;
