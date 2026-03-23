import { useEffect } from 'react';
import syncService from '../api/services/syncService';

/**
 * Sends a heartbeat every 25s while the component is mounted,
 * so the backend scheduler knows to sync this project.
 * Call deactivate on unmount so sync stops immediately.
 */
export function useSyncHeartbeat(projectId: number | null | undefined) {
    useEffect(() => {
        if (!projectId) return;

        // Send initial heartbeat immediately
        syncService.heartbeat(projectId).catch(() => {});

        const interval = setInterval(() => {
            syncService.heartbeat(projectId).catch(() => {});
        }, 25_000);

        return () => {
            clearInterval(interval);
            syncService.deactivate(projectId).catch(() => {});
        };
    }, [projectId]);
}
