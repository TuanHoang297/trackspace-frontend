import React from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useHeatmap } from '../../../hooks/useContribution';

interface DayData { label: string; fullDate: string; commits: number }

interface SparklineProps {
    data: DayData[];
    loading: boolean;
    color?: string;
    totalCommits?: number;
    activeDays?: number;
    showXAxis?: boolean;
    height?: number;
}

const ActivitySparkline: React.FC<SparklineProps> = ({
    data, loading, color = '#3B82F6', totalCommits, activeDays, showXAxis = false, height = 48,
}) => {
    if (loading) return (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontSize="0.6rem" color="text.secondary">Loading...</Typography>
        </Box>
    );
    if (!data || data.length === 0) return (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontSize="0.6rem" color="text.secondary" fontStyle="italic">No activity</Typography>
        </Box>
    );

    const total = totalCommits ?? data.reduce((s, d) => s + d.commits, 0);
    const active = activeDays ?? data.filter(d => d.commits > 0).length;
    const gradientId = `spark-${color.replace('#', '')}-${Math.random().toString(36).substring(7)}`;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mb: 0.3 }}>
                <Typography fontSize="0.95rem" fontWeight={800} color={color}
                    sx={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                    {total}
                </Typography>
                <Typography fontSize="0.55rem" color="text.secondary" fontWeight={600}>
                    commits
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: active > 0 ? '#22C55E' : '#CBD5E1' }} />
                    <Typography fontSize="0.5rem" color="text.secondary" fontWeight={600}>
                        {active} active days
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: height }}>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 4, right: 2, bottom: showXAxis ? 0 : 0, left: 2 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                        </linearGradient>
                    </defs>
                    {showXAxis && (
                        <XAxis
                            dataKey="label" axisLine={false} tickLine={false}
                            tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 500 }}
                            interval={Math.floor(data.length / 6)}
                        />
                    )}
                    <Area
                        type="monotone" dataKey="commits" stroke={color} strokeWidth={1.5}
                        fill={`url(#${gradientId})`}
                        dot={false} animationDuration={500}
                        baseValue={0}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 6, border: '1px solid #E2E8F0', padding: '4px 10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '0.65rem',
                        }}
                        formatter={(val: number) => [`${val} commits`, '']}
                        labelFormatter={(_: string, payload: any[]) => {
                            if (payload?.[0]?.payload?.fullDate) return payload[0].payload.fullDate;
                            return _;
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            </Box>
        </Box>
    );
};

/* Build daily data array from heatmap entries */
function buildDailyData(entries: { date: string; commitCount: number }[], numDays: number): DayData[] {
    const dateMap = new Map(entries.map(e => [e.date, e.commitCount]));
    const today = new Date();
    const days: DayData[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        days.push({
            label,
            fullDate: dateStr,
            commits: dateMap.get(dateStr) || 0,
        });
    }
    return days;
}

/* Compact sparkline for member cards (60 days, no X axis) */
export const MemberSparkline: React.FC<{ userId: number; projectId: number; color?: string }> = ({ userId, projectId, color }) => {
    const { data, isLoading } = useHeatmap(userId, projectId, true);

    const dailyData = React.useMemo(
        () => data?.entries?.length ? buildDailyData(data.entries, 60) : [],
        [data],
    );

    return (
        <ActivitySparkline
            data={dailyData} loading={isLoading} color={color}
            totalCommits={data?.totalCommits} activeDays={data?.totalActiveDays}
        />
    );
};

/* Larger sparkline for detail drawer (90 days, with X axis labels) */
export const DetailSparkline: React.FC<{ userId: number; projectId: number; color?: string }> = ({ userId, projectId, color }) => {
    const { data, isLoading } = useHeatmap(userId, projectId, true);

    const dailyData = React.useMemo(
        () => data?.entries?.length ? buildDailyData(data.entries, 90) : [],
        [data],
    );

    return (
        <ActivitySparkline
            data={dailyData} loading={isLoading} color={color}
            totalCommits={data?.totalCommits} activeDays={data?.totalActiveDays}
            showXAxis height={150}
        />
    );
};

export default ActivitySparkline;
