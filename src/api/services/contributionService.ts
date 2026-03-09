import axiosClient from '../axiosClient';
import type {
    ContributionResponse,
    DashboardResponse,
    HeatmapResponse,
    IssueDetectionResponse,
} from '../../types/contribution.types';
import type { ApiResponse } from '../../types/auth.types';

const BASE = '/v1/analytics';

const contributionService = {
    getByProject: (projectId: number) =>
        axiosClient.get<ApiResponse<ContributionResponse[]>>(`${BASE}/contributions/project/${projectId}`),

    getByUser: (userId: number, projectId: number) =>
        axiosClient.get<ApiResponse<ContributionResponse>>(`${BASE}/contributions/user/${userId}`, {
            params: { projectId },
        }),

    getDashboard: (projectId: number) =>
        axiosClient.get<ApiResponse<DashboardResponse>>(`${BASE}/dashboard/${projectId}`),

    recalculate: (projectId: number, feWeight = 0.5, beWeight = 0.5) =>
        axiosClient.post<ApiResponse<ContributionResponse[]>>(`${BASE}/recalculate/${projectId}`, null, {
            params: { feWeight, beWeight },
        }),

    getHeatmap: (userId: number, projectId: number) =>
        axiosClient.get<ApiResponse<HeatmapResponse>>(`${BASE}/heatmap/${userId}`, {
            params: { projectId },
        }),

    detectIssues: (projectId: number) =>
        axiosClient.get<ApiResponse<IssueDetectionResponse>>(`${BASE}/issues/${projectId}`),
};

export default contributionService;
