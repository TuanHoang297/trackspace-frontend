import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Button, Chip, CircularProgress,
    Avatar, Tooltip, Tabs, Tab, LinearProgress, Slider,
    Collapse, IconButton, Alert, Skeleton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import HubIcon from '@mui/icons-material/Hub';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CommitIcon from '@mui/icons-material/Commit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SpeedIcon from '@mui/icons-material/Speed';
import { toast } from 'react-toastify';
import analyticsService from '../../api/services/analyticsService';
import type {
    ContributionResponse,
    DashboardResponse,
    HeatmapResponse,
    MemberIssue,
} from '../../types/analytics.types';
import { useRole } from '../../hooks/useRole';

// ─── colour palette ───────────────────────────────────────────────────────────
const DOMAIN_CFG = {
    FRONTEND: { label: 'Frontend',        color: '#3B82F6', bg: '#EFF6FF', icon: <CodeIcon  sx={{ fontSize: 14 }} /> },
    BACKEND:  { label: 'Backend',         color: '#8B5CF6', bg: '#F5F3FF', icon: <StorageIcon sx={{ fontSize: 14 }} /> },
    BOTH:     { label: 'Full-stack',      color: '#10B981', bg: '#ECFDF5', icon: <HubIcon  sx={{ fontSize: 14 }} /> },
    UNKNOWN:  { label: 'Không xác định', color: '#94A3B8', bg: '#F8FAFC', icon: <HelpOutlineIcon sx={{ fontSize: 14 }} /> },
};

const ISSUE_CFG: Record<string, { label: string; color: string; bg: string }> = {
    INACTIVE:         { label: 'Không hoạt động', color: '#94A3B8', bg: '#F8FAFC' },
    LOW_CONTRIBUTION: { label: 'Đóng góp thấp',   color: '#F59E0B', bg: '#FFFBEB' },
    OVERDUE_TASKS:    { label: 'Trễ hạn',          color: '#EF4444', bg: '#FEF2F2' },
    HIGH_CHURN:       { label: 'Churn code cao',   color: '#F97316', bg: '#FFF7ED' },
    HIGH_REWORK:      { label: 'Nhiều lần sửa',    color: '#EC4899', bg: '#FDF2F8' },
};

const AVATAR_GRADIENTS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fda085,#f6d365)',
    'linear-gradient(135deg,#89f7fe,#66a6ff)',
];

// ─── small helpers ─────────────────────────────────────────────────────────────
const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const fmtNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const scoreColor = (s: number) => {
    if (s >= 70) return '#10B981';
    if (s >= 40) return '#F59E0B';
    return '#EF4444';
};

const timeAgo = (iso: string | null) => {
    if (!iso) return 'Chưa có';
    const ms = Date.now() - new Date(iso).getTime();
    const d = Math.floor(ms / 86400000);
    if (d === 0) return 'Hôm nay';
    if (d === 1) return 'Hôm qua';
    return `${d} ngày trước`;
};

// ─── Mini heatmap calendar (12-week grid) ────────────────────────────────────
const MiniHeatmap: React.FC<{ entries: HeatmapResponse['entries'] }> = ({ entries }) => {
    const byDate = useMemo(() => {
        const m: Record<string, number> = {};
        entries.forEach(e => { m[e.date] = e.commitCount; });
        return m;
    }, [entries]);

    const weeks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dow = today.getDay();
        const mondayOffset = dow === 0 ? 6 : dow - 1;
        const monday = new Date(today.getTime() - mondayOffset * 86400000);
        // 12 weeks back
        const start = new Date(monday.getTime() - 11 * 7 * 86400000);
        const grid: Array<Array<{ date: string; count: number; future: boolean }>> = [];
        for (let w = 0; w < 12; w++) {
            const week: Array<{ date: string; count: number; future: boolean }> = [];
            for (let d = 0; d < 7; d++) {
                const day = new Date(start.getTime() + (w * 7 + d) * 86400000);
                const key = day.toISOString().slice(0, 10);
                week.push({ date: key, count: byDate[key] ?? 0, future: day > today });
            }
            grid.push(week);
        }
        return grid;
    }, [byDate]);

    const maxCount = useMemo(() =>
        Math.max(...entries.map(e => e.commitCount), 1), [entries]);

    const cellColor = (count: number, future: boolean) => {
        if (future || count === 0) return '#F1F5F9';
        const intensity = Math.min(count / maxCount, 1);
        if (intensity < 0.25) return '#BFDBFE';
        if (intensity < 0.5)  return '#60A5FA';
        if (intensity < 0.75) return '#3B82F6';
        return '#1D4ED8';
    };

    return (
        <Box sx={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
            {weeks.map((week, wi) => (
                <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {week.map((cell) => (
                        <Tooltip
                            key={cell.date}
                            title={cell.future ? '' : `${cell.date}: ${cell.count} commit`}
                            arrow
                        >
                            <Box sx={{
                                width: 11, height: 11,
                                borderRadius: '2px',
                                bgcolor: cellColor(cell.count, cell.future),
                                cursor: cell.count > 0 ? 'pointer' : 'default',
                                transition: 'opacity 0.15s',
                                '&:hover': { opacity: 0.75 },
                            }} />
                        </Tooltip>
                    ))}
                </Box>
            ))}
        </Box>
    );
};

// ─── Score bar ─────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color }}>{value.toFixed(1)}</Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={value}
            sx={{
                height: 5, borderRadius: 4,
                bgcolor: '#F1F5F9',
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
            }}
        />
    </Box>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
    icon: React.ReactNode; label: string; value: string | number;
    sub?: string; color: string; bg: string;
}> = ({ icon, label, value, sub, color, bg }) => (
    <Box sx={{
        flex: 1, minWidth: 140,
        bgcolor: '#FFFFFF', borderRadius: 3,
        border: '1px solid #E2E8F0',
        p: 2,
        display: 'flex', flexDirection: 'column', gap: 0.5,
    }}>
        <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {icon}
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>
            {typeof value === 'number' ? fmtNum(value) : value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
        {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
    </Box>
);

// ─── Member card ─────────────────────────────────────────────────────────────
const MemberCard: React.FC<{
    member: ContributionResponse;
    rank: number;
    teamRank: number;
    sharePercent: number;
    heatmap: HeatmapResponse | null;
    expanded: boolean;
    onToggle: () => void;
}> = ({ member, rank, teamRank, sharePercent, heatmap, expanded, onToggle }) => {
    const dom = DOMAIN_CFG[member.domain] ?? DOMAIN_CFG.UNKNOWN;
    const gradient = AVATAR_GRADIENTS[(rank) % AVATAR_GRADIENTS.length];
    const sc = scoreColor(member.contributionScore);
    // Share badge
    const shareEmoji   = teamRank === 0 ? '🔥' : member.hasLowContribution ? '⚠️' : null;
    const shareLabel   = teamRank === 0 ? 'Top 1' : teamRank === 1 ? 'Top 2' : teamRank === 2 ? 'Top 3'
                       : member.hasLowContribution ? 'Cần nhắc nhở' : null;
    const shareBgColor = member.hasLowContribution ? '#FEF2F2' : teamRank < 3 ? `${sc}12` : '#F8FAFC';
    const shareTxtColor = member.hasLowContribution ? '#F59E0B' : sc;

    const flags = [
        member.inactive       && { label: 'Không hoạt động', color: '#94A3B8' },
        member.hasLowContribution && { label: 'Đóng góp thấp', color: '#F59E0B' },
        member.hasOverdueTasks   && { label: 'Trễ deadline',   color: '#EF4444' },
    ].filter(Boolean) as Array<{ label: string; color: string }>;

    return (
        <Box sx={{
            bgcolor: '#FFFFFF', borderRadius: 3,
            border: member.inactive ? '1px solid #E2E8F0' : '1px solid #E2E8F0',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
        }}>
            {/* ── Main row ── */}
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Avatar */}
                <Avatar sx={{
                    width: 44, height: 44, background: gradient,
                    fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
                }}>
                    {initials(member.fullName)}
                </Avatar>

                {/* Name + domain + flags */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography fontWeight={700} noWrap>{member.fullName}</Typography>
                        <Chip
                            label={dom.label}
                            size="small"
                            icon={dom.icon}
                            sx={{
                                bgcolor: dom.bg, color: dom.color,
                                fontWeight: 600, fontSize: '0.7rem',
                                height: 20, '& .MuiChip-icon': { color: dom.color },
                            }}
                        />
                        {flags.map(f => (
                            <Chip key={f.label} label={f.label} size="small"
                                sx={{ bgcolor: '#FEF2F2', color: f.color, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.3, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                            <CommitIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />
                            {member.totalCommits} commit
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            <AssignmentTurnedInIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />
                            {member.tasksCompleted}/{member.tasksAssigned} nhiệm vụ
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            <AccessTimeIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />
                            {timeAgo(member.lastActivityDate)}
                        </Typography>
                    </Box>
                </Box>

                {/* Score ring + total share badge */}
                <Tooltip title="Tổng đóng góp của thành viên trong toàn nhóm" arrow>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        {/* ring */}
                        <Box sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            border: `3px solid ${sc}`,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: `${sc}10`,
                        }}>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: sc, lineHeight: 1 }}>
                                {member.contributionScore.toFixed(0)}
                            </Typography>
                            <Typography sx={{ fontSize: '0.5rem', color: sc, fontWeight: 600, lineHeight: 1 }}>
                                /100
                            </Typography>
                        </Box>
                        {/* share badge */}
                        <Box sx={{
                            bgcolor: shareBgColor,
                            border: `1px solid ${shareTxtColor}40`,
                            borderRadius: 1.5, px: 0.75, py: 0.2,
                            display: 'flex', alignItems: 'center', gap: 0.3, minWidth: 52, justifyContent: 'center',
                        }}>
                            {shareEmoji && (
                                <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{shareEmoji}</Typography>
                            )}
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: shareTxtColor, lineHeight: 1 }}>
                                {sharePercent.toFixed(1)}%
                            </Typography>
                        </Box>
                        {shareLabel && (
                            <Typography sx={{ fontSize: '0.58rem', color: shareTxtColor, fontWeight: 700, lineHeight: 1, mt: -0.25 }}>
                                {shareLabel}
                            </Typography>
                        )}
                    </Box>
                </Tooltip>

                {/* Expand toggle */}
                <IconButton size="small" onClick={onToggle} sx={{ flexShrink: 0 }}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            {/* ── Score bars (always visible) ── */}
            <Box sx={{ px: 2.5, pb: 1.5, display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <ScoreBar label="Điểm GitHub" value={member.githubImpactScore} color="#3B82F6" />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <ScoreBar label="Điểm Jira" value={member.jiraExecutionScore} color="#8B5CF6" />
                </Box>
            </Box>

            {/* ── Expanded details ── */}
            <Collapse in={expanded}>
                <Box sx={{
                    borderTop: '1px solid #F1F5F9',
                    px: 2.5, py: 2,
                    display: 'flex', gap: 3, flexWrap: 'wrap',
                }}>
                    {/* GitHub details */}
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="caption" fontWeight={700} color="#3B82F6" sx={{ mb: 1, display: 'block' }}>
                            Chi tiết GitHub
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                            {[
                                ['Dòng thêm',       `+${fmtNum(member.linesAdded)}`],
                                ['Dòng xóa',        `-${fmtNum(member.linesDeleted)}`],
                                ['Commit sửa lỗi',  member.bugFixCommits],
                                ['Ngày hoạt động',  member.activeDays],
                                ['Hệ số đều đặn ×', member.consistencyFactor.toFixed(2)],
                                ['Tỷ lệ churn',     member.codeChurnRate.toFixed(2)],
                            ].map(([k, v]) => (
                                <Box key={String(k)}>
                                    <Typography variant="caption" color="text.disabled">{k}</Typography>
                                    <Typography variant="body2" fontWeight={600}>{v}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Jira details */}
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="caption" fontWeight={700} color="#8B5CF6" sx={{ mb: 1, display: 'block' }}>
                            Chi tiết Jira
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                            {[
                                ['Được giao',        member.tasksAssigned],
                                ['Hoàn thành',       member.tasksCompleted],
                                ['Đang làm',         member.tasksInProgress],
                                ['Tỷ lệ hoàn thành', `${member.taskCompletionRate.toFixed(1)}%`],
                                ['Lần sửa lại',      member.reworkCount],
                                ['Hệ số hiệu quả ×', member.smartCoderBonus.toFixed(2)],
                            ].map(([k, v]) => (
                                <Box key={String(k)}>
                                    <Typography variant="caption" color="text.disabled">{k}</Typography>
                                    <Typography variant="body2" fontWeight={600}>{v}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Heatmap */}
                    {heatmap && heatmap.entries.length > 0 && (
                        <Box sx={{ flex: 2, minWidth: 280 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Lịch sử hoạt động (12 tuần)
                            </Typography>
                            <MiniHeatmap entries={heatmap.entries} />
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

// ─── Issue panel ─────────────────────────────────────────────────────────────
const IssuePanel: React.FC<{ issues: MemberIssue[] }> = ({ issues }) => {
    if (issues.length === 0) {
        return (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
                Không phát hiện vấn đề nào — tất cả thành viên đang hoạt động bình thường.
            </Alert>
        );
    }
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {issues.map((issue, i) => {
                const cfg = ISSUE_CFG[issue.issueType] ?? ISSUE_CFG.INACTIVE;
                return (
                    <Box key={i} sx={{
                        p: 2, borderRadius: 2, bgcolor: cfg.bg,
                        border: `1px solid ${cfg.color}30`,
                        display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                        <WarningAmberIcon sx={{ color: cfg.color, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                                <Typography fontWeight={700} variant="body2">{issue.userName}</Typography>
                                <Chip label={cfg.label} size="small"
                                    sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, fontWeight: 600, fontSize: '0.65rem', height: 18 }} />
                            </Box>
                            <Typography variant="caption" color="text.secondary">{issue.description}</Typography>
                        </Box>
                        <Box sx={{
                            px: 1.5, py: 0.5, borderRadius: 2, bgcolor: `${scoreColor(issue.currentScore)}15`,
                        }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: scoreColor(issue.currentScore) }}>
                                {issue.currentScore.toFixed(1)}
                            </Typography>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};

// ModelOverviewPanel removed

// ─── Domain group section ─────────────────────────────────────────────────────
const DomainGroupSection: React.FC<{
    domain: 'FRONTEND' | 'BACKEND';
    members: ContributionResponse[];
    heatmaps: Record<number, HeatmapResponse>;
    expandedId: number | null;
    onExpand: (id: number) => void;
    shareMap: Record<number, number>;
    teamRankMap: Record<number, number>;
}> = ({ domain, members, heatmaps, expandedId, onExpand, shareMap, teamRankMap }) => {
    const cfg          = DOMAIN_CFG[domain];
    const avg          = members.length > 0 ? members.reduce((s, m) => s + m.contributionScore,  0) / members.length : 0;
    const avgGit       = members.length > 0 ? members.reduce((s, m) => s + m.githubImpactScore,  0) / members.length : 0;
    const avgJira      = members.length > 0 ? members.reduce((s, m) => s + m.jiraExecutionScore, 0) / members.length : 0;
    const groupShare   = members.reduce((s, m) => s + (shareMap[m.userId] ?? 0), 0);

    if (members.length === 0) return null;

    return (
        <Box sx={{ mb: 2.5 }}>
            {/* Group banner */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                bgcolor: cfg.bg, borderRadius: 2,
                border: `1.5px solid ${cfg.color}40`, mb: 1.5, flexWrap: 'wrap',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</Box>
                    <Typography fontWeight={800} variant="body2" sx={{ color: cfg.color }}>
                        Nhóm {cfg.label}
                    </Typography>
                    <Chip size="small" label={`${members.length} thành viên`}
                        sx={{ bgcolor: `${cfg.color}18`, color: cfg.color, fontWeight: 600, fontSize: '0.65rem', height: 18 }} />
                </Box>
                <Box sx={{ flex: 1 }} />
                {/* Group-level averages */}
                <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                        { k: 'Điểm TB',       v: avg.toFixed(1),              c: scoreColor(avg) },
                        { k: 'GitHub TB',     v: avgGit.toFixed(1),           c: '#3B82F6' },
                        { k: 'Jira TB',       v: avgJira.toFixed(1),          c: '#8B5CF6' },
                        { k: 'Tổng đóng góp', v: `${groupShare.toFixed(1)}%`, c: cfg.color },
                    ].map(stat => (
                        <Box key={stat.k} sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1.2 }}>{stat.k}</Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ color: stat.c }}>{stat.v}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Avg score bars for this domain */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, px: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                    <ScoreBar label={`Avg GitHub — ${cfg.label}`} value={avgGit}  color={cfg.color} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <ScoreBar label={`Avg Jira — ${cfg.label}`}   value={avgJira} color="#8B5CF6" />
                </Box>
            </Box>

            {/* Member cards — intra-domain ranked (🥇🥈🥉 per domain) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {members.map((m, i) => (
                    <MemberCard
                        key={m.userId}
                        member={m}
                        rank={i}
                        teamRank={teamRankMap[m.userId] ?? 99}
                        sharePercent={shareMap[m.userId] ?? 0}
                        heatmap={heatmaps[m.userId] ?? null}
                        expanded={expandedId === m.userId}
                        onToggle={() => onExpand(m.userId)}
                    />
                ))}
            </Box>
        </Box>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const AnalyticsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const { isReadOnly } = useRole();
    const readOnly = isReadOnly();

    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [issues, setIssues]       = useState<MemberIssue[]>([]);
    const [heatmaps, setHeatmaps]   = useState<Record<number, HeatmapResponse>>({});
    const [loading, setLoading]     = useState(true);
    const [recalculating, setRecalculating] = useState(false);

    // Domain weight controls (lecturer-only)
    const [feWeight, setFeWeight] = useState(50);  // stored as 0–100
    const [tab, setTab]           = useState(0);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, issueRes] = await Promise.all([
                analyticsService.getDashboard(pid),
                analyticsService.detectIssues(pid),
            ]);
            setDashboard(dashRes.data.data);
            setIssues(issueRes.data.data.issues);
        } catch {
            toast.error('Không thể tải dữ liệu analytics');
        } finally {
            setLoading(false);
        }
    }, [pid]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Recalculate ───────────────────────────────────────────────────────────
    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            await analyticsService.recalculate(pid, feWeight / 100, (100 - feWeight) / 100);
            toast.success('Đã tính lại điểm đóng góp thành công');
            await fetchData();
        } catch {
            toast.error('Recalculation thất bại');
        } finally {
            setRecalculating(false);
        }
    };

    // ── Lazy load heatmap when a card expands ─────────────────────────────────
    const handleExpand = useCallback(async (userId: number) => {
        setExpandedId(prev => prev === userId ? null : userId);
        if (!heatmaps[userId]) {
            try {
                const res = await analyticsService.getHeatmap(pid, userId);
                setHeatmaps(prev => ({ ...prev, [userId]: res.data.data }));
            } catch { /* silently skip heatmap */ }
        }
    }, [heatmaps, pid]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const members = useMemo(
        () => dashboard?.memberContributions ?? [],
        [dashboard],
    );

    // Domain-isolated groups (FE & BE ranked independently within each group)
    const feMembers    = useMemo(() => members.filter(m => m.domain === 'FRONTEND'), [members]);
    const beMembers    = useMemo(() => members.filter(m => m.domain === 'BACKEND'),  [members]);
    const hasDomainSplit = feMembers.length > 0 || beMembers.length > 0;
    const otherMembers = useMemo(
        () => members.filter(m => m.domain !== 'FRONTEND' && m.domain !== 'BACKEND'),
        [members],
    );

    // Share % of the total team's combined contributionScore (all sum to 100%)
    const totalScore = useMemo(() => members.reduce((s, m) => s + m.contributionScore, 0), [members]);
    const shareMap   = useMemo<Record<number, number>>(() => {
        const map: Record<number, number> = {};
        members.forEach(m => {
            map[m.userId] = totalScore > 0 ? (m.contributionScore / totalScore) * 100 : 0;
        });
        return map;
    }, [members, totalScore]);
    // members is sorted desc by contributionScore from backend
    const teamRankMap = useMemo<Record<number, number>>(() => {
        const map: Record<number, number> = {};
        members.forEach((m, i) => { map[m.userId] = i; });
        return map;
    }, [members]);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rounded" height={56} sx={{ mb: 2, borderRadius: 3 }} />
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={100} sx={{ flex: 1, borderRadius: 3 }} />)}
                </Box>
                {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={88} sx={{ mb: 1.5, borderRadius: 3 }} />)}
            </Box>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Phân tích đóng góp</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Điểm đóng góp tổng hợp GitHub + Jira
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Domain weight slider — only show when not read-only */}
                    {!readOnly && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            bgcolor: '#F8FAFC', border: '1px solid #E2E8F0',
                            borderRadius: 3, px: 2, py: 0.75,
                        }}>
                            <Tooltip title="Tỷ trọng điểm GitHub Frontend" arrow>
                                <CodeIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                            </Tooltip>
                            <Box sx={{ width: 120 }}>
                                <Slider
                                    size="small"
                                    value={feWeight}
                                    onChange={(_, v) => setFeWeight(v as number)}
                                    min={0} max={100} step={10}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={v => `FE ${v}% / BE ${100 - v}%`}
                                    sx={{ py: 0 }}
                                />
                            </Box>
                            <Tooltip title="Tỷ trọng điểm GitHub Backend" arrow>
                                <StorageIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />
                            </Tooltip>
                        </Box>
                    )}
                    <Button
                        variant="contained"
                        startIcon={recalculating ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                        onClick={handleRecalculate}
                        disabled={recalculating || readOnly}
                        size="small"
                    >
                        {recalculating ? 'Đang tính...' : 'Tính lại'}
                    </Button>
                </Box>
            </Box>

            {/* ── Stat cards ── */}
            {dashboard && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <StatCard
                        icon={<CommitIcon fontSize="small" />}
                        label="Tổng commits" value={dashboard.totalCommits}
                        color="#3B82F6" bg="#EFF6FF"
                    />
                    <StatCard
                        icon={<CodeIcon fontSize="small" />}
                        label="Dòng code thêm" value={dashboard.totalLinesAdded}
                        color="#10B981" bg="#ECFDF5"
                    />
                    <StatCard
                        icon={<AssignmentTurnedInIcon fontSize="small" />}
                        label="Nhiệm vụ hoàn thành"
                        value={`${dashboard.totalTasksCompleted}/${dashboard.totalTasksAssigned}`}
                        sub={`Tỷ lệ ${dashboard.overallCompletionRate.toFixed(1)}%`}
                        color="#8B5CF6" bg="#F5F3FF"
                    />
                    <StatCard
                        icon={<WarningAmberIcon fontSize="small" />}
                        label="Vấn đề phát hiện" value={issues.length}
                        sub={`${dashboard.totalMembers} thành viên`}
                        color={issues.length > 0 ? '#EF4444' : '#10B981'}
                        bg={issues.length > 0 ? '#FEF2F2' : '#ECFDF5'}
                    />
                </Box>
            )}

            {/* ── Tabs ── */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 2, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}
            >
                <Tab label={`Bảng điểm (${members.length})`} />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Vấn đề
                            {issues.length > 0 && (
                                <Box sx={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    bgcolor: '#EF4444', color: '#FFFFFF',
                                    fontSize: '0.65rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {issues.length}
                                </Box>
                            )}
                        </Box>
                    }
                />
                {dashboard && (
                    <Tab label="Trạng thái Jira" />
                )}
            </Tabs>

            {/* ── Tab 0: Scoreboard ── */}
            {tab === 0 && (
                <Box>
                    {members.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                            Chưa có dữ liệu. Nhấn "Tính lại" để bắt đầu phân tích.
                        </Alert>
                    ) : hasDomainSplit ? (
                        <>
                            {/* FE group */}
                            {feMembers.length > 0 && (
                                <DomainGroupSection
                                    domain="FRONTEND"
                                    members={feMembers}
                                    heatmaps={heatmaps}
                                    expandedId={expandedId}
                                    onExpand={handleExpand}
                                    shareMap={shareMap}
                                    teamRankMap={teamRankMap}
                                />
                            )}
                            {/* Divider between groups */}
                            {feMembers.length > 0 && beMembers.length > 0 && (
                                <Box sx={{ borderTop: '2px dashed #E2E8F0', my: 1 }} />
                            )}
                            {/* BE group */}
                            {beMembers.length > 0 && (
                                <DomainGroupSection
                                    domain="BACKEND"
                                    members={beMembers}
                                    heatmaps={heatmaps}
                                    expandedId={expandedId}
                                    onExpand={handleExpand}
                                    shareMap={shareMap}
                                    teamRankMap={teamRankMap}
                                />
                            )}
                            {/* Full-stack / Unknown */}
                            {otherMembers.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" fontWeight={700} color="text.disabled"
                                        sx={{ display: 'block', mb: 1, px: 0.5, letterSpacing: 0.5 }}>
                                        FULL-STACK / KHÁC
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {otherMembers.map((m, i) => (
                                            <MemberCard
                                                key={m.userId}
                                                member={m}
                                                rank={i}
                                                teamRank={teamRankMap[m.userId] ?? 99}
                                                sharePercent={shareMap[m.userId] ?? 0}
                                                heatmap={heatmaps[m.userId] ?? null}
                                                expanded={expandedId === m.userId}
                                                onToggle={() => handleExpand(m.userId)}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {members.map((m, i) => (
                                <MemberCard
                                    key={m.userId}
                                    member={m}
                                    rank={i}
                                    teamRank={teamRankMap[m.userId] ?? 99}
                                    sharePercent={shareMap[m.userId] ?? 0}
                                    heatmap={heatmaps[m.userId] ?? null}
                                    expanded={expandedId === m.userId}
                                    onToggle={() => handleExpand(m.userId)}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            {/* ── Tab 1: Issues ── */}
            {tab === 1 && <IssuePanel issues={issues} />}

            {/* ── Tab 2: Jira status distribution ── */}
            {tab === 2 && dashboard && (
                <Box sx={{ bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E2E8F0', p: 3 }}>
                    <Typography fontWeight={700} sx={{ mb: 2 }}>Phân bố trạng thái Jira</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {Object.entries(dashboard.issueStatusDistribution).map(([status, count]) => {
                            const total = Object.values(dashboard.issueStatusDistribution).reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            const color =
                                status === 'Done'        ? '#10B981' :
                                status === 'In Progress' ? '#3B82F6' :
                                status === 'To Do'       ? '#94A3B8' : '#F59E0B';
                            return (
                                <Box key={status}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>{status}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {count} ({pct.toFixed(1)}%)
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{
                                            height: 8, borderRadius: 4,
                                            bgcolor: '#F1F5F9',
                                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {/* ── Footer note ── */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SpeedIcon sx={{ fontSize: 13 }} />
                    FE chuẩn hóa trong nhóm Frontend · BE chuẩn hóa trong nhóm Backend · Điểm cuối = 50% GitHub + 50% Jira.
                    {' '}Nhấn "Mô hình đánh giá 4 trụ cột" ở trên để xem công thức chi tiết.
                </Typography>
            </Box>
        </Box>
    );
};

export default AnalyticsPage;
