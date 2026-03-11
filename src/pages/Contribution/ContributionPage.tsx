import React, { useState } from 'react';
import {
    Box, Typography, Paper, Avatar, Chip, Tooltip,
    Button, Slider, Collapse, Skeleton, Dialog, DialogContent, IconButton, Badge,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CommitIcon from '@mui/icons-material/Commit';
import AddIcon from '@mui/icons-material/Add';
import CalculateIcon from '@mui/icons-material/Calculate';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import NotificationsIcon from '@mui/icons-material/Notifications';
import RemoveIcon from '@mui/icons-material/Remove';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

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
    if (!data || data.entries.length === 0) return (
        <Box sx={{ py: 1.5, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontSize="0.6rem" color="text.secondary" fontStyle="italic">No activity yet</Typography>
        </Box>
    );

    const maxCommits = Math.max(...data.entries.map(e => e.commitCount), 1);
    const dateMap = new Map(data.entries.map(e => [e.date, e]));

    // Start from earliest commit date, go forward 90 days
    const sortedDates = data.entries.map(e => e.date).sort();
    const startDate = new Date(sortedDates[0]);
    const totalDays = compact ? 90 : 90;

    const days: { date: string; level: number; commits: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate); d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        const commits = entry?.commitCount || 0;
        days.push({ date: dateStr, level: commits === 0 ? 0 : Math.ceil((commits / maxCommits) * 4), commits });
    }
    const lvlColors = ['rgba(148,163,184,0.18)', '#9BE9A8', '#40C463', '#30A14E', '#216E39'];
    const cellH = 10;

    // Group days into weeks (columns)
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];
    days.forEach((d, idx) => {
        const dayOfWeek = new Date(d.date).getDay();
        if (idx === 0) {
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
        <Box sx={{ width: '100%' }}>
            {/* Month labels — use grid to match columns */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '1px', mb: 0.3 }}>
                {weeks.map((_w, wi) => {
                    const mp = monthPositions.find(p => p.col === wi);
                    return (
                        <Typography key={wi} fontSize="0.5rem" color="text.secondary" fontWeight={600}>
                            {mp ? mp.label : ''}
                        </Typography>
                    );
                })}
            </Box>
            {/* Heatmap grid — full width, columns = weeks */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '1px' }}>
                {weeks.map((week, wi) => (
                    <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {week.map((d, di) => (
                            d.level === -1 ? (
                                <Box key={di} sx={{ width: '100%', height: cellH }} />
                            ) : (
                                <Tooltip key={d.date} title={`${d.date}: ${d.commits} commits`} arrow placement="top">
                                    <Box sx={{
                                        width: '100%', height: cellH, borderRadius: '2px',
                                        bgcolor: lvlColors[d.level],
                                        transition: 'transform 0.1s',
                                        '&:hover': { transform: 'scale(1.3)', zIndex: 1, position: 'relative' },
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
}> = ({ m, rank, projectId }) => {
    const avatarColor = AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length];
    const domain = DOMAIN_META[m.domain] || DOMAIN_META.UNKNOWN;

    const podiumGradient = rank === 1 ? GRADIENTS.gold : rank === 2 ? GRADIENTS.silver : GRADIENTS.bronze;

    return (
        <Paper elevation={0}
            sx={{
                borderRadius: 4, overflow: 'hidden',
                border: (m.inactive || m.hasLowContribution) ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(226,232,240,0.4)',
                borderLeft: (m.inactive || m.hasLowContribution) ? '3px solid #EF4444' : undefined,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                '&:hover': {
                    borderColor: (m.inactive || m.hasLowContribution) ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.4)',
                    boxShadow: '0 12px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(99,102,241,0.1)',
                    transform: 'translateY(-4px)',
                },
            }}
        >
            {/* ── Dark Premium Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                px: 2.5, py: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5,
                position: 'relative', overflow: 'hidden',
                '&::before': {
                    content: '""', position: 'absolute',
                    top: -30, right: -30, width: 100, height: 100,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                },
                '&::after': {
                    content: '""', position: 'absolute',
                    bottom: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
                },
            }}>
                {/* Avatar with glow ring */}
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box sx={{ position: 'absolute', inset: -3, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor}, #8B5CF6)`, opacity: 0.6, filter: 'blur(2px)' }} />
                    <Avatar sx={{ width: 38, height: 38, position: 'relative', bgcolor: avatarColor + '25', color: '#fff', fontWeight: 800, fontSize: 13, border: `2.5px solid ${avatarColor}`, boxShadow: `0 0 12px ${avatarColor}40`, fontFamily: "'Inter', sans-serif" }}>
                        {getInitials(m.fullName)}
                    </Avatar>
                </Box>
                {/* Name + Domain */}
                <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                    <Typography fontWeight={700} fontSize="0.82rem" color="#F1F5F9"
                        sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {m.fullName}
                    </Typography>
                    <Chip label={domain.label} size="small"
                        sx={{ height: 17, fontSize: '0.5rem', fontWeight: 700, mt: 0.3, bgcolor: 'rgba(99,102,241,0.15)', color: '#93C5FD', borderRadius: 1, border: '1px solid rgba(99,102,241,0.2)' }} />
                </Box>
                {/* Rank badge — right side */}
                {rank <= 3 ? (
                    <Box sx={{
                        width: 28, height: 28, borderRadius: 2, flexShrink: 0, ml: 'auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: podiumGradient,
                        boxShadow: `0 2px 10px ${rank === 1 ? 'rgba(245,158,11,0.4)' : rank === 2 ? 'rgba(148,163,184,0.3)' : 'rgba(217,119,6,0.3)'}`,
                    }}>
                        <EmojiEventsIcon sx={{ fontSize: 15, color: '#fff' }} />
                    </Box>
                ) : (
                    <Box sx={{
                        width: 28, height: 28, borderRadius: 2, flexShrink: 0, ml: 'auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(148,163,184,0.1)', border: '1.5px solid rgba(148,163,184,0.2)',
                    }}>
                        <Typography fontWeight={800} fontSize="0.65rem" color="rgba(148,163,184,0.8)"
                            sx={{ fontFamily: "'JetBrains Mono', monospace" }}>#{rank}</Typography>
                    </Box>
                )}
            </Box>

            {/* ── Body ── */}
            <Box sx={{ p: 2 }}>
                {/* Section: Score */}
                <Typography fontSize="0.5rem" fontWeight={700} color="text.secondary" sx={{ mb: 0.8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <ScoreRing score={m.contributionScore} size={64} thickness={4} />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <MiniProgress label="GitHub Impact" value={m.githubImpactScore} color="#3B82F6" />
                        <MiniProgress label="Jira Execution" value={m.jiraExecutionScore} color="#10B981" />
                    </Box>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 1.5 }} />

                {/* GitHub Impact | Jira Execution — side by side */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                    {/* GitHub Impact */}
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <GitHubIcon sx={{ fontSize: 11, color: '#3B82F6' }} />
                            <Typography fontSize="0.5rem" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>GitHub</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {[
                                { icon: <CommitIcon sx={{ fontSize: 10 }} />, label: 'Commits', value: m.totalCommits, color: '#3B82F6', bg: '#EFF6FF', border: 'rgba(59,130,246,0.15)' },
                                { icon: <AddIcon sx={{ fontSize: 10 }} />, label: 'Added', value: `+${m.linesAdded.toLocaleString()}`, color: '#16A34A', bg: '#F0FDF4', border: 'rgba(22,163,74,0.15)' },
                                { icon: <RemoveIcon sx={{ fontSize: 10 }} />, label: 'Deleted', value: `-${m.linesDeleted.toLocaleString()}`, color: '#DC2626', bg: '#FEF2F2', border: 'rgba(220,38,38,0.15)' },
                            ].map(chip => (
                                <Box key={chip.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: chip.bg, borderRadius: 1.5, px: 0.8, py: 0.4, border: `1px solid ${chip.border}` }}>
                                    <Box sx={{ color: chip.color, display: 'flex', flexShrink: 0 }}>{chip.icon}</Box>
                                    <Typography fontSize="0.52rem" color={chip.color} fontWeight={600} noWrap>{chip.label}</Typography>
                                    <Typography fontSize="0.6rem" fontWeight={800} sx={{ ml: 'auto', color: chip.color, fontFamily: "'JetBrains Mono', monospace" }}>{chip.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Divider */}
                    <Box sx={{ width: '1px', bgcolor: 'divider', alignSelf: 'stretch', my: 0.5 }} />

                    {/* Jira Execution */}
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="#10B981"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53Zm-4.67 4.66c-.01 2.4 1.95 4.35 4.35 4.36h1.78v1.72c.01 2.39 1.95 4.34 4.34 4.34V7.5a.84.84 0 0 0-.84-.84H6.86ZM2.2 11.33c0 2.4 1.96 4.35 4.35 4.35h1.78v1.72c.01 2.4 1.96 4.35 4.35 4.35v-9.58a.84.84 0 0 0-.84-.84H2.2Z" /></svg>
                            <Typography fontSize="0.5rem" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Jira</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {[
                                { icon: <AssignmentTurnedInIcon sx={{ fontSize: 10 }} />, label: 'Tasks', value: `${m.tasksCompleted}/${m.tasksAssigned}`, color: '#8B5CF6', bg: '#F5F3FF', border: 'rgba(139,92,246,0.15)' },
                                { icon: <StarIcon sx={{ fontSize: 10 }} />, label: 'Rate', value: `${Math.round(m.taskCompletionRate)}%`, color: m.taskCompletionRate >= 70 ? '#10B981' : '#F59E0B', bg: m.taskCompletionRate >= 70 ? '#F0FDF4' : '#FFFBEB', border: m.taskCompletionRate >= 70 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' },
                                { icon: <AutoAwesomeIcon sx={{ fontSize: 10 }} />, label: 'Rework', value: m.reworkCount, color: m.reworkCount > 3 ? '#EF4444' : '#64748B', bg: m.reworkCount > 3 ? '#FEF2F2' : '#F8FAFC', border: m.reworkCount > 3 ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.1)' },
                            ].map(chip => (
                                <Box key={chip.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: chip.bg, borderRadius: 1.5, px: 0.8, py: 0.4, border: `1px solid ${chip.border}` }}>
                                    <Box sx={{ color: chip.color, display: 'flex', flexShrink: 0 }}>{chip.icon}</Box>
                                    <Typography fontSize="0.52rem" color={chip.color} fontWeight={600} noWrap>{chip.label}</Typography>
                                    <Typography fontSize="0.6rem" fontWeight={800} sx={{ ml: 'auto', color: chip.color, fontFamily: "'JetBrains Mono', monospace" }}>{chip.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Consistency & Quality */}
                <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 11, color: '#8B5CF6' }} />
                        <Typography fontSize="0.5rem" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quality</Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
                        {[
                            { label: 'Active', value: `${m.activeDays}d`, tip: 'Số ngày có hoạt động', color: '#1E293B', bg: '#F1F5F9', border: 'rgba(30,41,59,0.08)' },
                            { label: 'Consist', value: m.consistencyFactor.toFixed(2), tip: 'Độ đều đặn (0-1)', color: '#8B5CF6', bg: '#F5F3FF', border: 'rgba(139,92,246,0.12)' },
                            { label: 'Churn', value: m.codeChurnRate.toFixed(2), tip: 'Tỷ lệ code sửa lại', color: m.codeChurnRate > 1.5 ? '#EF4444' : '#64748B', bg: m.codeChurnRate > 1.5 ? '#FEF2F2' : '#F8FAFC', border: m.codeChurnRate > 1.5 ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.08)' },
                        ].map(s => (
                            <Tooltip key={s.label} title={s.tip} arrow placement="top">
                                <Box sx={{ textAlign: 'center', py: 0.5, bgcolor: s.bg, borderRadius: 1.5, border: `1px solid ${s.border}`, cursor: 'help' }}>
                                    <Typography fontSize="0.65rem" fontWeight={800} sx={{ fontFamily: "'JetBrains Mono', monospace", color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                                    <Typography fontSize="0.4rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</Typography>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 1 }} />

                {/* Section: Activity */}
                <Typography fontSize="0.5rem" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Activity</Typography>
                <MemberHeatmap userId={m.userId} projectId={projectId} compact />
            </Box>
        </Paper>
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

    const handleRecalculate = async () => {
        await recalculate(feWeight / 100);
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="rounded" height={100} sx={{ mb: 3, borderRadius: 3 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 3 }} />)}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
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

            {/* ══════════ Team Members Header + Notification Badge ══════════ */}
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

                {/* Notification bell — right side */}
                {anomalies.length > 0 && (
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton
                            onClick={() => setShowAlerts(true)}
                            sx={{
                                position: 'relative',
                                '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' },
                            }}
                        >
                            <Badge
                                badgeContent={anomalies.length}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                        color: '#fff', fontSize: '0.55rem', fontWeight: 800,
                                        minWidth: 18, height: 18,
                                        boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                                    },
                                }}
                            >
                                <NotificationsIcon sx={{ fontSize: 20, color: '#EF4444' }} />
                            </Badge>
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* ══════════ Issues Dialog ══════════ */}
            <Dialog
                open={showAlerts}
                onClose={() => setShowAlerts(false)}
                maxWidth="sm" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden',
                    },
                }}
            >
                {/* Dark premium header */}
                <Box sx={{
                    px: 3, py: 2,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    position: 'relative', overflow: 'hidden',
                    '&::before': {
                        content: '""', position: 'absolute',
                        top: -20, left: -20, width: 80, height: 80,
                        background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
                        borderRadius: '50%',
                    },
                }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        background: 'linear-gradient(135deg, #DC2626, #EA580C)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 12px rgba(220,38,38,0.3)',
                    }}>
                        <WarningAmberIcon sx={{ fontSize: 19, color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontSize="1rem" fontWeight={700} sx={{ color: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
                            {anomalies.length} Issues Detected
                        </Typography>
                        <Typography fontSize="0.7rem" sx={{ color: 'rgba(148,163,184,0.7)' }}>
                            Review team alerts and take action
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setShowAlerts(false)} sx={{ color: 'rgba(148,163,184,0.6)' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 0 }}>
                    {anomalies.map((a: string, i: number) => {
                        const isInactive = a.includes('INACTIVE');
                        const isLow = a.includes('LOW_CONTRIBUTION');
                        const accentColor = isInactive ? '#EF4444' : isLow ? '#F59E0B' : '#6366F1';
                        const badgeLabel = isInactive ? 'INACTIVE' : isLow ? 'LOW' : 'ALERT';
                        const badgeBg = isInactive ? 'rgba(239,68,68,0.06)' : isLow ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.06)';
                        return (
                            <Box key={i} sx={{
                                px: 3, py: 1.5,
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                borderBottom: i < anomalies.length - 1 ? '1px solid' : 'none',
                                borderColor: 'rgba(226,232,240,0.5)',
                                borderLeft: `3px solid ${accentColor}`,
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'rgba(241,245,249,0.6)' },
                            }}>
                                <Box sx={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    bgcolor: accentColor, flexShrink: 0,
                                    boxShadow: `0 0 6px ${accentColor}40`,
                                }} />
                                <Typography fontSize="0.8rem" color="text.primary" sx={{ flex: 1, fontFamily: "'Inter', sans-serif" }}>
                                    {a}
                                </Typography>
                                <Chip label={badgeLabel} size="small"
                                    sx={{
                                        height: 22, fontSize: '0.55rem', fontWeight: 800,
                                        bgcolor: badgeBg, color: accentColor,
                                        borderRadius: 1.5, border: `1px solid ${accentColor}20`,
                                        letterSpacing: '0.05em',
                                    }} />
                            </Box>
                        );
                    })}
                </DialogContent>
            </Dialog>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                },
                gap: 2.5, mb: 3,
            }}>
                {members.map((m: ContributionResponse, i: number) => (
                    <MemberCard key={m.userId} m={m} rank={i + 1} projectId={pid} />
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
