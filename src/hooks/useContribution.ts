import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import contributionService from '../api/services/contributionService';
import type { DashboardResponse, HeatmapResponse } from '../types/contribution.types';

/** React Query keys */
export const contributionKeys = {
    dashboard: (pid: number) => ['contribution', 'dashboard', pid] as const,
    heatmap: (pid: number, uid: number) => ['contribution', 'heatmap', pid, uid] as const,
};

/** Hook: fetch per-user heatmap (used inside member row) */
export function useHeatmap(userId: number, projectId: number, enabled: boolean) {
    return useQuery({
        queryKey: contributionKeys.heatmap(projectId, userId),
        queryFn: async () => {
            const res = await contributionService.getHeatmap(userId, projectId);
            return res.data.data as HeatmapResponse;
        },
        enabled,
        staleTime: 60_000,
    });
}

/** Main contribution hook */
export default function useContribution(projectId: number) {
    const queryClient = useQueryClient();
    const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

    // ── Dashboard ──
    const { data: dashboard = null, isLoading: loading, error } = useQuery({
        queryKey: contributionKeys.dashboard(projectId),
        queryFn: async () => {
            const res = await contributionService.getDashboard(projectId);
            return res.data.data as DashboardResponse;
        },
        enabled: !!projectId,
        staleTime: 30_000,
        retry: false,
    });

    // ── Recalculate ──
    const recalculateMutation = useMutation({
        mutationFn: async (feWeight: number) => {
            await contributionService.recalculate(projectId, feWeight, 1 - feWeight);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contributionKeys.dashboard(projectId) });
        },
    });

    const recalculate = useCallback(async (feWeight: number) => {
        await recalculateMutation.mutateAsync(feWeight);
    }, [recalculateMutation]);

    // ── Toggle expand ──
    const toggleUser = useCallback((userId: number) => {
        setExpandedUsers(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId); else next.add(userId);
            return next;
        });
    }, []);

    return {
        dashboard,
        loading,
        error,
        recalculating: recalculateMutation.isPending,
        recalculate,
        expandedUsers,
        toggleUser,
    };
}
