import axiosClient from '../axiosClient';
import type {
    GitHubConnectionRequest,
    GitHubConnectionResponse,
    GitHubSyncRequest,
    GitHubSyncResponse,
    GitHubCommitResponse,
    GitHubStatsResponse,
    GitHubBranchResponse,
} from '../../types/github.types';
import type { ApiResponse } from '../../types/auth.types';

const BASE = '/v1/github';

const githubService = {
    // Connection
    connect: (data: GitHubConnectionRequest) =>
        axiosClient.post<ApiResponse<GitHubConnectionResponse>>(`${BASE}/connect`, data),

    getStatus: (projectId: number) =>
        axiosClient.get<ApiResponse<GitHubConnectionResponse>>(`${BASE}/status/${projectId}`),

    disconnect: (projectId: number) =>
        axiosClient.delete<ApiResponse<void>>(`${BASE}/disconnect/${projectId}`),

    disconnectSingle: (connectionId: number) =>
        axiosClient.delete<ApiResponse<void>>(`${BASE}/disconnect/connection/${connectionId}`),

    // Sync
    sync: (data: GitHubSyncRequest) =>
        axiosClient.post<ApiResponse<GitHubSyncResponse>>(`${BASE}/sync`, data),

    // Commits
    getCommits: (projectId: number, params?: { connectionId?: number; userId?: number; since?: string; until?: string; branch?: string }) =>
        axiosClient.get<ApiResponse<GitHubCommitResponse[]>>(`${BASE}/commits/${projectId}`, { params }),

    // Stats
    getStats: (projectId: number, params?: { connectionId?: number; userId?: number }) =>
        axiosClient.get<ApiResponse<GitHubStatsResponse[]>>(`${BASE}/stats/${projectId}`, { params }),

    // Branches
    getBranches: (projectId: number) =>
        axiosClient.get<ApiResponse<GitHubBranchResponse[]>>(`${BASE}/branches/${projectId}`),

    // All connections (multi-repo)
    getConnections: (projectId: number) =>
        axiosClient.get<ApiResponse<GitHubConnectionResponse[]>>(`${BASE}/connections/${projectId}`),
};

export default githubService;
