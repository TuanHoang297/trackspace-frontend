import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Button, TextField, Tabs, Tab, Chip,
    CircularProgress, Skeleton, IconButton, Avatar, Tooltip, MenuItem, Select,
    InputAdornment,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SyncIcon from '@mui/icons-material/Sync';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
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
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
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


const RANK_GRADIENTS = [
    'linear-gradient(135deg, #F59E0B, #EAB308)',
    'linear-gradient(135deg, #94A3B8, #CBD5E1)',
    'linear-gradient(135deg, #D97706, #B45309)',
];

// ── Activity Chart — modern area chart with gradient fill ──
const CHART_H = 110;
const ActivityChart: React.FC<{ commits: GitHubCommitResponse[]; color: string }> = ({ commits, color }) => {
    const chartId = useMemo(() => `area-${Math.random().toString(36).slice(2, 8)}`, []);
    const data = useMemo(() => {
        const dates = commits.map(c => c.commitDate ? new Date(c.commitDate).getTime() : 0).filter(Boolean);
        const latestTs = dates.length > 0 ? Math.max(...dates) : Date.now();
        const latest = new Date(latestTs);
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
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return { count, label: dayNames[idx] };
        });
    }, [commits]);
    const max = Math.max(...data.map(d => d.count), 1);
    const W = 400, H = CHART_H, PAD_L = 16, PAD_R = 16, PAD_T = 22, PAD_B = 20;
    const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
    const points = data.map((d, i) => ({
        x: PAD_L + (i / (data.length - 1)) * innerW,
        y: PAD_T + innerH - (d.count / max) * innerH,
    }));
    // Smooth cubic bezier path
    const linePath = points.reduce((path, p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `${path} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    }, '');
    const areaPath = `${linePath} L${points[points.length - 1].x},${PAD_T + innerH} L${points[0].x},${PAD_T + innerH} Z`;
    const totalCommits = data.reduce((s, d) => s + d.count, 0);
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography fontSize="0.7rem" fontWeight={600} color="#94A3B8" sx={{ letterSpacing: '0.04em' }}>ACTIVITY</Typography>
                <Typography fontSize="0.7rem" fontWeight={700} sx={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{totalCommits} commits</Typography>
            </Box>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: CHART_H, display: 'block' }}>
                <defs>
                    <linearGradient id={`${chartId}-fill`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                    </linearGradient>
                    <filter id={`${chartId}-glow`}>
                        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.4" />
                    </filter>
                    <style>{`
                        .chart-dot-group:hover .chart-label { opacity: 1 !important; }
                        .chart-dot-group:hover .chart-dot { r: 7; stroke-width: 2.5; }
                    `}</style>
                </defs>
                {/* Background */}
                <rect x={0} y={PAD_T} width={W} height={innerH} fill="#FAFBFC" />
                <rect x={0} y={PAD_T} width={W} height={innerH} fill="none" stroke="#E2E8F0" strokeWidth={0.5} />
                {/* Horizontal grid lines with labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => (
                    <g key={`h${p}`}>
                        <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH * (1 - p)} y2={PAD_T + innerH * (1 - p)}
                            stroke={p === 0 ? '#CBD5E1' : '#E8ECF0'} strokeWidth={p === 0 ? 1 : 0.6} strokeDasharray={p === 0 ? 'none' : '4,3'} />
                    </g>
                ))}
                {/* Vertical grid lines at each day */}
                {points.map((p, i) => (
                    <line key={`v${i}`} x1={p.x} x2={p.x} y1={PAD_T} y2={PAD_T + innerH}
                        stroke="#EDF0F4" strokeWidth={0.5} strokeDasharray="3,4" />
                ))}
                {/* Area fill */}
                <path d={areaPath} fill={`url(#${chartId}-fill)`} />
                {/* Line */}
                <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                    filter={`url(#${chartId}-glow)`} />
                {/* Dots */}
                {points.map((p, i) => (
                    <g key={i} className="chart-dot-group" style={{ cursor: data[i].count > 0 ? 'pointer' : 'default' }}>
                        {data[i].count > 0 && <>
                            {/* Hover hit area */}
                            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                            {/* Dot with glow */}
                            <circle className="chart-dot" cx={p.x} cy={p.y} r={5} fill="#fff" stroke={color} strokeWidth={2}
                                style={{ transition: 'r 0.15s ease, stroke-width 0.15s ease' }} />
                            <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
                            {/* Pill badge label - hidden by default */}
                            <g className="chart-label" style={{ opacity: 0, transition: 'opacity 0.2s ease', pointerEvents: 'none' }}>
                                <rect x={p.x - 14} y={p.y - 24} width={28} height={17} rx={8.5} fill="#fff"
                                    stroke={color} strokeWidth={1} />
                                <text x={p.x} y={p.y - 12.5} textAnchor="middle" fontSize={10} fill={color}
                                    fontFamily="JetBrains Mono, monospace" fontWeight={800}>
                                    {data[i].count}
                                </text>
                            </g>
                        </>}
                        {/* Day label */}
                        <text x={p.x} y={H - 4} textAnchor="middle" fontSize={10} fill="#475569"
                            fontFamily="Inter, sans-serif" fontWeight={600}>
                            {data[i].label}
                        </text>
                    </g>
                ))}
            </svg>
        </Box>
    );
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
            // Deduplicate commits by SHA (DB may have duplicates from overlapping syncs)
            const raw = c.data.data || [];
            const seen = new Set<string>();
            const unique = raw.filter(cm => { if (seen.has(cm.commitSha)) return false; seen.add(cm.commitSha); return true; });
            setCommits(unique); setStats(s.data.data || []); setBranches(b.data.data || []);
        } catch { /* silent */ } finally { setLoadingData(false); }
    }, [pid]);

    // Auto-navigate to detail if URL has ?repo=X (runs once when connections load)
    if (!loading && connections.length > 0 && initialRepo && !initDone.current) {
        initDone.current = true;
        const conn = connections.find(c => c.repoLabel === initialRepo && c.connectionStatus === 'CONNECTED');
        if (conn) {
            setView('detail');
            fetchData(conn.connectionId);
        } else {
            setView('overview');
            setSelectedRepo(null);
            setSearchParams({}, { replace: true });
        }
    }

    // ── Background sync from GitHub (runs once per mount, 60s stale) ──
    useQuery({
        queryKey: ['github', 'backgroundSync', pid],
        queryFn: async () => {
            setSyncing(true);
            try {
                await githubService.sync({ projectId: pid });
                await queryClient.invalidateQueries({ queryKey: ['github', 'connections', pid] });
            } catch { /* sync failure is non-blocking */ }
            finally { setSyncing(false); }
            return null;
        },
        enabled: !!pid && connections.length > 0,
        staleTime: 60_000,
    });

    const handleCardClick = (t: RepoType) => {
        setSelectedRepo(t);
        const c = getConn(t);
        if (c) {
            setView('detail');
            setSearchParams({ repo: t }, { replace: true });
            fetchData(c.connectionId);
        } else if (!readOnly) {
            setUrl('');
            setToken('');
            setView('connect');
        } else {
            toast.info('Sinh viên cần kết nối repo này để theo dõi commits.');
        }
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

    const handleDisconnect = async () => {
        if (!activeConn) return;
        try {
            await githubService.disconnectSingle(activeConn.connectionId);
            toast.success(`Đã ngắt kết nối ${cfgData?.label || 'GitHub'}`);
            setDisconnectOpen(false);
            setCommits([]);
            setStats([]);
            setBranches([]);
            await fetchConns();
            handleBack();
        } catch {
            toast.error('Không thể ngắt kết nối');
        }
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

    // Fetch commits from GitHub API when branch filter changes
    useEffect(() => {
        if (branchFilter === 'all') {
            setBranchCommits(null); // Use default DB commits
            return;
        }
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

    // Filtered commits — use branchCommits (from API) when branch is selected, otherwise DB commits
    const filteredCommits = useMemo(() => {
        const source = branchFilter !== 'all' && branchCommits !== null ? branchCommits : commits;
        let r = source;
        if (authorFilter !== 'all') {
            r = r.filter(c => c.githubLogin?.toLowerCase() === authorFilter.toLowerCase());
        }
        return r;
    }, [commits, branchCommits, branchFilter, authorFilter]);

    // Only show merged author names (from stats) in the filter — value is githubLogin
    const mergedAuthors = useMemo(() => stats.map(s => ({ label: s.githubLogin || s.userName, value: s.githubLogin })), [stats]);
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
                                    <IconButton onClick={() => setDisconnectOpen(true)} color="error" size="small"
                                        sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <LinkOffIcon fontSize="small" />
                                    </IconButton>
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
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                                        {sorted.map((s, i) => {
                                            const authorCommits = commitsByAuthor[s.githubLogin] || [];
                                            const avatarColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                                            const ac = avatarColors[i % avatarColors.length];
                                            return (
                                                <Box key={s.userName + i} sx={{
                                                    borderRadius: 4, overflow: 'hidden', bgcolor: '#fff',
                                                    border: '1px solid rgba(226,232,240,0.6)',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                                    '&:hover': {
                                                        boxShadow: '0 12px 40px rgba(15,23,42,0.12)',
                                                        transform: 'translateY(-4px)',
                                                        borderColor: 'rgba(99,102,241,0.3)',
                                                    }
                                                }}>
                                                    {/* Dark navy header */}
                                                    <Box sx={{
                                                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                                        px: 2.5, py: 2.5,
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        position: 'relative',
                                                        '&::after': {
                                                            content: '""', position: 'absolute',
                                                            bottom: 0, left: 0, right: 0, height: 1,
                                                            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
                                                        }
                                                    }}>
                                                        <Avatar sx={{
                                                            width: 44, height: 44,
                                                            bgcolor: ac + '20', color: ac,
                                                            fontWeight: 800, fontSize: 15,
                                                            border: `2px solid ${ac}60`,
                                                            boxShadow: `0 0 12px ${ac}25`,
                                                        }}>
                                                            {getInitials(s.githubLogin || s.userName)}
                                                        </Avatar>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography fontWeight={800} fontSize="0.92rem" color="#F1F5F9" noWrap
                                                                sx={{ fontFamily: "'Inter', sans-serif" }}>
                                                                {s.githubLogin || s.userName}
                                                            </Typography>
                                                            <Typography fontSize="0.68rem" color="rgba(148,163,184,0.7)" fontWeight={500}>
                                                                {s.totalCommits} commits · {(s.totalLinesAdded || 0).toLocaleString()} lines
                                                            </Typography>
                                                        </Box>
                                                        {i < 3 ? (
                                                            <Box sx={{
                                                                width: 32, height: 32, borderRadius: 2,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: RANK_GRADIENTS[i],
                                                                boxShadow: `0 2px 10px ${i === 0 ? 'rgba(245,158,11,0.4)' : i === 1 ? 'rgba(148,163,184,0.3)' : 'rgba(217,119,6,0.3)'}`,
                                                            }}>
                                                                <EmojiEventsIcon sx={{ fontSize: 17, color: '#fff' }} />
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{
                                                                width: 30, height: 30, borderRadius: 2,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                bgcolor: 'rgba(148,163,184,0.1)',
                                                                border: '1.5px solid rgba(148,163,184,0.2)',
                                                            }}>
                                                                <Typography fontWeight={800} fontSize="0.72rem" color="rgba(148,163,184,0.8)"
                                                                    sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    #{i + 1}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    {/* Stats row with dividers */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        borderBottom: '1px solid #E2E8F0',
                                                    }}>
                                                        <Tooltip title="Click xem commits" arrow>
                                                            <Box onClick={() => handleAuthorClick(s.githubLogin)} sx={{
                                                                flex: 1, textAlign: 'center', cursor: 'pointer',
                                                                py: 2, borderRight: '1px solid #E2E8F0',
                                                                transition: 'background 0.15s',
                                                                '&:hover': { bgcolor: '#F8FAFC' },
                                                            }}>
                                                                <Typography fontWeight={800} fontSize="1.15rem" color="#1E293B"
                                                                    fontFamily="'JetBrains Mono', monospace">{s.totalCommits}</Typography>
                                                                <Typography fontSize="0.6rem" color="#94A3B8" fontWeight={700}
                                                                    sx={{ letterSpacing: '0.08em' }}>COMMITS</Typography>
                                                            </Box>
                                                        </Tooltip>
                                                        <Box sx={{ flex: 1, textAlign: 'center', py: 2, borderRight: '1px solid #E2E8F0' }}>
                                                            <Typography fontWeight={800} fontSize="1.15rem" color="#16A34A"
                                                                fontFamily="'JetBrains Mono', monospace">+{(s.totalLinesAdded || 0).toLocaleString()}</Typography>
                                                            <Typography fontSize="0.6rem" color="#94A3B8" fontWeight={700}
                                                                sx={{ letterSpacing: '0.08em' }}>ADDED</Typography>
                                                        </Box>
                                                        <Box sx={{ flex: 1, textAlign: 'center', py: 2 }}>
                                                            <Typography fontWeight={800} fontSize="1.15rem" color="#DC2626"
                                                                fontFamily="'JetBrains Mono', monospace">-{(s.totalLinesDeleted || 0).toLocaleString()}</Typography>
                                                            <Typography fontSize="0.6rem" color="#94A3B8" fontWeight={700}
                                                                sx={{ letterSpacing: '0.08em' }}>DELETED</Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Activity chart */}
                                                    <Box sx={{ px: 1, pt: 1.5, pb: 0.5 }}>
                                                        <ActivityChart commits={authorCommits} color={ac} />
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
                </Box >

                {/* Disconnect Confirm Dialog */}
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
