import React from 'react';
import {
    Box, Typography, Paper, Avatar, Chip, LinearProgress, Tooltip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CommitIcon from '@mui/icons-material/Commit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { GitHubStatsResponse } from '../../../types/github.types';

interface Props {
    stats: GitHubStatsResponse[];
    totalCommits: number;
    onContributorClick: (userName: string) => void;
}

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const AVATAR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

const ContributorsTab: React.FC<Props> = ({ stats, totalCommits, onContributorClick }) => {
    const sorted = [...stats].sort((a, b) => b.totalCommits - a.totalCommits);
    const maxCommits = sorted[0]?.totalCommits || 1;

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (sorted.length === 0) {
        return (
            <Paper elevation={0} sx={{
                p: 6, textAlign: 'center', borderRadius: 3,
                border: '2px dashed', borderColor: 'divider',
            }}>
                <Typography color="text.secondary">Chưa có dữ liệu contributor. Hãy sync commits trước.</Typography>
            </Paper>
        );
    }

    return (
        <Box>
            {/* Summary */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Contributors', value: sorted.length, color: '#3B82F6' },
                    { label: 'Total Commits', value: totalCommits, color: '#10B981' },
                    { label: 'Total Changes', value: sorted.reduce((a, s) => a + s.totalChanges, 0).toLocaleString(), color: '#8B5CF6' },
                ].map(s => (
                    <Paper key={s.label} elevation={0} sx={{
                        px: 2.5, py: 1.5, borderRadius: 2.5,
                        border: '1px solid', borderColor: 'divider',
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        <Typography fontWeight={800} fontSize="1.1rem" sx={{ color: s.color, fontFamily: "'Inter', sans-serif" }}>
                            {s.value}
                        </Typography>
                        <Typography fontSize="0.75rem" color="text.secondary" fontWeight={500}>
                            {s.label}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {/* Contributor Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {sorted.map((s, i) => {
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const pct = (s.totalCommits / maxCommits) * 100;

                    return (
                        <Paper
                            key={s.userId}
                            elevation={0}
                            onClick={() => onContributorClick(s.userName)}
                            sx={{
                                p: 2.5, borderRadius: 3, cursor: 'pointer',
                                border: '1px solid', borderColor: 'divider',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    borderColor: '#3B82F6',
                                    boxShadow: '0 4px 16px rgba(59,130,246,0.1)',
                                    transform: 'translateY(-1px)',
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Rank */}
                                <Box sx={{
                                    width: 32, textAlign: 'center', flexShrink: 0,
                                }}>
                                    {i < 3 ? (
                                        <EmojiEventsIcon sx={{ fontSize: 22, color: PODIUM_COLORS[i] }} />
                                    ) : (
                                        <Typography fontWeight={700} fontSize="0.85rem" color="text.disabled"
                                            sx={{ fontFamily: "'Inter', sans-serif" }}>
                                            #{i + 1}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Avatar */}
                                <Avatar sx={{
                                    width: 40, height: 40,
                                    bgcolor: `${color}14`, color,
                                    fontWeight: 700, fontSize: 14,
                                    fontFamily: "'Inter', sans-serif",
                                }}>
                                    {getInitials(s.userName)}
                                </Avatar>

                                {/* Info */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                                        <Box>
                                            <Typography fontWeight={700} fontSize="0.9rem" noWrap
                                                sx={{ fontFamily: "'Inter', sans-serif", color: '#1E293B' }}>
                                                {s.userName}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                                            <Tooltip title="Commits" arrow>
                                                <Chip
                                                    icon={<CommitIcon sx={{ fontSize: '14px !important' }} />}
                                                    label={s.totalCommits}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700, fontSize: '0.75rem', height: 24,
                                                        bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                                                        fontFamily: "'Inter', sans-serif",
                                                        '& .MuiChip-icon': { color: '#3B82F6' },
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Lines added" arrow>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <AddIcon sx={{ fontSize: 12, color: '#3FB950' }} />
                                                    <Typography fontSize="0.72rem" fontWeight={600}
                                                        sx={{ color: '#3FB950', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        {s.totalLinesAdded.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                            <Tooltip title="Lines deleted" arrow>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <RemoveIcon sx={{ fontSize: 12, color: '#F85149' }} />
                                                    <Typography fontSize="0.72rem" fontWeight={600}
                                                        sx={{ color: '#F85149', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        {s.totalLinesDeleted.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                            <Tooltip title="Last commit" arrow>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <AccessTimeIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                                                    <Typography fontSize="0.65rem" color="text.secondary"
                                                        sx={{ fontFamily: "'Inter', sans-serif" }}>
                                                        {timeAgo(s.lastCommitAt)}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    {/* Progress bar */}
                                    <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{
                                            height: 6, borderRadius: 3,
                                            bgcolor: '#F1F5F9',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                bgcolor: color,
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ContributorsTab;
