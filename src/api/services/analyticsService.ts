import axiosClient from '../axiosClient';
import type {
    ContributionResponse,
    DashboardResponse,
    HeatmapResponse,
    IssueDetectionResponse,
} from '../../types/analytics.types';
import type { ApiResponse } from '../../types/auth.types';

const BASE = '/v1/analytics';

const analyticsService = {
    /**
     * Trigger (re)calculation for a project.
     * feWeight + beWeight control domain weighting (default 0.5 / 0.5).
     */
    recalculate: (projectId: number, feWeight = 0.5, beWeight = 0.5) =>
        axiosClient.post<ApiResponse<ContributionResponse[]>>(
            `${BASE}/recalculate/${projectId}`,
            null,
            { params: { feWeight, beWeight } },
        ),

    /** All members' scores for a project, sorted by contributionScore desc. */
    getByProject: (projectId: number) =>
        axiosClient.get<ApiResponse<ContributionResponse[]>>(
            `${BASE}/contributions/project/${projectId}`,
        ),

    /** Single member's score. */
    getByUser: (projectId: number, userId: number) =>
        axiosClient.get<ApiResponse<ContributionResponse>>(
            `${BASE}/contributions/user/${userId}`,
            { params: { projectId } },
        ),

    /** Full project dashboard with aggregates. */
    getDashboard: (projectId: number) =>
        axiosClient.get<ApiResponse<DashboardResponse>>(
            `${BASE}/dashboard/${projectId}`,
        ),

    /** Activity heatmap for one user. */
    getHeatmap: (projectId: number, userId: number) =>
        axiosClient.get<ApiResponse<HeatmapResponse>>(
            `${BASE}/heatmap/${userId}`,
            { params: { projectId } },
        ),

    /** Detected anomalies / issues for the project. */
    detectIssues: (projectId: number) =>
        axiosClient.get<ApiResponse<IssueDetectionResponse>>(
            `${BASE}/issues/${projectId}`,
        ),
};

export default analyticsService;
