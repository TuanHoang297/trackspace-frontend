import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import CommitIcon from '@mui/icons-material/Commit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { DOMAIN_META } from './constants';
import type { ContributionResponse } from '../../../types/contribution.types';

/* ───── Types ───── */
interface DomainStats {
    domain: string;
    count: number;
    avgScore: number;
    avgCommits: number;
    avgLines: number;
    avgTaskRate: number;
    avgActiveDays: number;
}

interface Props {
    members: ContributionResponse[];
}

/* ───── Helpers ───── */
function computeDomainStats(members: ContributionResponse[]): DomainStats[] {
    const groups: Record<string, ContributionResponse[]> = {};
    members.forEach(m => {
        const key = m.domain || 'UNKNOWN';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    const order = ['FRONTEND', 'BACKEND', 'BOTH', 'UNKNOWN'];
    return order
        .filter(key => groups[key]?.length > 0)
        .map(key => {
            const g = groups[key];
            const n = g.length;
            const totalScore = g.reduce((s, m) => s + m.contributionScore, 0);
            const totalAll = members.reduce((s, m) => s + m.contributionScore, 0);
            return {
                domain: key,
                count: n,
                avgScore: totalAll > 0 ? (totalScore / totalAll) * 100 : 0,
                avgCommits: g.reduce((s, m) => s + m.totalCommits, 0) / n,
                avgLines: g.reduce((s, m) => s + m.linesAdded, 0) / n,
                avgTaskRate: g.reduce((s, m) => s + m.taskCompletionRate, 0) / n,
                avgActiveDays: g.reduce((s, m) => s + m.activeDays, 0) / n,
            };
        })
        .filter(t => t.count > 0);
}

/* ───── Gauge Component ───── */
const ScoreGauge: React.FC<{ score: number; color: string; size?: number }> = ({ score, color, size = 100 }) => {
    const r = (size - 12) / 2;
    const cx = size / 2;
    const cy = size / 2 + 8;
    const circumference = Math.PI * r; // semicircle
    const offset = circumference - (Math.min(score, 100) / 100) * circumference;

    return (
        <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
            {/* Track */}
            <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke="#E2E8F0" strokeWidth={7} strokeLinecap="round"
            />
            {/* Fill */}
            <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            {/* Score text */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="800"
                fontFamily="'JetBrains Mono', monospace" fill="#1E293B">
                {Math.round(score)}
            </text>
            <text x={cx + 20} y={cy - 10} textAnchor="start" fontSize="13" fontWeight="600"
                fill="#94A3B8">%</text>
        </svg>
    );
};

/* ───── Metric Bar ───── */
const MetricBar: React.FC<{
    icon: React.ReactNode; label: string; value: string; percent: number; color: string;
}> = ({ icon, label, value, percent, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.6 }}>
        <Box sx={{ color: '#94A3B8', display: 'flex', flexShrink: 0 }}>{icon}</Box>
        <Typography fontSize="0.82rem" color="text.secondary" fontWeight={600}
            sx={{ width: 76, flexShrink: 0 }}>{label}</Typography>
        <Box sx={{ flex: 1, height: 6, bgcolor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(percent, 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                transition: 'width 0.8s ease',
            }} />
        </Box>
        <Typography fontSize="0.85rem" fontWeight={700} color="#1E293B"
            sx={{ fontFamily: "'JetBrains Mono', monospace", minWidth: 48, textAlign: 'right' }}>
            {value}
        </Typography>
    </Box>
);

/* ───── Domain Card ───── */
const DomainCard: React.FC<{
    stats: DomainStats; color: string; label: string;
    maxValues: { commits: number; lines: number; taskRate: number; activeDays: number };
}> = ({ stats, color, label, maxValues }) => {
    const gradientMap: Record<string, string> = {
        FRONTEND: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
        BACKEND: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        BOTH: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        UNKNOWN: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
    };

    return (
        <Box sx={{
            flex: 1, bgcolor: '#fff', borderRadius: 3,
            border: '1px solid', borderColor: 'divider',
            overflow: 'hidden', position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${color}15`,
            },
        }}>
            {/* Gradient top border */}
            <Box sx={{
                height: 3,
                background: gradientMap[stats.domain] || gradientMap.UNKNOWN,
            }} />

            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                    <Typography fontSize="0.95rem" fontWeight={800} color="#1E293B">{label}</Typography>
                    <Chip label={`${stats.count} members`} size="small" sx={{
                        height: 22, fontSize: '0.7rem', fontWeight: 700,
                        bgcolor: `${color}12`, color: color, ml: 'auto',
                    }} />
                </Box>

                {/* Score gauge */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                    <ScoreGauge score={stats.avgScore} color={color} size={110} />
                </Box>

                {/* Metrics */}
                <MetricBar icon={<CommitIcon sx={{ fontSize: 15 }} />} label="Commits" value={Math.round(stats.avgCommits).toString()}
                    percent={maxValues.commits > 0 ? (stats.avgCommits / maxValues.commits) * 100 : 0}
                    color={color} />
                <MetricBar icon={<AddIcon sx={{ fontSize: 15 }} />} label="Lines" value={stats.avgLines >= 1000 ? `${(stats.avgLines / 1000).toFixed(1)}K` : Math.round(stats.avgLines).toString()}
                    percent={maxValues.lines > 0 ? (stats.avgLines / maxValues.lines) * 100 : 0}
                    color={color} />
                <MetricBar icon={<CheckCircleOutlineIcon sx={{ fontSize: 15 }} />} label="Task Rate" value={`${Math.round(stats.avgTaskRate)}%`}
                    percent={stats.avgTaskRate}
                    color={color} />
                <MetricBar icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />} label="Active" value={`${Math.round(stats.avgActiveDays)}d`}
                    percent={maxValues.activeDays > 0 ? (stats.avgActiveDays / maxValues.activeDays) * 100 : 0}
                    color={color} />
            </Box>
        </Box>
    );
};

/* ───── Main Component ───── */
const DomainComparisonCards: React.FC<Props> = ({ members }) => {
    const stats = computeDomainStats(members);
    if (stats.length < 1) return null;

    const maxValues = {
        commits: Math.max(...stats.map(s => s.avgCommits), 1),
        lines: Math.max(...stats.map(s => s.avgLines), 1),
        taskRate: 100,
        activeDays: Math.max(...stats.map(s => s.avgActiveDays), 1),
    };


    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                <Box sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    bgcolor: '#3B82F6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <BarChartRoundedIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Typography fontSize="1rem" fontWeight={800} color="#1E293B">
                    Team Performance
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                {stats.map(s => {
                    const meta = DOMAIN_META[s.domain] || DOMAIN_META.UNKNOWN;
                    return (
                        <DomainCard
                            key={s.domain}
                            stats={s}
                            color={meta.color}
                            label={meta.label}
                            maxValues={maxValues}
                        />
                    );
                })}
            </Box>
        </Box>
    );
};

export default DomainComparisonCards;
