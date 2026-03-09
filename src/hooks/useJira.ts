import { useState, useEffect, useCallback, useRef } from 'react';
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
}

export default function useJira(projectId: number): UseJiraReturn {
    const [connection, setConnection] = useState<JiraConnectionResponse | null>(null);
    const [sprints, setSprints] = useState<JiraSprintResponse[]>([]);
    const [issues, setIssues] = useState<JiraIssueResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasSynced = useRef(false);

    // Load local data from DB (fast)
    const loadLocal = useCallback(async () => {
        if (!projectId) return;
        try {
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
        } catch {
            setConnection(null);
            setSprints([]);
            setIssues([]);
        }
    }, [projectId]);

    // Sync from Jira API then reload local data
    const syncFromJira = useCallback(async () => {
        if (!projectId) return;
        setSyncing(true);
        try {
            await jiraService.sync({ projectId });
            await loadLocal();
        } catch {
            // Sync failure is non-blocking
        } finally {
            setSyncing(false);
        }
    }, [projectId, loadLocal]);

    // On mount: load local data first (fast), then sync from Jira in background
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setError(null);
            await loadLocal();
            setLoading(false);

            // Background sync on first load
            if (!hasSynced.current) {
                hasSynced.current = true;
                syncFromJira();
            }
        };
        init();
    }, [loadLocal, syncFromJira]);

    // Manual refresh = sync from Jira + reload
    const refresh = useCallback(async () => {
        await syncFromJira();
    }, [syncFromJira]);

    return { connection, sprints, issues, setIssues, loading, syncing, error, refresh };
}
