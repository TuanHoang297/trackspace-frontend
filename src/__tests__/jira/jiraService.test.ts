import { describe, it, expect, vi, beforeEach } from 'vitest';
import jiraService from '../../api/services/jiraService';
import axiosClient from '../../api/axiosClient';
import type {
    JiraConnectionRequest,
    JiraIssueRequest,
    JiraSprintRequest,
    JiraSyncRequest,
} from '../../types/jira.types';

vi.mock('../../api/axiosClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockAxios = axiosClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

describe('jiraService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Connection ──

    it('connect - POST /v1/jira/connect', async () => {
        const data: JiraConnectionRequest = {
            projectId: 1,
            siteUrl: 'https://test.atlassian.net',
            email: 'test@mail.com',
            apiToken: 'token-123',
            projectKey: 'TS',
        };
        mockAxios.post.mockResolvedValueOnce({ data: { data: { connectionId: 1 } } });

        await jiraService.connect(data);

        expect(mockAxios.post).toHaveBeenCalledWith('/v1/jira/connect', data);
    });

    it('getStatus - GET /v1/jira/status/:projectId', async () => {
        mockAxios.get.mockResolvedValueOnce({ data: { data: { connectionStatus: 'CONNECTED' } } });

        await jiraService.getStatus(1);

        expect(mockAxios.get).toHaveBeenCalledWith('/v1/jira/status/1');
    });

    it('disconnect - DELETE /v1/jira/disconnect/:projectId', async () => {
        mockAxios.delete.mockResolvedValueOnce({ data: { data: null } });

        await jiraService.disconnect(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/v1/jira/disconnect/1');
    });

    // ── Sync ──

    it('sync - POST /v1/jira/sync', async () => {
        const data: JiraSyncRequest = { projectId: 1 };
        mockAxios.post.mockResolvedValueOnce({ data: { data: 'ok' } });

        await jiraService.sync(data);

        expect(mockAxios.post).toHaveBeenCalledWith('/v1/jira/sync', data);
    });

    // ── Sprints ──

    it('getSprints - GET /v1/jira/sprints/:projectId', async () => {
        mockAxios.get.mockResolvedValueOnce({ data: { data: [] } });

        await jiraService.getSprints(1);

        expect(mockAxios.get).toHaveBeenCalledWith('/v1/jira/sprints/1');
    });

    it('createSprint - POST /v1/jira/sprints', async () => {
        const data: JiraSprintRequest = { projectId: 1, name: 'Sprint 1' };
        mockAxios.post.mockResolvedValueOnce({ data: { data: { sprintId: 1 } } });

        await jiraService.createSprint(data);

        expect(mockAxios.post).toHaveBeenCalledWith('/v1/jira/sprints', data);
    });

    it('updateSprint - PUT /v1/jira/sprints/:id', async () => {
        const data: JiraSprintRequest = { projectId: 1, name: 'Sprint 1 Updated' };
        mockAxios.put.mockResolvedValueOnce({ data: { data: { sprintId: 5 } } });

        await jiraService.updateSprint(5, data);

        expect(mockAxios.put).toHaveBeenCalledWith('/v1/jira/sprints/5', data);
    });

    it('deleteSprint - DELETE /v1/jira/sprints/:id', async () => {
        mockAxios.delete.mockResolvedValueOnce({ data: { data: null } });

        await jiraService.deleteSprint(5);

        expect(mockAxios.delete).toHaveBeenCalledWith('/v1/jira/sprints/5');
    });

    // ── Issues ──

    it('getIssues - GET /v1/jira/issues/:projectId', async () => {
        mockAxios.get.mockResolvedValueOnce({ data: { data: [] } });

        await jiraService.getIssues(1);

        expect(mockAxios.get).toHaveBeenCalledWith('/v1/jira/issues/1', { params: undefined });
    });

    it('getIssues with filters - passes params correctly', async () => {
        const params = { sprintId: 2, status: 'To Do' };
        mockAxios.get.mockResolvedValueOnce({ data: { data: [] } });

        await jiraService.getIssues(1, params);

        expect(mockAxios.get).toHaveBeenCalledWith('/v1/jira/issues/1', { params });
    });

    it('createIssue - POST /v1/jira/issues', async () => {
        const data: JiraIssueRequest = {
            projectId: 1,
            issueType: 'TASK',
            summary: 'Test issue',
        };
        mockAxios.post.mockResolvedValueOnce({ data: { data: { issueId: 10 } } });

        await jiraService.createIssue(data);

        expect(mockAxios.post).toHaveBeenCalledWith('/v1/jira/issues', data);
    });

    it('updateIssue - PUT /v1/jira/issues/:id', async () => {
        const data: JiraIssueRequest = {
            projectId: 1,
            issueType: 'BUG',
            summary: 'Updated summary',
        };
        mockAxios.put.mockResolvedValueOnce({ data: { data: { issueId: 10 } } });

        await jiraService.updateIssue(10, data);

        expect(mockAxios.put).toHaveBeenCalledWith('/v1/jira/issues/10', data);
    });

    it('deleteIssue - DELETE /v1/jira/issues/:id', async () => {
        mockAxios.delete.mockResolvedValueOnce({ data: { data: null } });

        await jiraService.deleteIssue(10);

        expect(mockAxios.delete).toHaveBeenCalledWith('/v1/jira/issues/10');
    });

    it('updateStatus - PUT /v1/jira/issues/:id/status', async () => {
        mockAxios.put.mockResolvedValueOnce({ data: { data: { status: 'Done' } } });

        await jiraService.updateStatus(10, 'Done');

        expect(mockAxios.put).toHaveBeenCalledWith('/v1/jira/issues/10/status', { status: 'Done' });
    });

    it('assignIssue - PUT /v1/jira/issues/:id/assign', async () => {
        mockAxios.put.mockResolvedValueOnce({ data: { data: {} } });

        await jiraService.assignIssue(10, 'acc-123', 'User Name');

        expect(mockAxios.put).toHaveBeenCalledWith('/v1/jira/issues/10/assign', {
            jiraAccountId: 'acc-123',
            displayName: 'User Name',
        });
    });

    it('getAssignableUsers - GET /v1/jira/projects/:id/assignable-users', async () => {
        mockAxios.get.mockResolvedValueOnce({ data: { data: [] } });

        await jiraService.getAssignableUsers(1);

        expect(mockAxios.get).toHaveBeenCalledWith('/v1/jira/projects/1/assignable-users');
    });
});
