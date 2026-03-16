import React, { useEffect, useState } from 'react';
import { Box, Typography, Dialog, CircularProgress, Chip } from '@mui/material';
import CommitIcon from '@mui/icons-material/Commit';
import GitHubIcon from '@mui/icons-material/GitHub';
import githubService from '../../../api/services/githubService';
import type { GitHubCommitResponse } from '../../../types/github.types';

interface CommitListDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: number;
    userId: number;
    fullName: string;
}

const CommitListDialog: React.FC<CommitListDialogProps> = ({ open, onClose, projectId, userId, fullName }) => {
    const [commits, setCommits] = useState<GitHubCommitResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        githubService.getCommits(projectId, { userId })
            .then(res => setCommits(res.data?.data || []))
            .catch(() => setCommits([]))
            .finally(() => setLoading(false));
    }, [open, projectId, userId]);

    const timeAgo = (d: string) => {
        const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const days = Math.floor(h / 24);
        return days < 30 ? `${days}d ago` : new Date(d).toLocaleDateString('vi-VN');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: '90%', maxWidth: 640,
                    maxHeight: '75vh',
                    borderRadius: 3, overflow: 'hidden',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
                },
            }}
        >
            {/* Header */}
            <Box sx={{
                px: 3, py: 2,
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
                <GitHubIcon sx={{ fontSize: 22, color: '#60A5FA' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700} fontSize="0.95rem" color="#F1F5F9">
                        Commits by {fullName}
                    </Typography>
                    <Typography fontSize="0.72rem" color="#94A3B8">
                        {loading ? 'Loading...' : `${commits.length} commit${commits.length !== 1 ? 's' : ''}`}
                    </Typography>
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{ overflowY: 'auto', maxHeight: '60vh' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} sx={{ color: '#3B82F6' }} />
                    </Box>
                ) : commits.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CommitIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                        <Typography color="text.secondary" fontSize="0.85rem">No commits found</Typography>
                    </Box>
                ) : (
                    commits.map((c, i) => (
                        <Box key={c.commitSha || i} sx={{
                            px: 3, py: 1.5,
                            borderBottom: i < commits.length - 1 ? '1px solid #F1F5F9' : 'none',
                            '&:hover': { bgcolor: '#F8FAFC' },
                            transition: 'background 0.12s',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <CommitIcon sx={{ fontSize: 16, color: '#3B82F6', mt: 0.3, flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography fontSize="0.82rem" fontWeight={600} color="#1E293B"
                                        sx={{ lineHeight: 1.4, wordBreak: 'break-word' }}>
                                        {c.commitMessage}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                        <Typography fontSize="0.68rem" color="text.secondary">{timeAgo(c.commitDate)}</Typography>
                                        {c.branchName && (
                                            <Chip label={c.branchName} size="small" sx={{
                                                height: 18, fontSize: '0.6rem', bgcolor: '#EFF6FF',
                                                color: '#3B82F6', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                                            }} />
                                        )}
                                        <Chip
                                            label={c.commitSha?.substring(0, 7)}
                                            size="small"
                                            onClick={() => navigator.clipboard.writeText(c.commitSha || '')}
                                            sx={{
                                                height: 18, fontSize: '0.62rem', cursor: 'pointer',
                                                fontFamily: "'JetBrains Mono', monospace",
                                                bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 600,
                                                '&:hover': { bgcolor: '#E2E8F0' },
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, mt: 0.3 }}>
                                    {c.linesAdded > 0 && (
                                        <Typography fontSize="0.68rem" fontWeight={700} color="#22C55E"
                                            sx={{ fontFamily: "'JetBrains Mono', monospace" }}>+{c.linesAdded}</Typography>
                                    )}
                                    {c.linesDeleted > 0 && (
                                        <Typography fontSize="0.68rem" fontWeight={700} color="#EF4444"
                                            sx={{ fontFamily: "'JetBrains Mono', monospace" }}>-{c.linesDeleted}</Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>
        </Dialog>
    );
};

export default CommitListDialog;
