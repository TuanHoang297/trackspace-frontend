import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import jiraService from '../api/services/jiraService';
import type { JiraConnectionResponse, JiraSprintResponse, JiraIssueResponse } from '../types/jira.types';

interface UseJiraReturn {
    connection: JiraConnectionResponse | null;
    sprints: JiraSprintResponse[];
    issues: JiraIssueResponse[];
    setIssues: React.Dispatch<React.SetStateAction<JiraIssueResponse[]>>;
    loading: boolean;
    syncing: boolean;
    error: string | null;
    refresh: () => void;
    loadLocal: () => Promise<void>;
}

export default function useJira(projectId: number): UseJiraReturn {
    const queryClient = useQueryClient();
    const [syncing, setSyncing] = useState(false);
    const [issuesOverride, setIssuesOverride] = useState<JiraIssueResponse[] | null>(null);
    const hasSynced = useRef(false);

    // ── Phase 1: Load local data FAST from DB (cached by React Query) ──
    const { data: connection = null, isLoading: connLoading } = useQuery({
        queryKey: ['jira', 'connection', projectId],
        queryFn: async () => {
            try {
                const res = await jiraService.getStatus(projectId);
                return res.data.data as JiraConnectionResponse;
            } catch {
                return null;
            }
        },
        enabled: !!projectId,
    });

    const isConnected = connection?.connectionStatus === 'CONNECTED';

    const { data: sprints = [], isLoading: sprintsLoading } = useQuery({
        queryKey: ['jira', 'sprints', projectId],
        queryFn: async () => {
            const res = await jiraService.getSprints(projectId);
            return res.data.data as JiraSprintResponse[];
        },
        enabled: !!projectId && isConnected,
        refetchInterval: 10_000, // Auto-poll DB every 30s (backend syncs Jira → DB every 30s)
    });

    const { data: fetchedIssues = [], isLoading: issuesLoading } = useQuery({
        queryKey: ['jira', 'issues', projectId],
        queryFn: async () => {
            const res = await jiraService.getIssues(projectId);
            return res.data.data as JiraIssueResponse[];
        },
        enabled: !!projectId && isConnected,
        refetchInterval: 10_000, // Auto-poll DB every 30s
    });

    // Allow optimistic updates via setIssues while keeping React Query as source of truth
    const issues = issuesOverride ?? fetchedIssues;
    const setIssues: React.Dispatch<React.SetStateAction<JiraIssueResponse[]>> = useCallback((action) => {
        setIssuesOverride(prev => {
            const current = prev ?? fetchedIssues;
            return typeof action === 'function' ? action(current) : action;
        });
    }, [fetchedIssues]);

    // ── Phase 2: Background sync from Jira API (runs AFTER UI is already showing) ──
    useQuery({
        queryKey: ['jira', 'backgroundSync', projectId],
        queryFn: async () => {
            if (!hasSynced.current && isConnected) {
                hasSynced.current = true;
                setSyncing(true);
                try {
                    await jiraService.sync({ projectId });
                    // Invalidate local data to refetch fresh
                    queryClient.invalidateQueries({ queryKey: ['jira', 'sprints', projectId] });
                    queryClient.invalidateQueries({ queryKey: ['jira', 'issues', projectId] });
                    queryClient.invalidateQueries({ queryKey: ['jira', 'connection', projectId] });
                    setIssuesOverride(null);
                } finally {
                    setSyncing(false);
                }
            }
            return null;
        },
        enabled: !!projectId && isConnected,
        staleTime: 60_000, // Only sync once per minute
    });

    const loading = connLoading || (isConnected && (sprintsLoading || issuesLoading));

    // Manual full refresh
    const refresh = useCallback(async () => {
        setSyncing(true);
        try {
            await jiraService.sync({ projectId });
            setIssuesOverride(null);
            await queryClient.invalidateQueries({ queryKey: ['jira', 'sprints', projectId] });
            await queryClient.invalidateQueries({ queryKey: ['jira', 'issues', projectId] });
            await queryClient.invalidateQueries({ queryKey: ['jira', 'connection', projectId] });
        } finally {
            setSyncing(false);
        }
    }, [projectId, queryClient]);

    // Backwards-compatible loadLocal
    const loadLocal = useCallback(async () => {
        setIssuesOverride(null);
        await queryClient.invalidateQueries({ queryKey: ['jira', 'sprints', projectId] });
        await queryClient.invalidateQueries({ queryKey: ['jira', 'issues', projectId] });
    }, [projectId, queryClient]);

    return {
        connection,
        sprints,
        issues,
        setIssues,
        loading,
        syncing,
        error: null,
        refresh,
        loadLocal,
    };
}
