import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Button, TextField, Tabs, Tab, Chip,
    CircularProgress, Skeleton, IconButton, Avatar, Tooltip, MenuItem, Select,
    InputAdornment,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import SyncIcon from '@mui/icons-material/Sync';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CommitIcon from '@mui/icons-material/Commit';
import PeopleIcon from '@mui/icons-material/People';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { toast } from 'react-toastify';
import githubService from '../../api/services/githubService';
import type {
    GitHubConnectionResponse, GitHubCommitResponse, GitHubStatsResponse, GitHubBranchResponse,
} from '../../types/github.types';
import { useRole } from '../../hooks/useRole';

type ViewMode = 'overview' | 'connect' | 'detail';
type RepoType = 'FRONTEND' | 'BACKEND';

const REPO_CFG = {
    FRONTEND: { label: 'Frontend', icon: <CodeIcon />, desc: 'Client-side repository', color: '#3B82F6' },
    BACKEND: { label: 'Backend', icon: <StorageIcon />, desc: 'Server-side repository', color: '#8B5CF6' },
};

const CONTRIBUTOR_THEMES = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#764ba2', light: '#F3F0FF' },
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f5576c', light: '#FFF0F3' },
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#4facfe', light: '#EFF8FF' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#43e97b', light: '#ECFDF5' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', accent: '#fa709a', light: '#FFF5F5' },
    { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', accent: '#a18cd1', light: '#FAF5FF' },
];

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

// ── Activity Chart — 7 days of latest commit week ──
const CHART_H = 32;
const ActivityChart: React.FC<{ commits: GitHubCommitResponse[]; color: string }> = ({ commits, color }) => {
    const data = useMemo(() => {
        // Find the most recent commit date
        const dates = commits.map(c => c.commitDate ? new Date(c.commitDate).getTime() : 0).filter(Boolean);
        const latestTs = dates.length > 0 ? Math.max(...dates) : Date.now();
        const latest = new Date(latestTs);
        // Start from Monday of that week
        const dayOfWeek = latest.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(latest.getTime() - mondayOffset * 86400000);
        weekStart.setHours(0, 0, 0, 0);

        return Array.from({ length: 7 }, (_, idx) => {
            const dayStart = new Date(weekStart.getTime() + idx * 86400000);
            const dayEnd = new Date(dayStart.getTime() + 86400000);
            const count = commits.filter(c => {
                if (!c.commitDate) return false;
                const t = new Date(c.commitDate).getTime();
                return t >= dayStart.getTime() && t < dayEnd.getTime();
            }).length;
            const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            const label = `${dayNames[idx]} ${dayStart.getDate()}/${dayStart.getMonth() + 1}`;
            return { count, label };
        });
    }, [commits]);
    const max = Math.max(...data.map(d => d.count), 1);
    const hGrid = [0.25, 0.5, 0.75];
    // Vertical gridlines every 5 bars → 6 lines
    const vGrid = [1, 2, 3, 4, 5, 6].map(i => i / 7);
    return (
        <Box>
            <Box sx={{ position: 'relative', height: CHART_H, bgcolor: '#FAFBFC', borderRadius: '4px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                {hGrid.map(p => <Box key={`h${p}`} sx={{ position: 'absolute', bottom: `${p * 100}%`, left: 0, right: 0, borderBottom: '1px dashed #E8ECF0', zIndex: 0 }} />)}
                {vGrid.map(p => <Box key={`v${p}`} sx={{ position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0, borderLeft: '1px dashed #E8ECF0', zIndex: 0 }} />)}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '100%', position: 'relative', zIndex: 1, px: '2px', py: '2px' }}>
                    {data.map((d, i) => (
                        <Tooltip key={i} title={<Box sx={{ textAlign: 'center' }}><Typography fontSize="0.72rem" fontWeight={700}>{d.count} commits</Typography><Typography fontSize="0.6rem" sx={{ opacity: 0.7 }}>{d.label}</Typography></Box>} arrow>
                            <Box sx={{
                                flex: 1, minHeight: 2,
                                height: `${Math.max((d.count / max) * 100, 4)}%`,
                                bgcolor: d.count > 0 ? color : '#E2E8F0',
                                borderRadius: '1.5px 1.5px 0 0',
                                opacity: d.count > 0 ? (0.45 + (d.count / max) * 0.55) : 0.2,
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                                '&:hover': { opacity: 1, filter: 'brightness(1.15)' },
                            }} />
                        </Tooltip>
                    ))}
                </Box>
            </Box>
            {/* Date labels — every 7 days */}
            <Box sx={{ display: 'flex', gap: '1px', mt: '2px', px: '2px' }}>
                {data.map((d, i) => (
                    <Typography key={i} sx={{ flex: 1, fontSize: '0.42rem', color: '#B0B8C4', textAlign: 'center', fontFamily: "'Inter',sans-serif", fontWeight: 500, lineHeight: 1 }}>
                        {i < 7 ? d.label : ''}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

const GitHubPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const { isReadOnly } = useRole();
    const readOnly = isReadOnly();

    const [connections, setConnections] = useState<GitHubConnectionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewMode>('overview');
    const [selectedRepo, setSelectedRepo] = useState<RepoType | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [tab, setTab] = useState(0);
    const [commits, setCommits] = useState<GitHubCommitResponse[]>([]);
    const [stats, setStats] = useState<GitHubStatsResponse[]>([]);
    const [branches, setBranches] = useState<GitHubBranchResponse[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [authorFilter, setAuthorFilter] = useState<string>('all');
    const [branchSearch, setBranchSearch] = useState('');

    const getConn = (t: RepoType) => connections.find(c => c.repoLabel === t && c.connectionStatus === 'CONNECTED');
    const fetchConns = useCallback(async () => {
        try { const r = await githubService.getConnections(pid); setConnections(r.data.data || []); }
        catch { setConnections([]); }
    }, [pid]);
    const fetchData = useCallback(async (connId?: number) => {
        setLoadingData(true);
        try {
            const params = connId ? { connectionId: connId } : undefined;
            const [c, s, b] = await Promise.all([githubService.getCommits(pid, params), githubService.getStats(pid, params), githubService.getBranches(pid)]);
            setCommits(c.data.data || []); setStats(s.data.data || []); setBranches(b.data.data || []);
        } catch { /* silent */ } finally { setLoadingData(false); }
    }, [pid]);

    useEffect(() => { (async () => { setLoading(true); await fetchConns(); setLoading(false); })(); }, [fetchConns]);

    // Auto-poll every 60s so UI reflects webhook-triggered syncs without manual refresh
    useEffect(() => {
        const interval = setInterval(async () => {
            await fetchConns();
            // If viewing detail, also refresh commits/stats
            if (view === 'detail' && selectedRepo) {
                const c = connections.find(x => x.repoLabel === selectedRepo && x.connectionStatus === 'CONNECTED');
                if (c) await fetchData(c.connectionId);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchConns, fetchData, view, selectedRepo, connections]);

    const handleCardClick = (t: RepoType) => {
        setSelectedRepo(t);
        const c = getConn(t);
        if (c) {
            setView('detail');
            fetchData(c.connectionId);
        } else if (!readOnly) {
            setUrl('');
            setToken('');
            setView('connect');
        } else {
            toast.info('Sinh viên cần kết nối repo này để theo dõi commits.');
        }
    };
    const handleBack = () => { setView('overview'); setSelectedRepo(null); setTab(0); setBranchFilter('all'); setAuthorFilter('all'); };
    const handleConnect = async () => {
        if (!url || !token || !selectedRepo) { toast.error('Nhập Repository URL và Token'); return; }
        try {
            setConnecting(true);
            await githubService.connect({ projectId: pid, repositoryUrl: url, accessToken: token, repoLabel: selectedRepo });
            toast.success('Kết nối thành công! Đang sync...');
            await fetchConns();
            try { setSyncing(true); const r = await githubService.sync({ projectId: pid }); toast.success(`Sync: ${r.data.data.commitsSynced} commits`); await fetchConns(); }
            catch { toast.warning('Kết nối OK nhưng sync thất bại.'); } finally { setSyncing(false); }
            // Fetch data after getting updated connections (to get the new connectionId)
            const updatedConns = await githubService.getConnections(pid);
            const newConn = (updatedConns.data.data || []).find(c => c.repoLabel === selectedRepo && c.connectionStatus === 'CONNECTED');
            await fetchData(newConn?.connectionId);
            setView('detail');
        } catch (e: any) { toast.error(e.response?.data?.message || 'Kết nối thất bại'); } finally { setConnecting(false); }
    };
    const handleSync = async () => {
        try { setSyncing(true); const r = await githubService.sync({ projectId: pid }); toast.success(`Sync: ${r.data.data.commitsSynced} commits`); await fetchConns(); await fetchData(activeConn?.connectionId); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Sync thất bại'); } finally { setSyncing(false); }
    };

    // Click author card → jump to commits filtered by author (using githubLogin)
    const handleAuthorClick = (githubLogin: string) => {
        setAuthorFilter(githubLogin);
        setBranchFilter('all');
        setTab(1);
    };

    const timeAgo = (d: string | null) => {
        if (!d) return 'Never';
        const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
    };
    const getInitials = (n: string) => { const p = n.trim().split(' '); return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.substring(0, 2).toUpperCase(); };

    // Commits per merged author — group by githubLogin (100% reliable)
    const commitsByAuthor = useMemo(() => {
        const map: Record<string, GitHubCommitResponse[]> = {};
        for (const s of stats) {
            map[s.githubLogin] = commits.filter(c =>
                c.githubLogin?.toLowerCase() === s.githubLogin?.toLowerCase()
            );
        }
        return map;
    }, [commits, stats]);

    // Filtered commits — match by githubLogin
    const filteredCommits = useMemo(() => {
        let r = commits;
        if (branchFilter !== 'all') r = r.filter(c => c.branchName === branchFilter);
        if (authorFilter !== 'all') {
            r = r.filter(c => c.githubLogin?.toLowerCase() === authorFilter.toLowerCase());
        }
        return r;
    }, [commits, branchFilter, authorFilter]);

    // Only show merged author names (from stats) in the filter — value is githubLogin
    const mergedAuthors = useMemo(() => stats.map(s => ({ label: s.userName, value: s.githubLogin })), [stats]);
    const filteredBranches = useMemo(() => branchSearch ? branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase())) : branches, [branches, branchSearch]);
    // Unique branch names from commits (for filter)
    const commitBranches = useMemo(() => [...new Set(commits.map(c => c.branchName).filter(Boolean))], [commits]);

    if (loading) return (
        <Box sx={{ p: 4 }}>
            <Skeleton width={300} height={40} sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 3 }}><Skeleton height={180} sx={{ borderRadius: 3, flex: 1 }} /><Skeleton height={180} sx={{ borderRadius: 3, flex: 1 }} /></Box>
        </Box>
    );

    const activeConn = selectedRepo ? getConn(selectedRepo) : null;
    const cfgData = selectedRepo ? REPO_CFG[selectedRepo] : null;
    const accent = cfgData?.color || '#3B82F6';
    const repoName = activeConn?.repositoryUrl?.replace('https://github.com/', '').replace('.git', '') || '';
    const sorted = [...stats].sort((a, b) => b.totalLinesAdded - a.totalLinesAdded);
    const totalLinesAll = sorted.reduce((a, s) => a + s.totalLinesAdded, 0);

    // ══════════════ OVERVIEW ══════════════
    if (view === 'overview') {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box sx={{
                        width: 52, height: 52, borderRadius: 3,
                        bgcolor: '#24292F', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(36,41,47,0.3)',
                    }}>
                        <GitHubIcon sx={{ fontSize: 30, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1E293B">GitHub Repositories</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Chọn repository để xem commits &amp; thống kê đóng góp
                        </Typography>
                    </Box>
                </Box>

                {/* Cards grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                    maxWidth: 860,
                }}>
                    {(['FRONTEND', 'BACKEND'] as RepoType[]).map(type => {
                        const c = getConn(type);
                        const connected = !!c;
                        const rcfg = REPO_CFG[type];

                        return (
                            <Box
                                key={type}
                                onClick={() => handleCardClick(type)}
                                sx={{
                                    borderRadius: 4, cursor: 'pointer',
                                    bgcolor: '#fff',
                                    border: connected ? `1.5px solid ${rcfg.color}30` : '1.5px dashed #CBD5E1',
                                    boxShadow: connected
                                        ? `0 4px 20px ${rcfg.color}15`
                                        : '0 2px 8px rgba(0,0,0,0.05)',
                                    overflow: 'hidden',
                                    transition: 'all 0.22s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 12px 36px ${rcfg.color}22`,
                                        borderColor: rcfg.color,
                                    },
                                }}
                            >
                                {/* Top accent bar */}
                                <Box sx={{
                                    height: 5,
                                    background: connected
                                        ? `linear-gradient(90deg, ${rcfg.color}, ${rcfg.color}80)`
                                        : '#E2E8F0',
                                }} />

                                <Box sx={{ p: 3 }}>
                                    {/* Row 1: icon + label + badge */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                                            background: connected
                                                ? `linear-gradient(135deg, ${rcfg.color}, ${rcfg.color}BB)`
                                                : 'linear-gradient(135deg, #CBD5E1, #E2E8F0)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: connected ? `0 4px 12px ${rcfg.color}35` : 'none',
                                            '& svg': { fontSize: 24, color: connected ? '#fff' : '#94A3B8' },
                                        }}>
                                            {rcfg.icon}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography fontWeight={800} fontSize="1.1rem" color="#1E293B" lineHeight={1.2}>
                                                {rcfg.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                {rcfg.desc}
                                            </Typography>
                                        </Box>
                                        {connected ? (
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '12px !important', color: '#22C55E !important' }} />}
                                                label="Connected"
                                                size="small"
                                                sx={{ height: 24, bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: '0.65rem' }}
                                            />
                                        ) : (
                                            <Chip label="Not connected" size="small"
                                                sx={{ height: 24, bgcolor: '#F8FAFC', color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem' }} />
                                        )}
                                    </Box>

                                    {connected && c ? (
                                        <>
                                            {/* Repo URL */}
                                            <Box sx={{
                                                px: 2, py: 1.5, borderRadius: 2,
                                                bgcolor: `${rcfg.color}08`,
                                                border: `1px solid ${rcfg.color}18`,
                                                mb: 2,
                                            }}>
                                                <Typography
                                                    fontSize="0.78rem" fontWeight={600}
                                                    fontFamily="'JetBrains Mono', 'Courier New', monospace"
                                                    color={rcfg.color} noWrap
                                                >
                                                    {c.repositoryUrl?.replace('https://github.com/', '')}
                                                </Typography>
                                            </Box>

                                            {/* Stats row */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                                    <CommitIcon sx={{ fontSize: 14, color: rcfg.color }} />
                                                    <Typography variant="caption" fontWeight={700} color={rcfg.color}>
                                                        {c.totalCommits} commits
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                                    <AccountTreeIcon sx={{ fontSize: 13, color: '#64748B' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                        {c.branchName}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                                    Sync {timeAgo(c.lastSyncAt)}
                                                </Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{
                                            textAlign: 'center', py: 2.5,
                                            border: '1px dashed #E2E8F0', borderRadius: 2,
                                        }}>
                                            <Typography variant="body2" color="text.disabled" sx={{ mb: 0.5 }}>
                                                Chưa có repository nào được kết nối
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color={rcfg.color}>
                                                + Kết nối ngay →
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    }


    // ══════════════ CONNECT ══════════════
    if (view === 'connect' && selectedRepo && cfgData) {
        return (
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 480, mx: 'auto' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: '#64748B' }}>Back</Button>
                <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <Box sx={{ height: 4, bgcolor: accent }} />
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <GitHubIcon sx={{ fontSize: 28, color: '#24292F' }} />
                            <Typography fontWeight={800} fontSize="1.1rem" color="#1E293B">Connect {cfgData.label}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Repository URL" placeholder="https://github.com/owner/repo" value={url} onChange={e => setUrl(e.target.value)} fullWidth InputProps={{ sx: { borderRadius: 2 } }} />
                            <TextField label="Personal Access Token" placeholder="ghp_xxxxxxxxxxxx" type="password" value={token} onChange={e => setToken(e.target.value)} fullWidth InputProps={{ sx: { borderRadius: 2 } }}
                                helperText={<Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Needs repo scope. <Box component="a" href="https://github.com/settings/tokens/new?description=TrackSpace&scopes=repo" target="_blank" rel="noopener noreferrer" sx={{ color: accent, textDecoration: 'none', fontWeight: 700 }}>Create token <OpenInNewIcon sx={{ fontSize: 11 }} /></Box></Box>} />
                            <Button variant="contained" fullWidth onClick={handleConnect} disabled={connecting}
                                startIcon={connecting ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.2, bgcolor: '#24292F', '&:hover': { bgcolor: '#1B1F23' } }}>
                                {connecting ? 'Connecting...' : 'Connect repository'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ══════════════ DETAIL ══════════════
    if (view === 'detail' && selectedRepo && cfgData) {
        return (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton onClick={handleBack} size="small" sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}><ArrowBackIcon fontSize="small" /></IconButton>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#24292F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GitHubIcon sx={{ fontSize: 20, color: '#fff' }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={800} color="#1E293B">{cfgData.label}</Typography>
                                <Typography fontWeight={600} fontSize="0.8rem" color={accent} fontFamily="'JetBrains Mono', monospace">{repoName}</Typography>
                                {/* Live dot */}
                                <Tooltip title="Auto-sync mỗi 60s" arrow>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
                                        <Box sx={{
                                            width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E',
                                            boxShadow: '0 0 0 0 rgba(34,197,94,0.5)',
                                            animation: 'pulse-dot 2s ease-in-out infinite',
                                            '@keyframes pulse-dot': {
                                                '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.6)' },
                                                '70%': { boxShadow: '0 0 0 6px rgba(34,197,94,0)' },
                                                '100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
                                            }
                                        }} />
                                        <Typography variant="caption" color="#22C55E" fontWeight={700} fontSize="0.65rem">LIVE</Typography>
                                    </Box>
                                </Tooltip>
                            </Box>
                            <Typography variant="caption" color="text.secondary">{activeConn?.repositoryUrl?.replace('https://github.com/', '')} · {commits.length} commits · {branches.length} branches · {timeAgo(activeConn?.lastSyncAt || null)}</Typography>
                        </Box>
                    </Box>
                    {!readOnly && (
                        <Button size="small" variant="contained" disabled={syncing} startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />} onClick={handleSync}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#238636', '&:hover': { bgcolor: '#2EA043' } }}>{syncing ? 'Syncing...' : 'Sync'}</Button>
                    )}
                </Box>


                {/* Tabs */}
                <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 3 }}>
                    <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v !== 1) { setAuthorFilter('all'); setBranchFilter('all'); } }} sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', minHeight: 40 },
                        '& .MuiTabs-indicator': { bgcolor: accent, height: 2.5, borderRadius: 2 }
                    }}>
                        <Tab icon={<PeopleIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Contributors" />
                        <Tab icon={<CommitIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Commits (${commits.length})`} />
                        <Tab icon={<AccountTreeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Branches (${branches.length})`} />
                    </Tabs>
                </Box>

                {loadingData ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{[1, 2, 3].map(i => <Skeleton key={i} height={180} sx={{ borderRadius: 3 }} />)}</Box>
                ) : (
                    <>
                        {/* ═══ CONTRIBUTORS ═══ */}
                        {tab === 0 && (
                            sorted.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 8 }}><PeopleIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 1 }} /><Typography color="text.secondary">No contributors yet. Sync to fetch data.</Typography></Box>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
                                    {sorted.map((s, i) => {
                                        const theme = CONTRIBUTOR_THEMES[i % CONTRIBUTOR_THEMES.length];
                                        const authorCommits = commitsByAuthor[s.githubLogin] || [];
                                        return (
                                            <Box key={s.userName + i} sx={{
                                                borderRadius: 2.5, overflow: 'hidden', bgcolor: '#fff',
                                                border: '1px solid #E2E8F0',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)', borderColor: theme.accent + '40' }
                                            }}>
                                                {/* Gradient header */}
                                                <Box sx={{ background: theme.bg, px: 1.5, py: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 800, fontSize: 13, border: '2px solid rgba(255,255,255,0.3)' }}>
                                                        {getInitials(s.userName)}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography fontWeight={800} fontSize="0.78rem" color="#fff" noWrap>{s.userName}</Typography>
                                                    </Box>
                                                    <Typography fontSize="1.1rem">{RANK_EMOJI[i] || `#${i + 1}`}</Typography>
                                                </Box>

                                                {/* Stats row */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-around', px: 1, py: 0.8, borderBottom: '1px solid #F1F5F9' }}>
                                                    <Tooltip title="Click xem commits" arrow>
                                                        <Box onClick={() => handleAuthorClick(s.githubLogin)} sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.7 } }}>
                                                            <Typography fontWeight={800} fontSize="0.82rem" color="#1E293B" fontFamily="'JetBrains Mono', monospace">{s.totalCommits}</Typography>
                                                            <Typography fontSize="0.5rem" color="#94A3B8" fontWeight={600}>COMMITS</Typography>
                                                        </Box>
                                                    </Tooltip>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography fontWeight={800} fontSize="0.82rem" color="#16A34A" fontFamily="'JetBrains Mono', monospace">+{(s.totalLinesAdded || 0).toLocaleString()}</Typography>
                                                        <Typography fontSize="0.5rem" color="#94A3B8" fontWeight={600}>ADDED</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography fontWeight={800} fontSize="0.82rem" color="#DC2626" fontFamily="'JetBrains Mono', monospace">-{(s.totalLinesDeleted || 0).toLocaleString()}</Typography>
                                                        <Typography fontSize="0.5rem" color="#94A3B8" fontWeight={600}>DELETED</Typography>
                                                    </Box>
                                                </Box>

                                                {/* Activity chart */}
                                                <Box sx={{ px: 1.5, py: 1 }}>
                                                    <ActivityChart commits={authorCommits} color={theme.accent} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )
                        )}

                        {/* ═══ COMMITS ═══ */}
                        {tab === 1 && (
                            <Box>
                                {/* Filters */}
                                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <FilterListIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                                    <Select value={branchFilter} onChange={e => setBranchFilter(e.target.value as string)} size="small" displayEmpty
                                        sx={{ minWidth: 160, borderRadius: 2, fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}>
                                        <MenuItem value="all">All branches</MenuItem>
                                        {/* Use both API branches and commit branch names */}
                                        {[...new Set([...branches.map(b => b.name), ...commitBranches])].map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                                    </Select>
                                    <Select value={authorFilter} onChange={e => setAuthorFilter(e.target.value as string)} size="small" displayEmpty
                                        sx={{ minWidth: 160, borderRadius: 2, fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}>
                                        <MenuItem value="all">All authors</MenuItem>
                                        {mergedAuthors.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                                    </Select>
                                    {(branchFilter !== 'all' || authorFilter !== 'all') && (
                                        <Chip label="Clear filters" size="small" onDelete={() => { setBranchFilter('all'); setAuthorFilter('all'); }}
                                            sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
                                    )}
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{filteredCommits.length} commits</Typography>
                                </Box>

                                {/* Active filter banner */}
                                {authorFilter !== 'all' && (
                                    <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PeopleIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                                        <Typography fontSize="0.8rem" color="#1E40AF" fontWeight={600}>
                                            Showing commits by <strong>{stats.find(s => s.githubLogin === authorFilter)?.userName || authorFilter}</strong>
                                        </Typography>
                                        <Chip label="✕ Clear" size="small" onClick={() => setAuthorFilter('all')}
                                            sx={{ ml: 'auto', height: 22, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', bgcolor: '#DBEAFE', color: '#2563EB' }} />
                                    </Box>
                                )}

                                {filteredCommits.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 8 }}><CommitIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 1 }} /><Typography color="text.secondary">No commits found for these filters.</Typography></Box>
                                ) : (
                                    <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                        {filteredCommits.slice(0, 60).map((c, i) => (
                                            <Box key={c.commitSha || i} sx={{ p: 2, borderBottom: i < Math.min(filteredCommits.length, 60) - 1 ? '1px solid #F1F5F9' : 'none', '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background 0.15s' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography fontWeight={600} fontSize="0.85rem" color="#1E293B" noWrap sx={{ mb: 0.3 }}>{c.commitMessage}</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                            <Typography fontSize="0.72rem" color="text.secondary" fontWeight={600}>{c.githubLogin || c.authorName}</Typography>
                                                            {c.branchName && <Chip label={c.branchName} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600 }} />}
                                                            <Typography fontSize="0.68rem" color="text.disabled">{timeAgo(c.commitDate)}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                                        {(c.linesAdded > 0 || c.linesDeleted > 0) && (
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                {c.linesAdded > 0 && <Typography sx={{ color: '#22C55E', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>+{c.linesAdded}</Typography>}
                                                                {c.linesDeleted > 0 && <Typography sx={{ color: '#EF4444', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>-{c.linesDeleted}</Typography>}
                                                            </Box>
                                                        )}
                                                        <Chip label={c.commitSha?.substring(0, 7)} size="small"
                                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(c.commitSha || ''); toast.success('Copied!'); }}
                                                            sx={{ height: 22, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', bgcolor: '#F1F5F9', color: '#3B82F6', fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: '#E2E8F0' } }} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* ═══ BRANCHES ═══ */}
                        {tab === 2 && (
                            <Box>
                                <TextField placeholder="Search branches..." size="small" fullWidth value={branchSearch} onChange={e => setBranchSearch(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment>, sx: { borderRadius: 2 } }}
                                    sx={{ mb: 2 }} />
                                {filteredBranches.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 8 }}><AccountTreeIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 1 }} />
                                        <Typography color="text.secondary">{branchSearch ? 'No branches match.' : 'No branches. Sync first.'}</Typography></Box>
                                ) : (
                                    <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                        {filteredBranches.map((b, i) => (
                                            <Box key={b.name} onClick={() => { setBranchFilter(b.name); setAuthorFilter('all'); setTab(1); }}
                                                sx={{
                                                    p: 2, borderBottom: i < filteredBranches.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                                                    '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background 0.15s'
                                                }}>
                                                <AccountTreeIcon sx={{ fontSize: 18, color: accent }} />
                                                <Typography fontWeight={600} fontSize="0.85rem" color="#1E293B" fontFamily="'JetBrains Mono', monospace">{b.name}</Typography>
                                                {b.isProtected && <Chip label="protected" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 600 }} />}
                                                {b.name === activeConn?.branchName && <Chip label="default" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 600 }} />}
                                                <Typography fontSize="0.7rem" color="text.disabled" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    View commits →
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        );
    }
    return null;
};

export default GitHubPage;
