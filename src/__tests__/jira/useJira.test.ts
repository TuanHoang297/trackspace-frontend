import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useJira from '../../hooks/useJira';
import jiraService from '../../api/services/jiraService';

vi.mock('../../api/services/jiraService', () => ({
    default: {
        getStatus: vi.fn(),
        getSprints: vi.fn(),
        getIssues: vi.fn(),
    },
}));

const mockJiraService = jiraService as unknown as {
    getStatus: ReturnType<typeof vi.fn>;
    getSprints: ReturnType<typeof vi.fn>;
    getIssues: ReturnType<typeof vi.fn>;
};

const connectedResponse = {
    data: {
        data: {
            connectionId: 1,
            projectId: 1,
            connectionStatus: 'CONNECTED',
            siteUrl: 'https://test.atlassian.net',
            email: 'a@b.com',
            projectKey: 'TS',
            lastSyncAt: null,
            totalSprints: 2,
            totalIssues: 5,
        },
    },
};

const disconnectedResponse = {
    data: {
        data: {
            connectionId: 1,
            projectId: 1,
            connectionStatus: 'DISCONNECTED',
            siteUrl: '',
            email: '',
            projectKey: '',
            lastSyncAt: null,
            totalSprints: 0,
            totalIssues: 0,
        },
    },
};

const sprintsResponse = {
    data: {
        data: [
            { sprintId: 1, sprintName: 'Sprint 1', status: 'ACTIVE' },
            { sprintId: 2, sprintName: 'Sprint 2', status: 'FUTURE' },
        ],
    },
};

const issuesResponse = {
    data: {
        data: [
            { issueId: 1, summary: 'Issue 1', issueType: 'TASK', status: 'To Do' },
            { issueId: 2, summary: 'Issue 2', issueType: 'BUG', status: 'In Progress' },
        ],
    },
};

describe('useJira', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches connection, sprints, and issues on mount', async () => {
        mockJiraService.getStatus.mockResolvedValue(connectedResponse);
        mockJiraService.getSprints.mockResolvedValue(sprintsResponse);
        mockJiraService.getIssues.mockResolvedValue(issuesResponse);

        const { result } = renderHook(() => useJira(1));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.connection?.connectionStatus).toBe('CONNECTED');
        expect(result.current.sprints).toHaveLength(2);
        expect(result.current.issues).toHaveLength(2);
        expect(mockJiraService.getStatus).toHaveBeenCalledWith(1);
        expect(mockJiraService.getSprints).toHaveBeenCalledWith(1);
        expect(mockJiraService.getIssues).toHaveBeenCalledWith(1);
    });

    it('starts with loading true, then sets to false after fetch', async () => {
        mockJiraService.getStatus.mockResolvedValue(connectedResponse);
        mockJiraService.getSprints.mockResolvedValue(sprintsResponse);
        mockJiraService.getIssues.mockResolvedValue(issuesResponse);

        const { result } = renderHook(() => useJira(1));

        // Initially loading
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('does NOT fetch sprints/issues when not CONNECTED', async () => {
        mockJiraService.getStatus.mockResolvedValue(disconnectedResponse);

        const { result } = renderHook(() => useJira(1));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.connection?.connectionStatus).toBe('DISCONNECTED');
        expect(result.current.sprints).toHaveLength(0);
        expect(result.current.issues).toHaveLength(0);
        expect(mockJiraService.getSprints).not.toHaveBeenCalled();
        expect(mockJiraService.getIssues).not.toHaveBeenCalled();
    });

    it('resets state when fetch fails', async () => {
        mockJiraService.getStatus.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useJira(1));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.connection).toBeNull();
        expect(result.current.sprints).toHaveLength(0);
        expect(result.current.issues).toHaveLength(0);
    });

    it('refresh() re-fetches data', async () => {
        mockJiraService.getStatus.mockResolvedValue(connectedResponse);
        mockJiraService.getSprints.mockResolvedValue(sprintsResponse);
        mockJiraService.getIssues.mockResolvedValue(issuesResponse);

        const { result } = renderHook(() => useJira(1));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const callsBefore = mockJiraService.getStatus.mock.calls.length;

        // Call refresh manually
        await act(async () => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(mockJiraService.getStatus.mock.calls.length).toBeGreaterThan(callsBefore);
        });
    });
});
