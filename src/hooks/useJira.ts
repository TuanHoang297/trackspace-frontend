import { useState, useEffect, useCallback, useRef } from 'react';
import jiraService from '../api/services/jiraService';
import type { JiraConnectionResponse, JiraSprintResponse, JiraIssueResponse } from '../types/jira.types';

interface UseJiraReturn {
    connection: JiraConnectionResponse | null;
    sprints: JiraSprintResponse[];
    issues: JiraIssueResponse[];
    setIssues: React.Dispatch<React.SetStateAction<JiraIssueResponse[]>>;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

const POLL_INTERVAL = 10_000; // Auto-refresh every 10 seconds

export default function useJira(projectId: number): UseJiraReturn {
    const [connection, setConnection] = useState<JiraConnectionResponse | null>(null);
    const [sprints, setSprints] = useState<JiraSprintResponse[]>([]);
    const [issues, setIssues] = useState<JiraIssueResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isInitialLoad = useRef(true);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        try {
            if (isInitialLoad.current) {
                setLoading(true);
            }
            setError(null);

            const connRes = await jiraService.getStatus(projectId);
            const conn = connRes.data.data;
            setConnection(conn);

            if (conn?.connectionStatus === 'CONNECTED') {
                const [sprintRes, issueRes] = await Promise.all([
                    jiraService.getSprints(projectId),
                    jiraService.getIssues(projectId),
                ]);
                setSprints(sprintRes.data.data);
                setIssues(issueRes.data.data);
            }
        } catch (err: unknown) {
            setConnection(null);
            setSprints([]);
            setIssues([]);
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [projectId]);

    // Initial fetch
    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-poll every 30s (silent refresh)
    useEffect(() => {
        const interval = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Refresh when user switches back to this tab
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [fetchData]);

    return { connection, sprints, issues, setIssues, loading, error, refresh: fetchData };
}
