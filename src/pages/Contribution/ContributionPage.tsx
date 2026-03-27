import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Chip,
    Button, Skeleton, Dialog, DialogContent, IconButton, Badge,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';

import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CommitIcon from '@mui/icons-material/Commit';
import CalculateIcon from '@mui/icons-material/Calculate';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import StorageIcon from '@mui/icons-material/Storage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LayersIcon from '@mui/icons-material/Layers';
import BugReportIcon from '@mui/icons-material/BugReport';
import ColorLensIcon from '@mui/icons-material/ColorLens';

import useContribution from '../../hooks/useContribution';
import { useRole } from '../../hooks/useRole';
import { getUser } from '../../utils/auth';
import projectService from '../../api/services/projectService';
import groupService from '../../api/services/groupService';
import { useQuery } from '@tanstack/react-query';
import type { ContributionResponse } from '../../types/contribution.types';
import type { GroupMemberResponse } from '../../types/group.types';

import { GRADIENTS } from './components/constants';
import MemberCard from './components/MemberCard';
import MemberDetailDrawer from './components/MemberDetailDrawer';
import MemberDashboardView from './components/MemberDashboardView';
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
    const currentUser = getUser();

    // Resolve viewer permission inside this project group.
    const { data: viewerMembership } = useQuery({
        queryKey: ['contribution-viewer-membership', pid, currentUser?.userId],
        queryFn: async () => {
            const projRes = await projectService.getProjectById(pid);
            const project = projRes.data.data;
            const membersRes = await groupService.getMembers(project.classId, project.groupId);
            const members = membersRes.data.data as GroupMemberResponse[];
            return members.find((m) => m.userId === currentUser?.userId) ?? null;
        },
        enabled: !!pid && !!currentUser?.userId,
        staleTime: 60000,
    });

    const isLeader = isLecturer() || Boolean(viewerMembership?.isLeader);

    const [activeDomain, setActiveDomain] = useState<string>('ALL');

    useEffect(() => {
        if (!error) return;
        const status = (error as any)?.response?.status;
        if (status === 403) navigate('/forbidden', { replace: true, state: { type: 'forbidden' } });
        else if (status === 404) navigate('/forbidden', { replace: true, state: { type: 'not_found' } });
    }, [error, pid, navigate]);

    // Auto-recalculate on page load
    useEffect(() => {
        if (pid && !recalculating) recalculate();
    }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps

    const [formulaOpen, setFormulaOpen] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);

    // Drawer state
    const [selectedMember, setSelectedMember] = useState<ContributionResponse | null>(null);
    const [selectedRank, setSelectedRank] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const members = dashboard?.memberContributions || [];
    const anomalies = dashboard?.detectedAnomalies || [];

    const totalRawScore = useMemo(
        () => members.reduce((sum, m) => sum + m.contributionScore, 0),
        [members],
    );

    const percentagesMap = useMemo(() => {
        if (!members.length || totalRawScore === 0) return {} as Record<number, number>;
        
        const exacts = members.map(m => {
            const exact = (m.contributionScore / totalRawScore) * 100;
            return { userId: m.userId, exact, floor: Math.floor(exact) };
        });
        
        let currentSum = exacts.reduce((s, x) => s + x.floor, 0);
        let remainder = 100 - currentSum;
        
        exacts.sort((a, b) => (b.exact - b.floor) - (a.exact - a.floor));
        
        for (let i = 0; i < remainder; i++) {
            exacts[i % exacts.length].floor += 1;
        }
        
        return exacts.reduce((acc, x) => ({ ...acc, [x.userId]: x.floor }), {} as Record<number, number>);
    }, [members, totalRawScore]);

    const getPercent = (userId?: number) =>
        userId && percentagesMap[userId] !== undefined ? percentagesMap[userId] : 0;

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
    if (loading && !dashboard) {
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
                    Connect GitHub & Jira to get started. Data will be calculated automatically.
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
                        <Button size="small" onClick={() => setFormulaOpen(true)}
                            sx={{
                                color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600,
                                fontSize: '0.78rem', borderRadius: 2.5, px: 2,
                                border: '1px solid rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            }}>
                            <CalculateIcon sx={{ fontSize: 14, mr: 0.5 }} /> Formula
                        </Button>

                    </Box>
                </Box>
            </Paper>



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

            {/* ══════════ SaaS Dashboard / Member View logic ══════════ */}
            {isLeader ? (
                <>
                    {/* The Leader's "Vercel-style" Filter Dashboard */}
                    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, mb: 3, pt: 1, px: 0.5, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 10 } }}>
                        {['ALL', ...Array.from(new Set(members.map(m => m.role?.toUpperCase() || 'UNKNOWN')))].map(domain => {
                            const domMembers = domain === 'ALL' ? members : members.filter(m => (m.role?.toUpperCase() || 'UNKNOWN') === domain);
                            const totalPercent = domain === 'ALL' ? 100 : domMembers.reduce((acc, m) => acc + getPercent(m.userId), 0);
                            const isActive = activeDomain === domain;
                            
                            // Map Domain attributes
                            let icon = <Box component="span" sx={{ fontSize: 18 }}>👥</Box>;
                            let color = '#64748B'; 
                            let bgClass = '#F8FAFC';
                            
                            if (domain === 'ALL') { icon = <DashboardIcon sx={{ fontSize: 20 }}/>; color = '#6366F1'; bgClass = '#EEF2FF'; }
                            else if (domain === 'FRONTEND') { icon = <DeveloperModeIcon sx={{ fontSize: 20 }}/>; color = '#06B6D4'; bgClass = '#ECFEFF'; }
                            else if (domain === 'BACKEND') { icon = <StorageIcon sx={{ fontSize: 20 }}/>; color = '#10B981'; bgClass = '#ECFDF5'; }
                            else if (domain === 'FULLSTACK') { icon = <LayersIcon sx={{ fontSize: 20 }}/>; color = '#8B5CF6'; bgClass = '#F5F3FF'; }
                            else if (domain === 'TESTER') { icon = <BugReportIcon sx={{ fontSize: 20 }}/>; color = '#F59E0B'; bgClass = '#FFFBEB'; }
                            else if (domain === 'DESIGNER') { icon = <ColorLensIcon sx={{ fontSize: 20 }}/>; color = '#EC4899'; bgClass = '#FDF2F8'; }

                            return (
                                <Paper key={domain} onClick={() => setActiveDomain(domain)} elevation={0} sx={{
                                    p: '16px 20px', borderRadius: 4, minWidth: 170, cursor: 'pointer',
                                    border: '1px solid',
                                    position: 'relative',
                                    borderColor: isActive ? 'transparent' : 'rgba(226,232,240,0.8)',
                                    bgcolor: isActive ? '#fff' : '#F8FAFC',
                                    boxShadow: isActive ? `0 8px 24px -4px ${color}30, 0 0 0 1.5px ${color}` : '0 2px 4px rgba(0,0,0,0.02)',
                                    display: 'flex', flexDirection: 'column', gap: 1.5,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isActive ? 'translateY(-2px)' : 'none',
                                    '&:hover': { 
                                        borderColor: isActive ? 'transparent' : '#CBD5E1',
                                        boxShadow: isActive ? `0 12px 28px -4px ${color}40, 0 0 0 1.5px ${color}` : '0 4px 12px rgba(0,0,0,0.05)',
                                        bgcolor: '#fff'
                                    }
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{
                                            width: 32, height: 32, borderRadius: 2,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: isActive ? color : bgClass,
                                            color: isActive ? '#fff' : color,
                                            transition: 'all 0.3s',
                                            boxShadow: isActive ? `0 4px 10px ${color}50` : 'none',
                                        }}>
                                            {icon}
                                        </Box>
                                        <Chip 
                                            label={domMembers.length} 
                                            size="small" 
                                            sx={{ 
                                                height: 22, minWidth: 32, fontSize: '0.75rem', fontWeight: 800, 
                                                bgcolor: isActive ? bgClass : '#E2E8F0', 
                                                color: isActive ? color : '#64748B',
                                                border: isActive ? `1px solid ${color}30` : 'none',
                                            }} 
                                        />
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={800} fontSize="0.75rem" sx={{ 
                                            color: isActive ? '#1E293B' : '#64748B', 
                                            mb: 0.5, letterSpacing: '0.05em', textTransform: 'uppercase'
                                        }}>
                                            {domain === 'ALL' ? 'ALL TEAM' : domain}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                            <Typography fontSize="1.35rem" fontWeight={800} sx={{ color: isActive ? color : '#334155', lineHeight: 1 }}>
                                                {totalPercent.toFixed(1)}<span style={{ fontSize: '0.8rem' }}>%</span>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5, mb: 3 }}>
                        {(activeDomain === 'ALL' ? members : members.filter(m => (m.role?.toUpperCase() || 'UNKNOWN') === activeDomain)).map((m: ContributionResponse) => (
                            <MemberCard key={m.userId} m={m} rank={members.indexOf(m) + 1} projectId={pid} contributionPercent={getPercent(m.userId)} onClick={() => handleCardClick(m, members.indexOf(m) + 1)} />
                        ))}
                    </Box>
                </>
            ) : (
                <>
                    {/* The Member's personal view */}
                    {members.find(m => m.userId === currentUser?.userId) ? (() => {
                        const myData = members.find(m => m.userId === currentUser?.userId)!;
                        const myRank = members.indexOf(myData) + 1;
                        const totalContribution = getPercent(myData.userId);
                        
                        // Derived values
                        
                        return (
                            <Box sx={{ mb: 4, mt: 1 }}>
                                <MemberDashboardView 
                                    member={myData}
                                    projectId={pid}
                                    rank={myRank}
                                    contributionPercent={totalContribution}
                                    teamAverages={teamAverages}
                                />
                            </Box>
                        );
                    })() : (
                        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
                            <Typography fontSize="2.5rem" sx={{ mb: 1.5 }}>🧍</Typography>
                            <Typography fontWeight={700}>Bạn chưa có dữ liệu</Typography>
                            <Typography fontSize="0.85rem" color="text.secondary">Vui lòng đợi Leader đồng bộ GitHub & Jira.</Typography>
                        </Paper>
                    )}
                </>
            )}

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
                contributionPercent={getPercent(selectedMember?.userId)}
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
                maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' } }}>
                <Box sx={{
                    px: 3.5, py: 3, display: 'flex', alignItems: 'center', gap: 2,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E2A4A 100%)',
                }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 3,
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                    }}>
                        <CalculateIcon sx={{ fontSize: 24, color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800} fontSize="1.15rem" sx={{ color: '#fff', letterSpacing: '0.02em' }}>
                            Cách tính điểm đóng góp
                        </Typography>
                        <Typography fontSize="0.75rem" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                            Hệ thống đánh giá tự động dựa trên GitHub + Jira
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setFormulaOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 3.5, bgcolor: '#F8FAFC' }}>
                    <Typography fontSize="0.75rem" fontWeight={800} color="text.secondary"
                        sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        3 tiêu chí đánh giá (V2)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5, mb: 3 }}>
                        {/* Code Score */}
                        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 4px 20px rgba(59,130,246,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #60A5FA, #3B82F6)' }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2, mt: 0.5 }}>
                                <GitHubIcon sx={{ fontSize: 22, color: '#3B82F6' }} />
                                <Typography fontWeight={800} fontSize="0.95rem" sx={{ color: '#1E293B' }}>GitHub</Typography>
                                <Chip label="40%" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(59,130,246,0.1)', color: '#2563EB', fontWeight: 800, fontSize: '0.75rem', height: 24, borderRadius: 2 }} />
                            </Box>
                            {[
                                'Số dòng code × trọng số file',
                                'Logic (.java, .ts) → ×1.0',
                                'UI (.css, .html) → ×0.5',
                                'Config (.json, .yml) → ×0.1',
                                'Tính % dựa trên người code nhiều nhất',
                            ].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                                    <Box sx={{ mt: '3px', width: 14, height: 14, borderRadius: '50%', bgcolor: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Typography sx={{ color: '#3B82F6', fontSize: '0.6rem', fontWeight: 900 }}>✓</Typography>
                                    </Box>
                                    <Typography fontSize="0.8rem" color="#475569" sx={{ lineHeight: 1.4 }}>{item}</Typography>
                                </Box>
                            ))}
                        </Box>
                        {/* Task Score */}
                        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff', border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 4px 20px rgba(16,185,129,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #34D399, #10B981)' }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2, mt: 0.5 }}>
                                <TaskAltIcon sx={{ fontSize: 22, color: '#10B981' }} />
                                <Typography fontWeight={800} fontSize="0.95rem" sx={{ color: '#1E293B' }}>Jira</Typography>
                                <Chip label="40%" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 800, fontSize: '0.75rem', height: 24, borderRadius: 2 }} />
                            </Box>
                            {[
                                '% task hoàn thành (Done / Tổng giao)',
                                'Task quá hạn (Overdue) bị trừ 50% giá trị',
                                'Hoàn thành 100% đúng hạn → điểm tối đa',
                            ].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                                    <Box sx={{ mt: '3px', width: 14, height: 14, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Typography sx={{ color: '#10B981', fontSize: '0.6rem', fontWeight: 900 }}>✓</Typography>
                                    </Box>
                                    <Typography fontSize="0.8rem" color="#475569" sx={{ lineHeight: 1.4 }}>{item}</Typography>
                                </Box>
                            ))}
                        </Box>
                        {/* Consistency Score */}
                        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff', border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 4px 20px rgba(245,158,11,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FBBF24, #F59E0B)' }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2, mt: 0.5 }}>
                                <Box component="span" sx={{ fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.3))' }}>📅</Box>
                                <Typography fontWeight={800} fontSize="0.95rem" sx={{ color: '#1E293B' }}>Consistency</Typography>
                                <Chip label="20%" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(245,158,11,0.1)', color: '#D97706', fontWeight: 800, fontSize: '0.75rem', height: 24, borderRadius: 2 }} />
                            </Box>
                            {[
                                'Số ngày hoạt động (có commit hoặc update task)',
                                'Kỳ vọng tối thiểu: 3 ngày/tuần',
                                'Hoạt động đều đặn → điểm cao',
                            ].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                                    <Box sx={{ mt: '3px', width: 14, height: 14, borderRadius: '50%', bgcolor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Typography sx={{ color: '#F59E0B', fontSize: '0.6rem', fontWeight: 900 }}>✓</Typography>
                                    </Box>
                                    <Typography fontSize="0.8rem" color="#475569" sx={{ lineHeight: 1.4 }}>{item}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    
                    <Box sx={{ p: 3, borderRadius: 3, mb: 2.5, background: 'linear-gradient(135deg, #1E293B, #0F172A)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                        <Typography fontSize="0.75rem" fontWeight={800} sx={{ color: 'rgba(148,163,184,0.9)', mb: 2, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            Quy trình tổng hợp điểm cuối cùng
                        </Typography>
                        {[
                            { step: '1', text: 'Tính GitHub Score, Jira Score, Consistency Score cho từng thành viên', color: '#60A5FA' },
                            { step: '2', text: 'Điểm Cá Nhân = GitHub × 40% + Jira × 40% + Consistency × 20%', color: '#A78BFA' },
                            { step: '3', text: '% Đóng góp = (Điểm Cá Nhân ÷ Tổng điểm cả nhóm) × 100', color: '#34D399' },
                        ].map((s) => (
                            <Box key={s.step} sx={{ display: 'flex', gap: 1.5, mb: 1.25, alignItems: 'center' }}>
                                <Box sx={{
                                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                    bgcolor: s.color + '20', border: `1.5px solid ${s.color}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 10px ${s.color}30`
                                }}>
                                    <Typography fontSize="0.7rem" fontWeight={800} sx={{ color: s.color }}>{s.step}</Typography>
                                </Box>
                                <Typography fontSize="0.85rem" fontWeight={500} sx={{ color: '#E2E8F0' }}>{s.text}</Typography>
                            </Box>
                        ))}
                    </Box>
                    
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button onClick={() => setFormulaOpen(false)}
                            sx={{
                                px: 4, py: 1.25,
                                textTransform: 'none', fontWeight: 800, fontSize: '0.9rem',
                                borderRadius: 2.5, color: '#fff',
                                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                                '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.5)', background: 'linear-gradient(135deg, #2563EB, #4F46E5)' },
                            }}>
                            Tuyệt vời, đã hiểu
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ContributionPage;
