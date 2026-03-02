import React, { useMemo, useState } from 'react';
import {
    Box, Typography, Paper, Avatar, Chip, Tooltip,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { toast } from 'react-toastify';
import type { GitHubCommitResponse } from '../../../types/github.types';

interface Props {
    commits: GitHubCommitResponse[];
    filterUser: string | null;
    onFilterUserChange: (user: string | null) => void;
}

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

const CommitsTab: React.FC<Props> = ({ commits, filterUser, onFilterUserChange }) => {
    const [dateFilter, setDateFilter] = useState<string>('all');

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const colorMap = useMemo(() => {
        const map: Record<string, string> = {};
        const uniqueAuthors = [...new Set(commits.map(c => c.authorName))];
        uniqueAuthors.forEach((name, i) => { map[name] = AVATAR_COLORS[i % AVATAR_COLORS.length]; });
        return map;
    }, [commits]);

    const filtered = useMemo(() => {
        let result = [...commits];

        // User filter
        if (filterUser) {
            result = result.filter(c => c.authorName === filterUser);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = Date.now();
            const cutoff = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
            const since = now - cutoff * 24 * 60 * 60 * 1000;
            result = result.filter(c => new Date(c.commitDate).getTime() >= since);
        }

        // Sort newest first
        result.sort((a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime());
        return result;
    }, [commits, filterUser, dateFilter]);

    // Group by date
    const grouped = useMemo(() => {
        const groups: Record<string, GitHubCommitResponse[]> = {};
        filtered.forEach(c => {
            const dateKey = new Date(c.commitDate).toLocaleDateString('en-US', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(c);
        });
        return groups;
    }, [filtered]);

    const relativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} minutes ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'yesterday';
        return `${days} days ago`;
    };

    const uniqueAuthors = [...new Set(commits.map(c => c.authorName))];

    return (
        <Box>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Contributor</InputLabel>
                    <Select
                        value={filterUser || ''}
                        label="Contributor"
                        onChange={e => onFilterUserChange(e.target.value || null)}
                        sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                    >
                        <MenuItem value="">All contributors</MenuItem>
                        {uniqueAuthors.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Period</InputLabel>
                    <Select
                        value={dateFilter}
                        label="Period"
                        onChange={e => setDateFilter(e.target.value)}
                        sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                    >
                        <MenuItem value="all">All time</MenuItem>
                        <MenuItem value="7d">Last 7 days</MenuItem>
                        <MenuItem value="30d">Last 30 days</MenuItem>
                        <MenuItem value="90d">Last 90 days</MenuItem>
                    </Select>
                </FormControl>

                <Chip
                    label={`${filtered.length} commits`}
                    size="small"
                    sx={{
                        fontWeight: 600, fontSize: '0.75rem',
                        bgcolor: '#F1F5F9', color: '#64748B',
                    }}
                />
            </Box>

            {/* Commit List */}
            {filtered.length === 0 ? (
                <Paper elevation={0} sx={{
                    p: 6, textAlign: 'center', borderRadius: 3,
                    border: '2px dashed', borderColor: 'divider',
                }}>
                    <Typography color="text.secondary">Không có commits nào phù hợp</Typography>
                </Paper>
            ) : (
                Object.entries(grouped).map(([dateLabel, dateCommits]) => (
                    <Box key={dateLabel} sx={{ mb: 3 }}>
                        {/* Date Header */}
                        <Typography sx={{
                            fontSize: '0.75rem', fontWeight: 700, color: '#64748B',
                            mb: 1.5, fontFamily: "'Inter', sans-serif",
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            Commits on {dateLabel}
                        </Typography>

                        {/* Commits */}
                        <Paper elevation={0} sx={{
                            borderRadius: 3, border: '1px solid', borderColor: 'divider',
                            overflow: 'hidden',
                        }}>
                            {dateCommits.map((c, idx) => {
                                const color = colorMap[c.authorName] || '#94A3B8';
                                return (
                                    <Box key={c.commitId} sx={{
                                        px: 2.5, py: 1.75,
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        borderBottom: idx < dateCommits.length - 1 ? '1px solid #F1F5F9' : 'none',
                                        transition: 'background 0.1s',
                                        '&:hover': { bgcolor: '#FAFBFC' },
                                    }}>
                                        {/* Avatar */}
                                        <Avatar sx={{
                                            width: 32, height: 32, flexShrink: 0,
                                            bgcolor: `${color}14`, color,
                                            fontWeight: 700, fontSize: 12,
                                            fontFamily: "'Inter', sans-serif",
                                        }}>
                                            {getInitials(c.authorName)}
                                        </Avatar>

                                        {/* Message + Author */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography noWrap sx={{
                                                fontWeight: 600, fontSize: '0.85rem', color: '#1E293B',
                                                fontFamily: "'Inter', sans-serif",
                                                mb: 0.25,
                                            }}>
                                                {c.commitMessage}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontSize="0.72rem" fontWeight={500} sx={{ color }}>
                                                    {c.authorName}
                                                </Typography>
                                                <Typography fontSize="0.68rem" color="text.disabled">
                                                    committed {relativeTime(c.commitDate)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Stats */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                                            {(c.filesChanged > 0) && (
                                                <Tooltip title={`${c.filesChanged} files changed`} arrow>
                                                    <Chip
                                                        icon={<InsertDriveFileIcon sx={{ fontSize: '12px !important' }} />}
                                                        label={c.filesChanged}
                                                        size="small"
                                                        sx={{
                                                            height: 22, fontSize: '0.68rem', fontWeight: 600,
                                                            bgcolor: '#F1F5F9', color: '#64748B',
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                            {c.linesAdded > 0 && (
                                                <Typography fontSize="0.7rem" fontWeight={600}
                                                    sx={{ color: '#3FB950', fontFamily: "'JetBrains Mono', monospace" }}>
                                                    +{c.linesAdded}
                                                </Typography>
                                            )}
                                            {c.linesDeleted > 0 && (
                                                <Typography fontSize="0.7rem" fontWeight={600}
                                                    sx={{ color: '#F85149', fontFamily: "'JetBrains Mono', monospace" }}>
                                                    -{c.linesDeleted}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* SHA + Copy */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                                            <Chip
                                                label={c.commitSha.substring(0, 7)}
                                                size="small"
                                                sx={{
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontSize: '0.68rem', fontWeight: 500,
                                                    height: 22, bgcolor: '#F1F5F9', color: '#3B82F6',
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' },
                                                }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(c.commitSha);
                                                    toast.info('Copied SHA!');
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Paper>
                    </Box>
                ))
            )}
        </Box>
    );
};

export default CommitsTab;
