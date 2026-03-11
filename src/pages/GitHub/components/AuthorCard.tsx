import React, { useMemo } from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import ActivityChart from './ActivityChart';
import type { GitHubCommitResponse, GitHubStatsResponse } from '../../../types/github.types';

interface Props {
    stat: GitHubStatsResponse;
    rank: number;
    commits: GitHubCommitResponse[];
    onAuthorClick: (githubLogin: string) => void;
    periodFilter?: 'all' | 'last_month' | 'last_3_months';
}

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

/** GitHub-style contributor card — light theme */
const AuthorCard: React.FC<Props> = ({ stat, rank, commits, onAuthorClick, periodFilter = 'all' }) => {
    const ac = AVATAR_COLORS[rank % AVATAR_COLORS.length];
    const name = stat.githubLogin || stat.userName;

    // Compute stats synced with period filter
    const filteredStats = useMemo(() => {
        if (periodFilter === 'all') {
            return { commits: stat.totalCommits, added: stat.totalLinesAdded || 0, deleted: stat.totalLinesDeleted || 0 };
        }
        const now = Date.now();
        const cutoff = periodFilter === 'last_month' ? now - 30 * 86400000 : now - 90 * 86400000;
        const filtered = commits.filter(c => c.commitDate && new Date(c.commitDate).getTime() >= cutoff);
        return {
            commits: filtered.length,
            added: filtered.reduce((s, c) => s + (c.linesAdded || 0), 0),
            deleted: filtered.reduce((s, c) => s + (c.linesDeleted || 0), 0),
        };
    }, [commits, periodFilter, stat]);

    return (
        <Box sx={{
            borderRadius: 2, overflow: 'hidden',
            bgcolor: '#fff',
            border: '1px solid #D0D7DE',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: '#0969DA' },
        }}>
            {/* Header */}
            <Box sx={{
                px: 2, py: 1.2,
                display: 'flex', alignItems: 'center', gap: 1,
                borderBottom: '1px solid #D8DEE4',
            }}>
                <Avatar sx={{
                    width: 28, height: 28,
                    bgcolor: ac + '18', color: ac,
                    fontWeight: 700, fontSize: 11,
                    border: `1.5px solid ${ac}40`,
                }}>
                    {getInitials(name)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        fontWeight={600} fontSize="0.82rem" color="#1F2328" noWrap
                        sx={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        {name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: -0.2 }}>
                        <Tooltip title="Click xem commits" arrow>
                            <Typography fontSize="0.62rem" color="#656D76" fontWeight={500}
                                onClick={() => onAuthorClick(stat.githubLogin)}
                                sx={{ cursor: 'pointer', '&:hover': { color: '#0969DA' } }}>
                                {filteredStats.commits} commits
                            </Typography>
                        </Tooltip>
                        <Typography fontSize="0.62rem" color="#1A7F37" fontWeight={600}
                            sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {filteredStats.added.toLocaleString()} ++
                        </Typography>
                        <Typography fontSize="0.62rem" color="#CF222E" fontWeight={600}
                            sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {filteredStats.deleted.toLocaleString()} --
                        </Typography>
                    </Box>
                </Box>

                <Typography fontWeight={800} fontSize="0.7rem" color="#656D76"
                    sx={{ fontFamily: "'JetBrains Mono', monospace", bgcolor: '#F6F8FA', px: 0.8, py: 0.3, borderRadius: 1, border: '1px solid #D0D7DE' }}>
                    #{rank + 1}
                </Typography>
            </Box>

            {/* Bar chart */}
            <Box sx={{ px: 0.5, py: 0.5 }}>
                <ActivityChart commits={commits} periodFilter={periodFilter} theme="light" />
            </Box>
        </Box>
    );
};

export default AuthorCard;
