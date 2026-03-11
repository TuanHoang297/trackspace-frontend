import React, { useMemo, useState } from 'react';
import type { GitHubCommitResponse } from '../../../types/github.types';

interface Props {
    commits: GitHubCommitResponse[];
    color?: string;
    periodFilter?: 'all' | 'last_month' | 'last_3_months';
    theme?: 'dark' | 'light';
}

/** GitHub-style bar chart — commits grouped by week */
const ActivityChart: React.FC<Props> = ({ commits, color = '#1F6FEB', periodFilter = 'all', theme = 'dark' }) => {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const isDark = theme === 'dark';

    const GRID = isDark ? '#444C56' : '#D0D7DE';
    const LABEL_COLOR = isDark ? '#484F58' : '#656D76';
    const CONTRIB_COLOR = isDark ? '#484F58' : '#8C959F';
    const TOOLTIP_BG = isDark ? '#E6EDF3' : '#1F2328';
    const TOOLTIP_TEXT = isDark ? '#0D1117' : '#fff';
    const HOVER_COLOR = isDark ? '#58A6FF' : '#0969DA';

    const filteredCommits = useMemo(() => {
        if (periodFilter === 'all') return commits;
        const now = Date.now();
        const cutoff = periodFilter === 'last_month' ? now - 30 * 86400000 : now - 90 * 86400000;
        return commits.filter(c => {
            if (!c.commitDate) return false;
            return new Date(c.commitDate).getTime() >= cutoff;
        });
    }, [commits, periodFilter]);

    const data = useMemo(() => {
        const now = Date.now();
        const weeks = periodFilter === 'last_month' ? 5 : periodFilter === 'last_3_months' ? 13 : 8;
        const WEEK = 7 * 86400000;
        const startTs = now - weeks * WEEK;
        return Array.from({ length: weeks }, (_, i) => {
            const wStart = new Date(startTs + i * WEEK);
            const wEnd = new Date(startTs + (i + 1) * WEEK);
            const count = filteredCommits.filter(c => {
                if (!c.commitDate) return false;
                const t = new Date(c.commitDate).getTime();
                return t >= wStart.getTime() && t < wEnd.getTime();
            }).length;
            const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return { count, label: `${wStart.getDate()} ${m[wStart.getMonth()]}` };
        });
    }, [filteredCommits, periodFilter]);

    const max = Math.max(...data.map(d => d.count), 1);
    const yMax = Math.max(max, 20);

    const W = 440, H = 120;
    const PAD_L = 24, PAD_R = 40, PAD_T = 8, PAD_B = 20;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const barW = innerW / data.length;
    const barGap = barW * 0.3;
    const barActualW = barW - barGap;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120, display: 'block' }}>
            {/* Horizontal grid lines at 0, 5, 10, 15, 20 */}
            {[0, 5, 10, 15, 20].map(tick => {
                const y = PAD_T + innerH - (tick / yMax) * innerH;
                return (
                    <g key={`h${tick}`}>
                        <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y}
                            stroke={GRID} strokeWidth={tick === 0 ? 1 : 0.8}
                            strokeDasharray={tick === 0 ? 'none' : '3,3'} />
                        <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize={8} fill={LABEL_COLOR}
                            fontFamily="'JetBrains Mono', monospace">{tick}</text>
                    </g>
                );
            })}

            {/* Vertical grid lines — skip first and last */}
            {Array.from({ length: data.length + 1 }, (_, i) => {
                if (i === 0 || i === data.length) return null;
                const x = PAD_L + i * barW;
                return (
                    <line key={`v${i}`} x1={x} x2={x} y1={PAD_T} y2={PAD_T + innerH}
                        stroke={GRID} strokeWidth={0.8} strokeDasharray="3,3" />
                );
            })}

            {/* Bars + X labels + hover */}
            {data.map((d, i) => {
                const x = PAD_L + i * barW + barGap / 2;
                const barH = d.count > 0 ? Math.max((d.count / yMax) * innerH, 2) : 0;
                const y = PAD_T + innerH - barH;
                const isHovered = hoverIdx === i;
                return (
                    <g key={i}
                        onMouseEnter={() => setHoverIdx(i)}
                        onMouseLeave={() => setHoverIdx(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        <rect x={PAD_L + i * barW} y={PAD_T} width={barW} height={innerH} fill="transparent" />
                        {d.count > 0 && (
                            <rect x={x} y={y} width={barActualW} height={barH}
                                fill={isHovered ? HOVER_COLOR : color} rx={1} />
                        )}
                        {isHovered && (
                            <g>
                                <rect x={x + barActualW / 2 - 16} y={Math.max(y - 20, 0)} width={32} height={16}
                                    rx={4} fill={TOOLTIP_BG} />
                                <text x={x + barActualW / 2} y={Math.max(y - 20, 0) + 11.5}
                                    textAnchor="middle" fontSize={9} fill={TOOLTIP_TEXT}
                                    fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                                    {d.count}
                                </text>
                            </g>
                        )}
                        <text x={x + barActualW / 2} y={H - 4} textAnchor="middle" fontSize={7} fill={LABEL_COLOR}
                            fontFamily="Inter, sans-serif" fontWeight={500}>{d.label}</text>
                    </g>
                );
            })}

            {/* "Contributions" label — rotated on right side */}
            <text
                x={W - 8} y={PAD_T + innerH / 2}
                textAnchor="middle" fontSize={8} fill={CONTRIB_COLOR}
                fontFamily="Inter, sans-serif" fontWeight={600}
                transform={`rotate(-90, ${W - 8}, ${PAD_T + innerH / 2})`}
            >
                Contributions
            </text>
        </svg>
    );
};

export default ActivityChart;
