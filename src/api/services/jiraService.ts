import axiosClient from '../axiosClient';
import type {
    JiraConnectionRequest,
    JiraConnectionResponse,
    JiraSyncRequest,
    JiraSprintResponse,
    JiraSprintRequest,
    JiraIssueResponse,
    JiraIssueRequest,
} from '../../types/jira.types';
import type { ApiResponse } from '../../types/auth.types';

const BASE = '/v1/jira';

const jiraService = {
    // Connection
    connect: (data: JiraConnectionRequest) =>
        axiosClient.post<ApiResponse<JiraConnectionResponse>>(`${BASE}/connect`, data),

    getStatus: (projectId: number) =>
        axiosClient.get<ApiResponse<JiraConnectionResponse>>(`${BASE}/status/${projectId}`),

    disconnect: (projectId: number) =>
        axiosClient.delete<ApiResponse<void>>(`${BASE}/disconnect/${projectId}`),

    // Sync
    sync: (data: JiraSyncRequest) =>
        axiosClient.post<ApiResponse<string>>(`${BASE}/sync`, data),

    // Sprints
    getSprints: (projectId: number) =>
        axiosClient.get<ApiResponse<JiraSprintResponse[]>>(`${BASE}/sprints/${projectId}`),

    createSprint: (data: JiraSprintRequest) =>
        axiosClient.post<ApiResponse<JiraSprintResponse>>(`${BASE}/sprints`, data),

    updateSprint: (sprintId: number, data: JiraSprintRequest) =>
        axiosClient.put<ApiResponse<JiraSprintResponse>>(`${BASE}/sprints/${sprintId}`, data),

    deleteSprint: (sprintId: number) =>
        axiosClient.delete<ApiResponse<void>>(`${BASE}/sprints/${sprintId}`),

    // Issues
    getIssues: (projectId: number, params?: { sprintId?: number; status?: string; assigneeId?: number }) =>
        axiosClient.get<ApiResponse<JiraIssueResponse[]>>(`${BASE}/issues/${projectId}`, { params }),

    createIssue: (data: JiraIssueRequest) =>
        axiosClient.post<ApiResponse<JiraIssueResponse>>(`${BASE}/issues`, data),

    updateIssue: (issueId: number, data: JiraIssueRequest) =>
        axiosClient.put<ApiResponse<JiraIssueResponse>>(`${BASE}/issues/${issueId}`, data),

    deleteIssue: (issueId: number) =>
        axiosClient.delete<ApiResponse<void>>(`${BASE}/issues/${issueId}`),

    updateStatus: (issueId: number, status: string) =>
        axiosClient.put<ApiResponse<JiraIssueResponse>>(`${BASE}/issues/${issueId}/status`, { status }),

    assignIssue: (issueId: number, jiraAccountId: string, displayName: string) =>
        axiosClient.put<ApiResponse<JiraIssueResponse>>(`${BASE}/issues/${issueId}/assign`, { jiraAccountId, displayName }),

    getAssignableUsers: (projectId: number) =>
        axiosClient.get<ApiResponse<Array<{ accountId: string; displayName: string; emailAddress: string }>>>(`${BASE}/projects/${projectId}/assignable-users`),
};

export default jiraService;

