import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import type { HeatmapResponse } from '../../../types/contribution.types';
import { useHeatmap } from '../../../hooks/useContribution';

interface HeatmapCalendarProps {
    data: HeatmapResponse | null;
    loading: boolean;
    compact?: boolean;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data, loading, compact = false }) => {
    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
            <Typography fontSize="0.6rem" color="text.secondary">Loading...</Typography>
        </Box>
    );
    if (!data || data.entries.length === 0) return (
        <Box sx={{ py: 1.5, minHeight: compact ? 60 : 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontSize="0.65rem" color="text.secondary" fontStyle="italic">No activity yet</Typography>
        </Box>
    );

    const maxCommits = Math.max(...data.entries.map(e => e.commitCount), 1);
    const dateMap = new Map(data.entries.map(e => [e.date, e]));

    const sortedDates = data.entries.map(e => e.date).sort();
    const startDate = new Date(sortedDates[0]);
    const totalDays = 90;

    const days: { date: string; level: number; commits: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate); d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        const commits = entry?.commitCount || 0;
        days.push({ date: dateStr, level: commits === 0 ? 0 : Math.ceil((commits / maxCommits) * 4), commits });
    }
    const lvlColors = ['rgba(148,163,184,0.18)', '#9BE9A8', '#40C463', '#30A14E', '#216E39'];
    const cellH = compact ? 12 : 18;

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
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '2px', mb: 0.3 }}>
                {weeks.map((_w, wi) => {
                    const mp = monthPositions.find(p => p.col === wi);
                    return (
                        <Typography key={wi} fontSize="0.5rem" color="text.secondary" fontWeight={600}>
                            {mp ? mp.label : ''}
                        </Typography>
                    );
                })}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '2px' }}>
                {weeks.map((week, wi) => (
                    <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.5, justifyContent: 'flex-end' }}>
                <Typography fontSize="0.5rem" color="text.secondary">0</Typography>
                {lvlColors.map((c, i) => (
                    <Box key={i} sx={{
                        width: 10, height: 10, borderRadius: '2px', bgcolor: c,
                        border: i === 0 ? '1px solid rgba(148,163,184,0.2)' : 'none',
                    }} />
                ))}
                <Typography fontSize="0.5rem" color="text.secondary">High</Typography>
            </Box>
        </Box>
    );
};

/* Wrapper that fetches heatmap data for a specific member */
export const MemberHeatmap: React.FC<{ userId: number; projectId: number; compact?: boolean }> = ({ userId, projectId, compact }) => {
    const { data, isLoading } = useHeatmap(userId, projectId, true);
    return <HeatmapCalendar data={data ?? null} loading={isLoading} compact={compact} />;
};

export default HeatmapCalendar;
