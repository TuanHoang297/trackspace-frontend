import React, { useState } from 'react';
import {
    Box, Typography, Paper, Avatar, Chip, Tooltip,
    Button, Slider, IconButton, Collapse, Skeleton,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BugReportIcon from '@mui/icons-material/BugReport';
import CommitIcon from '@mui/icons-material/Commit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import useContribution, { useHeatmap } from '../../hooks/useContribution';
import type { HeatmapResponse } from '../../types/contribution.types';

/* ═══════════ Design Tokens ═══════════ */
const GRADIENTS = {
    gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
    silver: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
    bronze: 'linear-gradient(135deg, #CD7F32, #B8860B)',
    blue: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    green: 'linear-gradient(135deg, #10B981, #059669)',
    purple: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    amber: 'linear-gradient(135deg, #F59E0B, #D97706)',
    rose: 'linear-gradient(135deg, #F43F5E, #E11D48)',
    header: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
    card: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
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
                    <linearGradient id={`ring-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={thickness} />
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={`url(#ring-${score})`} strokeWidth={thickness}
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
            </svg>
            <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography fontWeight={800} fontSize={size * 0.26}
                    sx={{ fontFamily: "'Inter', sans-serif", color, lineHeight: 1 }}>
                    {Math.round(score)}
                </Typography>
                <Typography fontSize={size * 0.11} color="text.secondary" fontWeight={600}
                    sx={{ lineHeight: 1, mt: 0.2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    score
                </Typography>
            </Box>
        </Box>
    );
};

/* ═══════════ Heatmap Calendar ═══════════ */
const HeatmapCalendar: React.FC<{ data: HeatmapResponse | null; loading: boolean }> = ({ data, loading }) => {
    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <CalendarMonthIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
            <Typography fontSize="0.7rem" color="text.secondary" fontWeight={500}>Loading activity...</Typography>
        </Box>
    );
    if (!data || data.entries.length === 0) return null;

    const maxCommits = Math.max(...data.entries.map(e => e.commitCount), 1);
    const dateMap = new Map(data.entries.map(e => [e.date, e]));
    const days: { date: string; level: number; commits: number }[] = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        const commits = entry?.commitCount || 0;
        days.push({ date: dateStr, level: commits === 0 ? 0 : Math.ceil((commits / maxCommits) * 4), commits });
    }
    const lvlColors = ['rgba(148,163,184,0.06)', '#9BE9A8', '#40C463', '#30A14E', '#216E39'];

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarMonthIcon sx={{ fontSize: 14, color: '#64748B' }} />
                <Typography fontSize="0.75rem" fontWeight={600} color="text.secondary">
                    Activity — {data.totalActiveDays} active days
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {days.map(d => (
                    <Box key={d.date} title={`${d.date}: ${d.commits} commits`} sx={{
                        width: 11, height: 11, borderRadius: '2.5px', bgcolor: lvlColors[d.level],
                        transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.6)' },
                    }} />
                ))}
            </Box>
        </Box>
    );
};

/* ═══════════ Member Heatmap (uses React Query per-user) ═══════════ */
const MemberHeatmap: React.FC<{ userId: number; projectId: number; expanded: boolean }> = ({ userId, projectId, expanded }) => {
    const { data, isLoading } = useHeatmap(userId, projectId, expanded);
    return <HeatmapCalendar data={data ?? null} loading={isLoading} />;
};

/* ═══════════ Main Page ═══════════ */
const ContributionPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const { dashboard, loading, recalculating, recalculate, expandedUsers, toggleUser } = useContribution(pid);
    const [feWeight, setFeWeight] = useState(50);
    const [showConfig, setShowConfig] = useState(false);

    const handleRecalculate = async () => {
        await recalculate(feWeight / 100);
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rounded" height={100} sx={{ mb: 3, borderRadius: 3 }} />
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={100} sx={{ flex: 1, borderRadius: 3 }} />)}
                </Box>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={90} sx={{ mb: 1.5, borderRadius: 3 }} />)}
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
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

            {/* ══════════ Hero Header ══════════ */}
            <Paper elevation={0} sx={{
                p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
                background: GRADIENTS.header, color: '#fff',
            }}>
                {/* Background decoration */}
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
                            <StarIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
                            <Typography variant="h5" fontWeight={800}
                                sx={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                                Contribution Analytics
                            </Typography>
                        </Box>
                        <Typography fontSize="0.82rem" sx={{ opacity: 0.7 }}>
                            Impact & Consistency Score — 4-pillar evaluation model
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={() => setShowConfig(!showConfig)}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600,
                                fontSize: '0.78rem', borderRadius: 2.5, px: 2,
                                border: '1px solid rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.4)' },
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
                    <Typography fontWeight={700} fontSize="0.85rem" sx={{ mb: 1.5 }}>
                        Domain Weighting
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={`FE ${feWeight}%`} size="small"
                            sx={{ fontWeight: 700, bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', minWidth: 65 }} />
                        <Slider value={feWeight} onChange={(_, v) => setFeWeight(v as number)}
                            min={0} max={100} step={5}
                            sx={{
                                flex: 1, color: '#3B82F6',
                                '& .MuiSlider-track': { background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' },
                                '& .MuiSlider-thumb': { boxShadow: '0 0 8px rgba(59,130,246,0.4)' },
                            }}
                        />
                        <Chip label={`BE ${100 - feWeight}%`} size="small"
                            sx={{ fontWeight: 700, bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981', minWidth: 65 }} />
                    </Box>
                </Paper>
            </Collapse>

            {/* ══════════ Stats Grid ══════════ */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                {[
                    { label: 'Team Members', value: dashboard.totalMembers, gradient: GRADIENTS.blue, icon: '👥' },
                    { label: 'Total Commits', value: dashboard.totalCommits.toLocaleString(), gradient: GRADIENTS.green, icon: '📝' },
                    { label: 'Lines Written', value: dashboard.totalLinesAdded.toLocaleString(), gradient: GRADIENTS.purple, icon: '💻' },
                    { label: 'Task Completion', value: `${Math.round(dashboard.overallCompletionRate)}%`, gradient: GRADIENTS.amber, icon: '🎯' },
                ].map((s) => (
                    <Paper key={s.label} elevation={0} sx={{
                        p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden',
                        border: '1px solid', borderColor: 'divider',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' },
                    }}>
                        {/* Gradient accent line */}
                        <Box sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                            background: s.gradient, borderRadius: '3px 3px 0 0',
                        }} />
                        <Typography fontSize="1.4rem" sx={{ mb: 1 }}>{s.icon}</Typography>
                        <Typography fontWeight={800} fontSize="1.5rem"
                            sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1, color: '#1E293B' }}>
                            {s.value}
                        </Typography>
                        <Typography fontSize="0.72rem" color="text.secondary" fontWeight={500} sx={{ mt: 0.75 }}>
                            {s.label}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {/* ══════════ Anomaly Alerts ══════════ */}
            {anomalies.length > 0 && (
                <Paper elevation={0} sx={{
                    p: 2, mb: 3, borderRadius: 3,
                    border: '1px solid rgba(239,68,68,0.15)',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.03), rgba(245,158,11,0.03))',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <WarningAmberIcon sx={{ fontSize: 14, color: '#fff' }} />
                        </Box>
                        <Typography fontWeight={700} fontSize="0.85rem">
                            Issues Detected <Chip label={anomalies.length} size="small"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', ml: 0.5 }} />
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {anomalies.map((a, i) => (
                            <Typography key={i} fontSize="0.78rem" color="text.secondary"
                                sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: 'rgba(239,68,68,0.25)' }}>
                                {a}
                            </Typography>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* ══════════ Leaderboard ══════════ */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: 2,
                    background: GRADIENTS.gold,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <EmojiEventsIcon sx={{ fontSize: 16, color: '#fff' }} />
                </Box>
                <Typography fontWeight={800} fontSize="0.95rem" sx={{ fontFamily: "'Inter', sans-serif" }}>
                    Leaderboard
                </Typography>
                <Typography fontSize="0.75rem" color="text.secondary" fontWeight={500}>
                    — Impact & Consistency Score
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {members.map((m, i) => {
                    const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const domain = DOMAIN_META[m.domain] || DOMAIN_META.UNKNOWN;
                    const isExpanded = expandedUsers.has(m.userId);
                    const handleUserClick = () => toggleUser(m.userId);
                    const isTop3 = i < 3;
                    const podiumGradient = i === 0 ? GRADIENTS.gold : i === 1 ? GRADIENTS.silver : GRADIENTS.bronze;

                    return (
                        <Paper key={m.userId} elevation={0}
                            onClick={handleUserClick}
                            sx={{
                                borderRadius: 3, cursor: 'pointer', overflow: 'hidden',
                                border: '1px solid', borderColor: isExpanded ? 'rgba(59,130,246,0.4)' : 'divider',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                '&:hover': {
                                    borderColor: 'rgba(59,130,246,0.3)',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                                    transform: 'translateY(-2px)',
                                },
                            }}
                        >
                            {/* Top 3 gradient accent */}
                            {isTop3 && (
                                <Box sx={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: podiumGradient,
                                }} />
                            )}

                            <Box sx={{ p: { xs: 2, md: 2.5 }, pt: isTop3 ? { xs: 2.5, md: 3 } : undefined }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2.5 } }}>

                                    {/* ── Rank Badge ── */}
                                    <Box sx={{
                                        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        ...(isTop3 ? {
                                            background: podiumGradient,
                                            boxShadow: `0 3px 10px ${i === 0 ? 'rgba(255,215,0,0.3)' : i === 1 ? 'rgba(192,192,192,0.3)' : 'rgba(205,127,50,0.3)'}`,
                                        } : {
                                            background: 'linear-gradient(135deg, rgba(100,116,139,0.08), rgba(148,163,184,0.04))',
                                            border: '1.5px solid',
                                            borderColor: 'divider',
                                        }),
                                    }}>
                                        {isTop3 ? (
                                            <EmojiEventsIcon sx={{ fontSize: 18, color: '#fff' }} />
                                        ) : (
                                            <Typography fontWeight={800} fontSize="0.78rem"
                                                sx={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    background: 'linear-gradient(135deg, #475569, #94A3B8)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}>
                                                #{i + 1}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* ── Avatar ── */}
                                    <Avatar sx={{
                                        width: 44, height: 44,
                                        background: `linear-gradient(135deg, ${avatarColor}20, ${avatarColor}10)`,
                                        color: avatarColor,
                                        fontWeight: 700, fontSize: 15,
                                        fontFamily: "'Inter', sans-serif",
                                        border: `2px solid ${avatarColor}30`,
                                    }}>
                                        {getInitials(m.fullName)}
                                    </Avatar>

                                    {/* ── Info ── */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                            <Typography fontWeight={700} fontSize="0.92rem" noWrap
                                                sx={{ fontFamily: "'Inter', sans-serif" }}>
                                                {m.fullName}
                                            </Typography>
                                            <Chip label={domain.label} size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                                                    bgcolor: domain.bg, color: domain.color,
                                                    borderRadius: 1.5,
                                                }} />
                                            {m.smartCoderBonus > 1.1 && (
                                                <Tooltip title={`Smart Coder ×${m.smartCoderBonus.toFixed(2)}`} arrow>
                                                    <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important', color: '#F59E0B !important' }} />}
                                                        label="Smart" size="small"
                                                        sx={{ height: 20, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderRadius: 1.5 }} />
                                                </Tooltip>
                                            )}
                                            {m.inactive && (
                                                <Chip label="Inactive" size="small"
                                                    sx={{ height: 20, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.08)', color: '#EF4444', borderRadius: 1.5 }} />
                                            )}
                                        </Box>

                                        {/* Dual progress bars */}
                                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                                    <Typography fontSize="0.65rem" color="text.secondary" fontWeight={600}>GitHub Impact</Typography>
                                                    <Typography fontSize="0.65rem" fontWeight={800}
                                                        sx={{ color: '#3B82F6', fontFamily: "'Inter', sans-serif" }}>
                                                        {Math.round(m.githubImpactScore)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(59,130,246,0.08)', overflow: 'hidden' }}>
                                                    <Box sx={{
                                                        height: '100%', borderRadius: 3,
                                                        width: `${Math.min(m.githubImpactScore, 100)}%`,
                                                        background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
                                                        transition: 'width 0.8s ease',
                                                    }} />
                                                </Box>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                                    <Typography fontSize="0.65rem" color="text.secondary" fontWeight={600}>Jira Execution</Typography>
                                                    <Typography fontSize="0.65rem" fontWeight={800}
                                                        sx={{ color: '#10B981', fontFamily: "'Inter', sans-serif" }}>
                                                        {Math.round(m.jiraExecutionScore)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(16,185,129,0.08)', overflow: 'hidden' }}>
                                                    <Box sx={{
                                                        height: '100%', borderRadius: 3,
                                                        width: `${Math.min(m.jiraExecutionScore, 100)}%`,
                                                        background: 'linear-gradient(90deg, #10B981, #059669)',
                                                        transition: 'width 0.8s ease',
                                                    }} />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* ── Score Ring ── */}
                                    <ScoreRing score={m.contributionScore} size={isTop3 ? 72 : 64} />

                                    {/* ── Metrics ── */}
                                    <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 0.75, alignItems: 'flex-end', flexShrink: 0, minWidth: 110 }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Commits" arrow>
                                                <Chip icon={<CommitIcon sx={{ fontSize: '13px !important' }} />}
                                                    label={m.totalCommits} size="small"
                                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6', '& .MuiChip-icon': { color: '#3B82F6' } }} />
                                            </Tooltip>
                                            <Tooltip title="Tasks Done" arrow>
                                                <Chip icon={<AssignmentTurnedInIcon sx={{ fontSize: '12px !important' }} />}
                                                    label={`${m.tasksCompleted}/${m.tasksAssigned}`} size="small"
                                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.08)', color: '#10B981', '& .MuiChip-icon': { color: '#10B981' } }} />
                                            </Tooltip>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                            <Tooltip title="Lines added" arrow>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                    <AddIcon sx={{ fontSize: 11, color: '#3FB950' }} />
                                                    <Typography fontSize="0.68rem" fontWeight={700}
                                                        sx={{ color: '#3FB950', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        {m.linesAdded.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                            <Tooltip title="Lines deleted" arrow>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                    <RemoveIcon sx={{ fontSize: 11, color: '#F85149' }} />
                                                    <Typography fontSize="0.68rem" fontWeight={700}
                                                        sx={{ color: '#F85149', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        {m.linesDeleted.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                            {m.bugFixCommits > 0 && (
                                                <Tooltip title="Bug fixes" arrow>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                        <BugReportIcon sx={{ fontSize: 11, color: '#F59E0B' }} />
                                                        <Typography fontSize="0.68rem" fontWeight={700}
                                                            sx={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace" }}>
                                                            {m.bugFixCommits}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>

                                    <IconButton size="small" sx={{
                                        bgcolor: isExpanded ? 'rgba(59,130,246,0.08)' : 'transparent',
                                        transition: 'all 0.2s',
                                    }}>
                                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* ── Expanded Detail ── */}
                            <Collapse in={isExpanded} unmountOnExit timeout={200}>
                                <Box sx={{
                                    px: 2.5, pb: 2.5, pt: 1.5,
                                    borderTop: '1px solid', borderColor: 'divider',
                                    background: 'linear-gradient(135deg, rgba(248,250,252,0.5), rgba(241,245,249,0.3))',
                                }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: 1.5, mb: 2 }}>
                                        {[
                                            { label: 'Active Days', value: m.activeDays, color: '#3B82F6' },
                                            { label: 'Consistency', value: `×${m.consistencyFactor.toFixed(2)}`, color: '#8B5CF6' },
                                            { label: 'Task Rate', value: `${Math.round(m.taskCompletionRate)}%`, color: '#10B981' },
                                            { label: 'Churn Rate', value: m.codeChurnRate.toFixed(2), color: m.codeChurnRate > 1.5 ? '#EF4444' : '#64748B' },
                                            { label: 'Rework', value: m.reworkCount, color: m.reworkCount > 0 ? '#F59E0B' : '#64748B' },
                                            { label: 'Smart Bonus', value: `×${m.smartCoderBonus.toFixed(2)}`, color: m.smartCoderBonus > 1.1 ? '#F59E0B' : '#64748B' },
                                        ].map(s => (
                                            <Paper key={s.label} elevation={0} sx={{
                                                p: 1.5, borderRadius: 2.5, textAlign: 'center',
                                                border: '1px solid', borderColor: 'divider',
                                                bgcolor: '#fff',
                                            }}>
                                                <Typography fontWeight={800} fontSize="0.95rem"
                                                    sx={{ color: s.color, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
                                                    {s.value}
                                                </Typography>
                                                <Typography fontSize="0.58rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
                                                    {s.label}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                    <MemberHeatmap userId={m.userId} projectId={pid} expanded={isExpanded} />
                                </Box>
                            </Collapse>
                        </Paper>
                    );
                })}
            </Box>

            {members.length === 0 && (
                <Paper elevation={0} sx={{
                    p: 6, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                    background: 'linear-gradient(135deg, rgba(248,250,252,0.5), rgba(241,245,249,0.3))',
                }}>
                    <Typography fontSize="2.5rem" sx={{ mb: 1.5 }}>📊</Typography>
                    <Typography fontWeight={700} fontSize="1rem" sx={{ mb: 0.5 }}>No contribution data yet</Typography>
                    <Typography fontSize="0.85rem" color="text.secondary">
                        Connect GitHub & Jira, then click Recalculate to analyze contributions.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default ContributionPage;
