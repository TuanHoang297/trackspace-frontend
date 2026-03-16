import React from 'react';
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import ScoreRing from './ScoreRing';
import MiniProgress from './MiniProgress';
import { MemberSparkline } from './ActivitySparkline';
import { GRADIENTS, AVATAR_COLORS, DOMAIN_META, getInitials } from './constants';
import type { ContributionResponse } from '../../../types/contribution.types';

interface MemberCardProps {
    m: ContributionResponse;
    rank: number;
    projectId: number;
    contributionPercent: number;
    onClick: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ m, rank, projectId, contributionPercent, onClick }) => {
    const avatarColor = AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length];
    const domain = DOMAIN_META[m.domain] || DOMAIN_META.UNKNOWN;
    const rankGradient = rank === 1 ? GRADIENTS.gold : rank === 2 ? GRADIENTS.silver : rank === 3 ? GRADIENTS.bronze : 'linear-gradient(135deg, #334155, #475569)';
    const rankGlow = rank === 1 ? 'rgba(245,158,11,0.5)' : rank === 2 ? 'rgba(192,192,192,0.4)' : rank === 3 ? 'rgba(205,127,50,0.4)' : 'none';

    return (
        <Paper elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                border: (m.inactive || m.hasLowContribution) ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(226,232,240,0.4)',
                borderLeft: (m.inactive || m.hasLowContribution) ? '3px solid #EF4444' : undefined,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                '&:hover': {
                    borderColor: (m.inactive || m.hasLowContribution) ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.4)',
                    boxShadow: '0 12px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(99,102,241,0.1)',
                    transform: 'translateY(-4px)',
                },
            }}
        >
            {/* ── Dark Premium Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                px: 2.5, py: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5,
                position: 'relative', overflow: 'hidden',
                '&::before': {
                    content: '""', position: 'absolute',
                    top: -30, right: -30, width: 100, height: 100,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                },
                '&::after': {
                    content: '""', position: 'absolute',
                    bottom: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
                },
            }}>
                {/* Avatar */}
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Box sx={{ position: 'absolute', inset: -3, borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor}, #8B5CF6)`, opacity: 0.6, filter: 'blur(2px)' }} />
                    <Avatar sx={{ width: 38, height: 38, position: 'relative', bgcolor: avatarColor + '25', color: '#fff', fontWeight: 800, fontSize: 13, border: `2.5px solid ${avatarColor}`, boxShadow: `0 0 12px ${avatarColor}40`, fontFamily: "'Inter', sans-serif" }}>
                        {getInitials(m.fullName)}
                    </Avatar>
                </Box>
                {/* Name + Domain */}
                <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                    <Typography fontWeight={700} fontSize="0.82rem" color="#F1F5F9"
                        sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {m.fullName}
                    </Typography>
                    <Chip label={domain.label} size="small"
                        sx={{ height: 17, fontSize: '0.5rem', fontWeight: 700, mt: 0.3, bgcolor: 'rgba(99,102,241,0.15)', color: '#93C5FD', borderRadius: 1, border: '1px solid rgba(99,102,241,0.2)' }} />
                </Box>
                {/* Rank badge */}
                <Box sx={{
                    width: 30, height: 30, borderRadius: 2, flexShrink: 0, ml: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: rankGradient,
                    boxShadow: rankGlow !== 'none' ? `0 2px 12px ${rankGlow}` : undefined,
                    border: rank > 3 ? '1px solid rgba(148,163,184,0.15)' : 'none',
                }}>
                    <Typography fontWeight={900} fontSize={rank <= 3 ? '0.82rem' : '0.7rem'} color="#fff"
                        sx={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, textShadow: rank <= 3 ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}>
                        #{rank}
                    </Typography>
                </Box>
            </Box>

            {/* ── Body (simplified) ── */}
            <Box sx={{ p: 2 }}>
                {/* Score + Progress Bars */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <ScoreRing score={contributionPercent} size={64} thickness={4} />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <MiniProgress label="GitHub Impact" value={m.githubImpactScore} color="#3B82F6" />
                        <MiniProgress label="Jira Execution" value={m.jiraExecutionScore} color="#10B981" />
                    </Box>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 1 }} />

                {/* Activity Sparkline */}
                <Typography fontSize="0.6rem" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Activity Trend</Typography>
                <MemberSparkline userId={m.userId} projectId={projectId} />
            </Box>
        </Paper>
    );
};

export default MemberCard;
