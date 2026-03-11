import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Button, TextField, Tabs, Tab, Chip,
    CircularProgress, Skeleton, IconButton, Tooltip, MenuItem, Select,
    InputAdornment,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import SyncIcon from '@mui/icons-material/Sync';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CommitIcon from '@mui/icons-material/Commit';
import PeopleIcon from '@mui/icons-material/People';
import InsightsIcon from '@mui/icons-material/Insights';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import githubService from '../../api/services/githubService';
import type {
    GitHubConnectionResponse, GitHubCommitResponse, GitHubStatsResponse, GitHubBranchResponse,
} from '../../types/github.types';
import { useRole } from '../../hooks/useRole';
import AuthorCard from './components/AuthorCard';

type ViewMode = 'overview' | 'connect' | 'detail';
type RepoType = 'FRONTEND' | 'BACKEND';

const REPO_CFG = {
    FRONTEND: { label: 'Frontend', icon: <CodeIcon />, desc: 'Client-side repository', color: '#3B82F6' },
    BACKEND: { label: 'Backend', icon: <StorageIcon />, desc: 'Server-side repository', color: '#8B5CF6' },
};

const GitHubPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const queryClient = useQueryClient();
    const { isReadOnly } = useRole();
    const readOnly = isReadOnly();

    const [searchParams, setSearchParams] = useSearchParams();
    const initialRepo = searchParams.get('repo') as RepoType | null;

    const [view, setView] = useState<ViewMode>(initialRepo ? 'detail' : 'overview');
    const [selectedRepo, setSelectedRepo] = useState<RepoType | null>(initialRepo);
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
    const [disconnectOpen, setDisconnectOpen] = useState(false);
    const [periodFilter, setPeriodFilter] = useState<'all' | 'last_month' | 'last_3_months'>('all');
    const [branchCommits, setBranchCommits] = useState<GitHubCommitResponse[] | null>(null);
    const [branchLoading, setBranchLoading] = useState(false);
    const initDone = useRef(false);

    // ── Connections cached by React Query ──
    const { data: connections = [], isLoading: loading } = useQuery({
        queryKey: ['github', 'connections', pid],
        queryFn: async () => {
            try { const r = await githubService.getConnections(pid); return r.data.data || []; }
            catch { return [] as GitHubConnectionResponse[]; }
        },
        enabled: !!pid,
    });

    const getConn = (t: RepoType) => connections.find(c => c.repoLabel === t && c.connectionStatus === 'CONNECTED');
    const fetchConns = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['github', 'connections', pid] });
    }, [pid, queryClient]);

    const fetchData = useCallback(async (connId?: number) => {
        setLoadingData(true);
        try {
            const params = connId ? { connectionId: connId } : undefined;
            const [c, s, b] = await Promise.all([githubService.getCommits(pid, params), githubService.getStats(pid, params), githubService.getBranches(pid, params)]);
            const raw = c.data.data || [];
            const seen = new Set<string>();
            const unique = raw.filter(cm => { if (seen.has(cm.commitSha)) return false; seen.add(cm.commitSha); return true; });
            setCommits(unique); setStats(s.data.data || []); setBranches(b.data.data || []);
        } catch { /* silent */ } finally { setLoadingData(false); }
    }, [pid]);

    // Auto-navigate to detail if URL has ?repo=X
    if (!loading && connections.length > 0 && initialRepo && !initDone.current) {
        initDone.current = true;
        const conn = connections.find(c => c.repoLabel === initialRepo && c.connectionStatus === 'CONNECTED');
        if (conn) { setView('detail'); fetchData(conn.connectionId); }
        else { setView('overview'); setSelectedRepo(null); setSearchParams({}, { replace: true }); }
    }

    // Background sync
    useQuery({
        queryKey: ['github', 'backgroundSync', pid],
        queryFn: async () => {
            setSyncing(true);
            try { await githubService.sync({ projectId: pid }); await queryClient.invalidateQueries({ queryKey: ['github', 'connections', pid] }); }
            catch { /* non-blocking */ } finally { setSyncing(false); }
            return null;
        },
        enabled: !!pid && connections.length > 0,
        staleTime: 60_000,
    });

    const handleCardClick = (t: RepoType) => {
        setSelectedRepo(t);
        const c = getConn(t);
        if (c) { setView('detail'); setSearchParams({ repo: t }, { replace: true }); fetchData(c.connectionId); }
        else if (!readOnly) { setUrl(''); setToken(''); setView('connect'); }
        else { toast.info('Sinh viên cần kết nối repo này để theo dõi commits.'); }
    };
    const handleBack = () => { setView('overview'); setSelectedRepo(null); setTab(0); setBranchFilter('all'); setAuthorFilter('all'); setSearchParams({}, { replace: true }); };
    const handleConnect = async () => {
        if (!url || !token || !selectedRepo) { toast.error('Nhập Repository URL và Token'); return; }
        try {
            setConnecting(true);
            await githubService.connect({ projectId: pid, repositoryUrl: url, accessToken: token, repoLabel: selectedRepo });
            toast.success('Kết nối thành công! Đang sync...');
            await fetchConns();
            try { setSyncing(true); const r = await githubService.sync({ projectId: pid }); toast.success(`Sync: ${r.data.data.commitsSynced} commits`); await fetchConns(); }
            catch { toast.warning('Kết nối OK nhưng sync thất bại.'); } finally { setSyncing(false); }
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
    const handleDisconnect = async () => {
        if (!activeConn) return;
        try {
            await githubService.disconnectSingle(activeConn.connectionId);
            toast.success(`Đã ngắt kết nối ${cfgData?.label || 'GitHub'}`);
            setDisconnectOpen(false); setCommits([]); setStats([]); setBranches([]);
            await fetchConns(); handleBack();
        } catch { toast.error('Không thể ngắt kết nối'); }
    };

    const handleAuthorClick = (githubLogin: string) => { setAuthorFilter(githubLogin); setBranchFilter('all'); setTab(1); };

    const timeAgo = (d: string | null) => {
        if (!d) return 'Never';
        const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
    };

    // Branch filter effect
    useEffect(() => {
        if (branchFilter === 'all') { setBranchCommits(null); return; }
        const conn = selectedRepo ? getConn(selectedRepo) : null;
        if (!conn) return;
        let cancelled = false;
        setBranchLoading(true);
        githubService.getCommitsByBranch(pid, conn.connectionId, branchFilter)
            .then(r => { if (!cancelled) setBranchCommits(r.data.data || []); })
            .catch(() => { if (!cancelled) setBranchCommits([]); })
            .finally(() => { if (!cancelled) setBranchLoading(false); });
        return () => { cancelled = true; };
    }, [branchFilter, pid, selectedRepo, connections]);

    // Derived data
    const commitsByAuthor = useMemo(() => {
        const map: Record<string, GitHubCommitResponse[]> = {};
        for (const s of stats) { map[s.githubLogin] = commits.filter(c => c.githubLogin?.toLowerCase() === s.githubLogin?.toLowerCase()); }
        return map;
    }, [commits, stats]);

    const filteredCommits = useMemo(() => {
        const source = branchFilter !== 'all' && branchCommits !== null ? branchCommits : commits;
        let r = source;
        if (authorFilter !== 'all') { r = r.filter(c => c.githubLogin?.toLowerCase() === authorFilter.toLowerCase()); }
        return r;
    }, [commits, branchCommits, branchFilter, authorFilter]);

    const mergedAuthors = useMemo(() => stats.map(s => ({ label: s.githubLogin || s.userName, value: s.githubLogin })), [stats]);
    const filteredBranches = useMemo(() => branchSearch ? branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase())) : branches, [branches, branchSearch]);
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

    // ══════════════ OVERVIEW ══════════════
    if (view === 'overview') {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: '#24292F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(36,41,47,0.3)' }}>
                        <GitHubIcon sx={{ fontSize: 30, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#1E293B">GitHub Repositories</Typography>
                        <Typography variant="body2" color="text.secondary">Chọn repository để xem commits &amp; thống kê đóng góp</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, maxWidth: 860 }}>
                    {(['FRONTEND', 'BACKEND'] as RepoType[]).map(type => {
                        const c = getConn(type);
                        const connected = !!c;
                        const rcfg = REPO_CFG[type];
                        return (
                            <Box key={type} onClick={() => handleCardClick(type)} sx={{
                                borderRadius: 4, cursor: 'pointer', bgcolor: '#fff',
                                border: connected ? `1.5px solid ${rcfg.color}30` : '1.5px dashed #CBD5E1',
                                boxShadow: connected ? `0 4px 20px ${rcfg.color}15` : '0 2px 8px rgba(0,0,0,0.05)',
                                overflow: 'hidden', transition: 'all 0.22s ease',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 36px ${rcfg.color}22`, borderColor: rcfg.color },
                            }}>
                                <Box sx={{ height: 5, background: connected ? `linear-gradient(90deg, ${rcfg.color}, ${rcfg.color}80)` : '#E2E8F0' }} />
                                <Box sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                                            background: connected ? `linear-gradient(135deg, ${rcfg.color}, ${rcfg.color}BB)` : 'linear-gradient(135deg, #CBD5E1, #E2E8F0)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: connected ? `0 4px 12px ${rcfg.color}35` : 'none',
                                            '& svg': { fontSize: 24, color: connected ? '#fff' : '#94A3B8' },
                                        }}>{rcfg.icon}</Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography fontWeight={800} fontSize="1.1rem" color="#1E293B" lineHeight={1.2}>{rcfg.label}</Typography>
                                            <Typography variant="caption" color="text.disabled">{rcfg.desc}</Typography>
                                        </Box>
                                        {connected ? (
                                            <Chip icon={<CheckCircleIcon sx={{ fontSize: '12px !important', color: '#22C55E !important' }} />} label="Connected" size="small"
                                                sx={{ height: 24, bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: '0.65rem' }} />
                                        ) : (
                                            <Chip label="Not connected" size="small" sx={{ height: 24, bgcolor: '#F8FAFC', color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem' }} />
                                        )}
                                    </Box>
                                    {connected && c ? (
                                        <>
                                            <Box sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: `${rcfg.color}08`, border: `1px solid ${rcfg.color}18`, mb: 2 }}>
                                                <Typography fontSize="0.78rem" fontWeight={600} fontFamily="'JetBrains Mono', 'Courier New', monospace" color={rcfg.color} noWrap>
                                                    {c.repositoryUrl?.replace('https://github.com/', '')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                                    <CommitIcon sx={{ fontSize: 14, color: rcfg.color }} />
                                                    <Typography variant="caption" fontWeight={700} color={rcfg.color}>{c.totalCommits} commits</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                                    <AccountTreeIcon sx={{ fontSize: 13, color: '#64748B' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{c.branchName}</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>Sync {timeAgo(c.lastSyncAt)}</Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 2.5, border: '1px dashed #E2E8F0', borderRadius: 2 }}>
                                            <Typography variant="body2" color="text.disabled" sx={{ mb: 0.5 }}>Chưa có repository nào được kết nối</Typography>
                                            <Typography variant="caption" fontWeight={700} color={rcfg.color}>+ Kết nối ngay →</Typography>
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
            <>
                <Box sx={{ p: { xs: 2, md: 3 }, overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
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
                                    {syncing && <Chip label="Syncing..." size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#D97706' }} />}
                                </Box>
                                <Typography variant="caption" color="text.secondary">{activeConn?.repositoryUrl?.replace('https://github.com/', '')} · {commits.length} commits · {branches.length} branches · {timeAgo(activeConn?.lastSyncAt || null)}</Typography>
                            </Box>
                        </Box>
                        {!readOnly && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" variant="contained" disabled={syncing} startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />} onClick={handleSync}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#238636', '&:hover': { bgcolor: '#2EA043' } }}>{syncing ? 'Syncing...' : 'Sync'}</Button>
                                <Tooltip title="Ngắt kết nối GitHub">
                                    <IconButton onClick={() => setDisconnectOpen(true)} color="error" size="small" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}><LinkOffIcon fontSize="small" /></IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 3 }}>
                        <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v !== 1) { setAuthorFilter('all'); setBranchFilter('all'); } }} sx={{
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', minHeight: 40 },
                            '& .MuiTabs-indicator': { bgcolor: accent, height: 2.5, borderRadius: 2 }
                        }}>
                            <Tab icon={<InsightsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Insights" />
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
                                    <Box>
                                        {/* Period filter */}
                                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <FilterListIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                                            <Select
                                                value={periodFilter}
                                                onChange={e => setPeriodFilter(e.target.value as any)}
                                                size="small"
                                                sx={{ minWidth: 160, borderRadius: 2, fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}
                                            >
                                                <MenuItem value="all">All</MenuItem>
                                                <MenuItem value="last_month">Last month</MenuItem>
                                                <MenuItem value="last_3_months">Last 3 months</MenuItem>
                                            </Select>
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                                            {sorted.map((s, i) => (
                                                <AuthorCard
                                                    key={s.userName + i}
                                                    stat={s}
                                                    rank={i}
                                                    commits={commitsByAuthor[s.githubLogin] || []}
                                                    onAuthorClick={handleAuthorClick}
                                                    periodFilter={periodFilter}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )
                            )}

                            {/* ═══ COMMITS ═══ */}
                            {tab === 1 && (
                                <Box>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <FilterListIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                                        <Select value={branchFilter} onChange={e => setBranchFilter(e.target.value as string)} size="small" displayEmpty
                                            sx={{ minWidth: 160, borderRadius: 2, fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}>
                                            <MenuItem value="all">All branches</MenuItem>
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

                                    {authorFilter !== 'all' && (
                                        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PeopleIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                                            <Typography fontSize="0.8rem" color="#1E40AF" fontWeight={600}>
                                                Showing commits by <strong>{stats.find(s => s.githubLogin === authorFilter)?.githubLogin || authorFilter}</strong>
                                            </Typography>
                                            <Chip label="✕ Clear" size="small" onClick={() => setAuthorFilter('all')}
                                                sx={{ ml: 'auto', height: 22, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', bgcolor: '#DBEAFE', color: '#2563EB' }} />
                                        </Box>
                                    )}

                                    {branchLoading ? (
                                        <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress size={32} /><Typography color="text.secondary" sx={{ mt: 2 }}>Loading commits for branch <strong>{branchFilter}</strong>...</Typography></Box>
                                    ) : filteredCommits.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 8 }}><CommitIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 1 }} /><Typography color="text.secondary">No commits found for these filters.</Typography></Box>
                                    ) : (
                                        <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                            {filteredCommits.slice(0, 60).map((c, i) => (
                                                <Box key={c.commitSha || i} sx={{ p: 2, borderBottom: i < Math.min(filteredCommits.length, 60) - 1 ? '1px solid #F1F5F9' : 'none', '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background 0.15s', overflow: 'hidden' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
                                                        <Box sx={{ flex: 1, width: 0, overflow: 'hidden' }}>
                                                            <Typography fontWeight={600} fontSize="0.85rem" color="#1E293B" sx={{ mb: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.commitMessage}</Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                                <Typography fontSize="0.72rem" color="text.secondary" fontWeight={600}>{c.githubLogin || c.authorName}</Typography>
                                                                {c.branchName && <Chip label={c.branchName} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, maxWidth: 150, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />}
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
                                                    <Typography fontSize="0.7rem" color="text.disabled" sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>View commits →</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                <ConfirmDialog
                    open={disconnectOpen}
                    title="Ngắt kết nối GitHub?"
                    message="Toàn bộ dữ liệu commits sẽ bị xóa khỏi TrackSpace. Action này không thể hoàn tác."
                    onConfirm={handleDisconnect}
                    onCancel={() => setDisconnectOpen(false)}
                />
            </>
        );
    }
    return null;
};

export default GitHubPage;
