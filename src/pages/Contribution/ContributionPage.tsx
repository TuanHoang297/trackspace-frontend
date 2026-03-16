import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Chip,
    Button, Slider, Collapse, Skeleton, Dialog, DialogContent, IconButton, Badge,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CommitIcon from '@mui/icons-material/Commit';
import CalculateIcon from '@mui/icons-material/Calculate';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

import useContribution from '../../hooks/useContribution';
import { useRole } from '../../hooks/useRole';
import type { ContributionResponse } from '../../types/contribution.types';

import { GRADIENTS } from './components/constants';
import MemberCard from './components/MemberCard';
import MemberDetailDrawer from './components/MemberDetailDrawer';
import DomainComparisonCards from './components/DomainComparisonCards';
import { useCountUp } from './components/useCountUp';

/* ═══════════ Animated Stat Card ═══════════ */
const AnimatedStat: React.FC<{
    label: string; value: number; color: string; bg: string;
    icon: React.ReactNode; suffix?: string; isFloat?: boolean;
}> = ({ label, value, bg, icon, suffix = '', isFloat = false }) => {
    const animated = useCountUp(value, 1200);
    const display = isFloat ? animated.toFixed(0) : Math.round(animated).toLocaleString();

    return (
        <Paper elevation={0} sx={{
            p: 2, borderRadius: 3,
            border: '1px solid', borderColor: 'divider',
            background: `linear-gradient(135deg, ${bg}80, #FFFFFF)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            '&:hover': {
                boxShadow: `0 8px 24px ${bg}40`,
                transform: 'translateY(-3px)',
                borderColor: `${bg}`,
            },
        }}>
            <Box>
                <Typography fontSize="0.78rem" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography fontWeight={800} fontSize="1.6rem"
                    sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1, color: '#1E293B' }}>
                    {display}{suffix}
                </Typography>
            </Box>
            <Box sx={{
                width: 44, height: 44, borderRadius: 3,
                background: `linear-gradient(135deg, ${bg}, ${bg}CC)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${bg}40`,
            }}>
                {icon}
            </Box>
        </Paper>
    );
};

/* ═══════════ Main Page ═══════════ */
const ContributionPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const navigate = useNavigate();
    const { dashboard, loading, error, recalculating, recalculate } = useContribution(pid);
    const { isLecturer } = useRole();

    useEffect(() => {
        if (!error) return;
        const status = (error as any)?.response?.status;
        if (status === 403) navigate('/forbidden', { replace: true, state: { type: 'forbidden' } });
        else if (status === 404) navigate('/forbidden', { replace: true, state: { type: 'not_found' } });
    }, [error, pid, navigate]);

    const [feWeight, setFeWeight] = useState(50);
    const [showConfig, setShowConfig] = useState(false);
    const [formulaOpen, setFormulaOpen] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);

    // Drawer state
    const [selectedMember, setSelectedMember] = useState<ContributionResponse | null>(null);
    const [selectedRank, setSelectedRank] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleRecalculate = async () => {
        await recalculate(feWeight / 100);
    };

    const members = dashboard?.memberContributions || [];
    const anomalies = dashboard?.detectedAnomalies || [];

    const totalRawScore = useMemo(
        () => members.reduce((sum, m) => sum + m.contributionScore, 0),
        [members],
    );

    const getPercent = (score: number) =>
        totalRawScore > 0 ? Math.round((score / totalRawScore) * 1000) / 10 : 0;

    // Team averages for drawer comparison
    const teamAverages = useMemo(() => {
        const n = members.length || 1;
        return {
            commits: members.reduce((s, m) => s + m.totalCommits, 0) / n,
            linesAdded: members.reduce((s, m) => s + m.linesAdded, 0) / n,
            taskCompletionRate: members.reduce((s, m) => s + m.taskCompletionRate, 0) / n,
            contributionScore: members.reduce((s, m) => s + m.contributionScore, 0) / n,
        };
    }, [members]);

    const handleCardClick = (m: ContributionResponse, rank: number) => {
        setSelectedMember(m);
        setSelectedRank(rank);
        setDrawerOpen(true);
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="rounded" height={100} sx={{ mb: 3, borderRadius: 3 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 3 }} />)}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={280} sx={{ borderRadius: 3 }} />)}
                </Box>
            </Box>
        );
    }

    if (!dashboard) {
        return (
            <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography fontSize="3rem" sx={{ mb: 2 }}>📊</Typography>
                <Typography fontWeight={700} fontSize="1.1rem" sx={{ mb: 0.5 }}>No contribution data yet</Typography>
                <Typography fontSize="0.85rem" color="text.secondary">
                    Connect GitHub & Jira, then click Recalculate.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

            {/* ══════════ Hero Header ══════════ */}
            <Paper elevation={0} sx={{
                p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4, position: 'relative', overflow: 'hidden',
                background: GRADIENTS.header, color: '#fff',
            }}>
                <Box sx={{
                    position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)',
                }} />
                <Box sx={{
                    position: 'absolute', bottom: -30, left: '30%', width: 150, height: 150,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent)',
                }} />
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="h5" fontWeight={800}
                                sx={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                                Contribution Analytics
                            </Typography>
                            <StarIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {isLecturer() && (
                        <Button size="small" onClick={() => setFormulaOpen(true)}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600,
                                fontSize: '0.78rem', borderRadius: 2.5, px: 2,
                                border: '1px solid rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            }}>
                            <CalculateIcon sx={{ fontSize: 14, mr: 0.5 }} /> Formula
                        </Button>
                        )}
                        <Button size="small" onClick={() => setShowConfig(!showConfig)}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600,
                                fontSize: '0.78rem', borderRadius: 2.5, px: 2,
                                border: '1px solid rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            }}>
                            ⚙️ Weights
                        </Button>
                        <Button size="small" startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                            onClick={handleRecalculate} disabled={recalculating}
                            sx={{
                                textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                                borderRadius: 2.5, px: 2.5, color: '#fff',
                                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                                '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.6)' },
                                '&.Mui-disabled': { opacity: 0.6 },
                            }}>
                            {recalculating ? 'Calculating...' : 'Recalculate'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* ══════════ Weights Config ══════════ */}
            <Collapse in={showConfig}>
                <Paper elevation={0} sx={{
                    p: 2.5, mb: 2.5, borderRadius: 3,
                    border: '1px solid', borderColor: 'divider',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.04))',
                }}>
                    <Typography fontWeight={700} fontSize="0.85rem" sx={{ mb: 1.5 }}>Domain Weighting</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={`FE ${feWeight}%`} size="small"
                            sx={{ fontWeight: 700, bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', minWidth: 65 }} />
                        <Slider value={feWeight} onChange={(_, v) => setFeWeight(v as number)}
                            min={0} max={100} step={5}
                            sx={{
                                flex: 1, color: '#3B82F6',
                                '& .MuiSlider-track': { background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' },
                                '& .MuiSlider-thumb': { boxShadow: '0 0 8px rgba(59,130,246,0.4)' },
                            }} />
                        <Chip label={`BE ${100 - feWeight}%`} size="small"
                            sx={{ fontWeight: 700, bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981', minWidth: 65 }} />
                    </Box>
                </Paper>
            </Collapse>

            {/* ══════════ Summary Stats (Animated) ══════════ */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                <AnimatedStat label="Team Members" value={dashboard.totalMembers} color="#3B82F6" bg="#EFF6FF"
                    icon={<Box component="span" sx={{ fontSize: 16 }}>👥</Box>} />
                <AnimatedStat label="Total Commits" value={dashboard.totalCommits} color="#10B981" bg="#ECFDF5"
                    icon={<CommitIcon sx={{ fontSize: 16, color: '#10B981' }} />} />
                <AnimatedStat label="Lines Written" value={dashboard.totalLinesAdded} color="#8B5CF6" bg="#F5F3FF"
                    icon={<Box component="span" sx={{ fontSize: 16 }}>💻</Box>} />
                <AnimatedStat label="Task Completion" value={Math.round(dashboard.overallCompletionRate)} color="#EF4444" bg="#FEF2F2"
                    icon={<AssignmentTurnedInIcon sx={{ fontSize: 16, color: '#EF4444' }} />} suffix="%" />
            </Box>

            {/* ══════════ Domain Comparison ══════════ */}
            {members.length > 0 && (
                <Paper elevation={0} sx={{
                    p: 2, borderRadius: 3, mb: 3,
                    border: '1px solid', borderColor: 'divider',
                }}>
                    <DomainComparisonCards members={members} />
                </Paper>
            )}

            {/* ══════════ Team Members Header + Alerts ══════════ */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: 2,
                    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <PeopleAltIcon sx={{ fontSize: 16, color: '#fff' }} />
                </Box>
                <Typography fontWeight={800} fontSize="0.95rem" sx={{ fontFamily: "'Inter', sans-serif" }}>
                    Team Members
                </Typography>
                <Chip label={members.length} size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }} />

                {anomalies.length > 0 && (
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton onClick={() => setShowAlerts(true)}
                            sx={{ position: 'relative', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                            <Badge badgeContent={anomalies.length}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                        color: '#fff', fontSize: '0.55rem', fontWeight: 800,
                                        minWidth: 18, height: 18,
                                        boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                                    },
                                }}>
                                <NotificationsIcon sx={{ fontSize: 20, color: '#EF4444' }} />
                            </Badge>
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* ══════════ Member Cards Grid ══════════ */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2.5, mb: 3,
            }}>
                {members.map((m: ContributionResponse, i: number) => (
                    <MemberCard
                        key={m.userId}
                        m={m}
                        rank={i + 1}
                        projectId={pid}
                        contributionPercent={getPercent(m.contributionScore)}
                        onClick={() => handleCardClick(m, i + 1)}
                    />
                ))}
            </Box>

            {members.length === 0 && (
                <Paper elevation={0} sx={{
                    p: 6, textAlign: 'center', borderRadius: 4,
                    border: '2px dashed', borderColor: 'divider',
                }}>
                    <Typography fontSize="2.5rem" sx={{ mb: 1.5 }}>📊</Typography>
                    <Typography fontWeight={700}>No contribution data yet</Typography>
                    <Typography fontSize="0.85rem" color="text.secondary">
                        Connect GitHub & Jira, then click Recalculate.
                    </Typography>
                </Paper>
            )}

            {/* ══════════ Member Detail Drawer ══════════ */}
            <MemberDetailDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                member={selectedMember}
                projectId={pid}
                rank={selectedRank}
                contributionPercent={selectedMember ? getPercent(selectedMember.contributionScore) : 0}
                teamAverages={teamAverages}
            />

            {/* ══════════ Issues Dialog ══════════ */}
            <Dialog open={showAlerts} onClose={() => setShowAlerts(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                <Box sx={{
                    px: 3, py: 2,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    position: 'relative', overflow: 'hidden',
                    '&::before': {
                        content: '""', position: 'absolute',
                        top: -20, left: -20, width: 80, height: 80,
                        background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
                        borderRadius: '50%',
                    },
                }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        background: 'linear-gradient(135deg, #DC2626, #EA580C)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 12px rgba(220,38,38,0.3)',
                    }}>
                        <WarningAmberIcon sx={{ fontSize: 19, color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontSize="1rem" fontWeight={700} sx={{ color: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
                            {anomalies.length} Issues Detected
                        </Typography>
                        <Typography fontSize="0.7rem" sx={{ color: 'rgba(148,163,184,0.7)' }}>
                            Review team alerts and take action
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setShowAlerts(false)} sx={{ color: 'rgba(148,163,184,0.6)' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 0 }}>
                    {anomalies.map((a: string, i: number) => {
                        const isInactive = a.includes('INACTIVE');
                        const isLow = a.includes('LOW_CONTRIBUTION');
                        const accentColor = isInactive ? '#EF4444' : isLow ? '#F59E0B' : '#6366F1';
                        const badgeLabel = isInactive ? 'INACTIVE' : isLow ? 'LOW' : 'ALERT';
                        const badgeBg = isInactive ? 'rgba(239,68,68,0.06)' : isLow ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.06)';
                        return (
                            <Box key={i} sx={{
                                px: 3, py: 1.5,
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                borderBottom: i < anomalies.length - 1 ? '1px solid' : 'none',
                                borderColor: 'rgba(226,232,240,0.5)',
                                borderLeft: `3px solid ${accentColor}`,
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'rgba(241,245,249,0.6)' },
                            }}>
                                <Box sx={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    bgcolor: accentColor, flexShrink: 0,
                                    boxShadow: `0 0 6px ${accentColor}40`,
                                }} />
                                <Typography fontSize="0.8rem" color="text.primary" sx={{ flex: 1, fontFamily: "'Inter', sans-serif" }}>
                                    {a}
                                </Typography>
                                <Chip label={badgeLabel} size="small"
                                    sx={{
                                        height: 22, fontSize: '0.55rem', fontWeight: 800,
                                        bgcolor: badgeBg, color: accentColor,
                                        borderRadius: 1.5, border: `1px solid ${accentColor}20`,
                                        letterSpacing: '0.05em',
                                    }} />
                            </Box>
                        );
                    })}
                </DialogContent>
            </Dialog>

            {/* ══════════ Formula Dialog ══════════ */}
            <Dialog open={formulaOpen} onClose={() => setFormulaOpen(false)}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' } }}>
                <Box sx={{
                    px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E2A4A 100%)',
                }}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                    }}>
                        <CalculateIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800} fontSize="1.05rem" sx={{ color: '#fff' }}>
                            Cách tính điểm đóng góp
                        </Typography>
                        <Typography fontSize="0.68rem" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Hệ thống đánh giá tự động dựa trên GitHub + Jira
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setFormulaOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
                    <Typography fontSize="0.7rem" fontWeight={700} color="text.secondary"
                        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        2 tiêu chí đánh giá chính
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2 }}>
                        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderTop: '3px solid #3B82F6' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                <GitHubIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                                <Typography fontWeight={700} fontSize="0.88rem">GitHub</Typography>
                                <Chip label="50%" size="small" sx={{ ml: 'auto', bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
                            </Box>
                            {['Số commit (bỏ qua merge commit)', 'Số dòng code — nén bằng log để chống spam', 'Commit fix bug → nhân x2 hoặc x3', 'Commit đều hằng ngày → nhân thêm điểm'].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 0.6 }}>
                                    <Typography sx={{ color: '#3B82F6', fontSize: '0.75rem', flexShrink: 0 }}>✓</Typography>
                                    <Typography fontSize="0.75rem" color="text.secondary">{item}</Typography>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderTop: '3px solid #10B981' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                <TaskAltIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                <Typography fontWeight={700} fontSize="0.88rem">Jira</Typography>
                                <Chip label="50%" size="small" sx={{ ml: 'auto', bgcolor: '#F0FDF4', color: '#10B981', fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
                            </Box>
                            {[
                                { text: '% task hoàn thành (Done / Tổng giao)', plus: true },
                                { text: 'Làm nhiều task, code gọn → thưởng thêm', plus: true },
                                { text: 'Task trễ hạn → bị trừ điểm Jira', plus: false },
                            ].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 0.6 }}>
                                    <Typography sx={{ color: item.plus ? '#10B981' : '#EF4444', fontSize: '0.75rem', flexShrink: 0 }}>
                                        {item.plus ? '✓' : '✗'}
                                    </Typography>
                                    <Typography fontSize="0.75rem" color="text.secondary">{item.text}</Typography>
                                </Box>
                            ))}
                            <Box sx={{ mt: 1.25, p: 1, borderRadius: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
                                <Typography fontSize="0.65rem" fontWeight={700} color="#EF4444" mb={0.5}>
                                    Mức trừ khi có task trễ hạn:
                                </Typography>
                                {[
                                    { label: '0 task trễ', val: 'Không trừ', green: true },
                                    { label: '1 task trễ', val: '−15%', green: false },
                                    { label: '2 task trễ', val: '−30%', green: false },
                                    { label: '3+ task trễ', val: '−50%', green: false },
                                ].map((row, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                                        <Typography fontSize="0.65rem" color="text.secondary">{row.label}</Typography>
                                        <Typography fontSize="0.65rem" fontWeight={700} color={row.green ? '#10B981' : '#EF4444'}>{row.val}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ p: 2.5, borderRadius: 2.5, mb: 2, background: 'linear-gradient(135deg, #1E293B, #0F172A)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography fontSize="0.68rem" fontWeight={700} sx={{ color: 'rgba(148,163,184,0.8)', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Quy trình tổng hợp điểm
                        </Typography>
                        {[
                            { step: '1', text: 'Tính điểm GitHub và Jira riêng cho từng thành viên', color: '#60A5FA' },
                            { step: '2', text: 'Kết hợp:  Điểm = GitHub × 50% + Jira × 50%', color: '#A78BFA' },
                            { step: '3', text: '% đóng góp = Điểm của bạn ÷ Tổng điểm cả nhóm × 100', color: '#34D399' },
                        ].map((s) => (
                            <Box key={s.step} sx={{ display: 'flex', gap: 1.25, mb: 1, alignItems: 'flex-start' }}>
                                <Box sx={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                    bgcolor: s.color + '20', border: `1.5px solid ${s.color}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Typography fontSize="0.65rem" fontWeight={800} sx={{ color: s.color }}>{s.step}</Typography>
                                </Box>
                                <Typography fontSize="0.78rem" sx={{ color: '#CBD5E1', mt: '2px' }}>{s.text}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Typography sx={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>💡</Typography>
                        <Typography fontSize="0.75rem" color="#92400E">
                            <strong>Tổng % của cả nhóm luôn bằng 100%.</strong>{' '}
                            Thành viên code đều đặn, hoàn thành task đúng hạn và có fix bug sẽ có % cao hơn.
                        </Typography>
                    </Box>
                    <Button fullWidth onClick={() => setFormulaOpen(false)}
                        sx={{
                            mt: 2.5, py: 1.25,
                            textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
                            borderRadius: 2.5, color: '#fff',
                            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                            '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.5)' },
                        }}>
                        Đã hiểu
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ContributionPage;
