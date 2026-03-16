import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { DOMAIN_META } from './constants';
import type { ContributionResponse } from '../../../types/contribution.types';

interface TeamStats {
    domain: string;
    count: number;
    totalScore: number;
    avgCommits: number;
    avgLines: number;
    avgTaskRate: number;
}

interface TeamComparisonSectionProps {
    members: ContributionResponse[];
}

function computeTeamStats(members: ContributionResponse[]): TeamStats[] {
    const groups: Record<string, ContributionResponse[]> = {};
    members.forEach(m => {
        const key = m.domain || 'UNKNOWN';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    const order = ['FRONTEND', 'BACKEND', 'BOTH', 'UNKNOWN'];
    return order
        .filter(key => groups[key] && groups[key].length > 0)
        .map(key => {
            const g = groups[key];
            const n = g.length;
            return {
                domain: key,
                count: n,
                totalScore: g.reduce((s, m) => s + m.contributionScore, 0),
                avgCommits: g.reduce((s, m) => s + m.totalCommits, 0) / n,
                avgLines: g.reduce((s, m) => s + m.linesAdded, 0) / n,
                avgTaskRate: g.reduce((s, m) => s + m.taskCompletionRate, 0) / n,
            };
        })
        .filter(t => t.totalScore > 0 || t.avgCommits > 0 || t.avgLines > 0);
}

const TeamComparisonSection: React.FC<TeamComparisonSectionProps> = ({ members }) => {
    const stats = computeTeamStats(members);
    if (stats.length < 2) return null;

    const [hoveredBar, setHoveredBar] = useState<string | null>(null);

    const metrics = [
        { key: 'totalScore', label: 'Contribution', format: (v: number) => `${v.toFixed(1)}%` },
        { key: 'avgCommits', label: 'Commits', format: (v: number) => Math.round(v).toString() },
        { key: 'avgLines', label: 'Lines', format: (v: number) => Math.round(v).toLocaleString() },
        { key: 'avgTaskRate', label: 'Tasks %', format: (v: number) => `${Math.round(v)}%` },
    ];

    const teams = stats.slice(0, 3);
    const teamColors = teams.map(t => (DOMAIN_META[t.domain] || DOMAIN_META.UNKNOWN).color);
    const teamLabels = teams.map(t => (DOMAIN_META[t.domain] || DOMAIN_META.UNKNOWN).label);

    /* Responsive chart dimensions */
    const CHART_HEIGHT = 230;
    const PADDING = { top: 24, bottom: 44, left: 8, right: 8 };
    const drawHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const BAR_WIDTH = 32;
    const BAR_GAP = 4;
    const GROUP_GAP = 48;
    const totalBarsWidth = teams.length * BAR_WIDTH + (teams.length - 1) * BAR_GAP;
    const groupWidth = totalBarsWidth + GROUP_GAP;
    const chartWidth = PADDING.left + metrics.length * groupWidth + PADDING.right;

    return (
        <Box>
            <Typography fontSize="0.72rem" fontWeight={700} color="text.secondary"
                sx={{ mb: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Team Performance
            </Typography>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2.5, mb: 2, justifyContent: 'center' }}>
                {teams.map((team, i) => (
                    <Box key={team.domain} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: teamColors[i] }} />
                        <Typography fontSize="0.78rem" fontWeight={600} color="text.primary">
                            {teamLabels[i]}
                        </Typography>
                        <Typography fontSize="0.68rem" color="text.secondary">({team.count})</Typography>
                    </Box>
                ))}
            </Box>

            {/* SVG Chart - responsive width */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <svg width="100%" height={CHART_HEIGHT}
                    viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ maxWidth: chartWidth, overflow: 'visible' }}>

                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                        const y = PADDING.top + drawHeight * (1 - pct);
                        return (
                            <line key={pct}
                                x1={PADDING.left} x2={chartWidth - PADDING.right}
                                y1={y} y2={y}
                                stroke={pct === 0 ? '#CBD5E1' : '#F1F5F9'}
                                strokeWidth={pct === 0 ? 1 : 0.8} />
                        );
                    })}

                    {/* Bar groups */}
                    {metrics.map((metric, groupIdx) => {
                        const groupCenterX = PADDING.left + groupIdx * groupWidth + groupWidth / 2;
                        const vals = teams.map(t => (t as unknown as Record<string, number>)[metric.key] as number);
                        const maxVal = Math.max(...vals, 0.1);
                        const startX = groupCenterX - totalBarsWidth / 2;

                        return (
                            <g key={metric.key}>
                                {/* Category label */}
                                <text x={groupCenterX} y={CHART_HEIGHT - 10}
                                    textAnchor="middle" fill="#64748B"
                                    fontSize="11.5" fontWeight="600" fontFamily="Inter, sans-serif">
                                    {metric.label}
                                </text>

                                {/* Bars */}
                                {teams.map((_, barIdx) => {
                                    const val = vals[barIdx];
                                    const barH = Math.max((val / maxVal) * drawHeight, 3);
                                    const x = startX + barIdx * (BAR_WIDTH + BAR_GAP);
                                    const y = PADDING.top + drawHeight - barH;
                                    const barId = `${metric.key}-${barIdx}`;
                                    const isHovered = hoveredBar === barId;
                                    const anyHovered = hoveredBar !== null;

                                    return (
                                        <g key={barIdx}
                                            onMouseEnter={() => setHoveredBar(barId)}
                                            onMouseLeave={() => setHoveredBar(null)}
                                            style={{ cursor: 'pointer' }}>
                                            {/* Bar shadow */}
                                            {isHovered && (
                                                <rect x={x - 1} y={y - 1}
                                                    width={BAR_WIDTH + 2} height={barH + 2}
                                                    rx={6} ry={6}
                                                    fill={teamColors[barIdx]} opacity={0.15} />
                                            )}
                                            {/* Bar */}
                                            <rect x={x} y={y} width={BAR_WIDTH} height={barH}
                                                rx={5} ry={5}
                                                fill={teamColors[barIdx]}
                                                opacity={anyHovered && !isHovered ? 0.25 : 0.9}
                                                style={{ transition: 'opacity 0.2s ease' }}
                                            />
                                            {/* Value label */}
                                            <text x={x + BAR_WIDTH / 2} y={y - 7}
                                                textAnchor="middle" fill={teamColors[barIdx]}
                                                fontSize={isHovered ? '12' : '10'}
                                                fontWeight={isHovered ? '800' : '700'}
                                                fontFamily="'JetBrains Mono', monospace"
                                                opacity={anyHovered && !isHovered ? 0.25 : 1}
                                                style={{ transition: 'opacity 0.2s ease, font-size 0.15s ease' }}>
                                                {metric.format(val)}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </Box>
        </Box>
    );
};

export default TeamComparisonSection;
