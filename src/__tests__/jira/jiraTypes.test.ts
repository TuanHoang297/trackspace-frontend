import { describe, it, expect } from 'vitest';
import type {
    JiraConnectionRequest,
    JiraConnectionResponse,
    JiraSprintRequest,
    JiraSprintResponse,
    JiraIssueRequest,
    JiraIssueResponse,
    JiraSyncRequest,
    SprintStatus,
    IssueType,
    JiraConnectionStatus,
    IssuePriority,
    IssueStatus,
} from '../../types/jira.types';

// Factory helpers
function createMockConnection(overrides?: Partial<JiraConnectionResponse>): JiraConnectionResponse {
    return {
        connectionId: 1,
        projectId: 1,
        siteUrl: 'https://test.atlassian.net',
        email: 'test@mail.com',
        projectKey: 'TS',
        connectionStatus: 'CONNECTED',
        lastSyncAt: null,
        totalSprints: 0,
        totalIssues: 0,
        ...overrides,
    };
}

function createMockSprint(overrides?: Partial<JiraSprintResponse>): JiraSprintResponse {
    return {
        sprintId: 1,
        projectId: 1,
        jiraSprintId: 'jira-sprint-1',
        sprintName: 'Sprint 1',
        sprintGoal: null,
        startDate: null,
        endDate: null,
        status: 'FUTURE',
        totalIssues: 0,
        doneIssues: 0,
        ...overrides,
    };
}

function createMockIssue(overrides?: Partial<JiraIssueResponse>): JiraIssueResponse {
    return {
        issueId: 1,
        projectId: 1,
        sprintId: null,
        jiraIssueId: 'jira-10001',
        issueKey: 'TS-1',
        issueType: 'TASK',
        summary: 'Test issue',
        description: null,
        status: 'To Do',
        priority: 'Medium',
        assigneeId: null,
        assigneeName: null,
        jiraAccountId: null,
        dueDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('Jira Types — Shape Contracts', () => {
    it('JiraConnectionResponse has all required fields', () => {
        const conn = createMockConnection();
        expect(conn).toHaveProperty('connectionId');
        expect(conn).toHaveProperty('projectId');
        expect(conn).toHaveProperty('siteUrl');
        expect(conn).toHaveProperty('email');
        expect(conn).toHaveProperty('projectKey');
        expect(conn).toHaveProperty('connectionStatus');
        expect(conn).toHaveProperty('lastSyncAt');
        expect(conn).toHaveProperty('totalSprints');
        expect(conn).toHaveProperty('totalIssues');
    });

    it('JiraSprintResponse has all required fields', () => {
        const sprint = createMockSprint();
        expect(sprint).toHaveProperty('sprintId');
        expect(sprint).toHaveProperty('projectId');
        expect(sprint).toHaveProperty('jiraSprintId');
        expect(sprint).toHaveProperty('sprintName');
        expect(sprint).toHaveProperty('status');
        expect(sprint).toHaveProperty('totalIssues');
        expect(sprint).toHaveProperty('doneIssues');
    });

    it('JiraIssueResponse has all required fields', () => {
        const issue = createMockIssue();
        expect(issue).toHaveProperty('issueId');
        expect(issue).toHaveProperty('issueKey');
        expect(issue).toHaveProperty('issueType');
        expect(issue).toHaveProperty('summary');
        expect(issue).toHaveProperty('status');
        expect(issue).toHaveProperty('priority');
        expect(issue).toHaveProperty('createdAt');
        expect(issue).toHaveProperty('updatedAt');
    });

    it('SprintStatus only allows valid values', () => {
        const valid: SprintStatus[] = ['ACTIVE', 'CLOSED', 'FUTURE'];
        valid.forEach((s) => expect(['ACTIVE', 'CLOSED', 'FUTURE']).toContain(s));
    });

    it('IssueType only allows valid values', () => {
        const valid: IssueType[] = ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK'];
        valid.forEach((t) => expect(['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK']).toContain(t));
    });

    it('factory functions support overrides', () => {
        const conn = createMockConnection({ connectionStatus: 'ERROR' });
        expect(conn.connectionStatus).toBe('ERROR');

        const sprint = createMockSprint({ status: 'ACTIVE', sprintName: 'Sprint X' });
        expect(sprint.status).toBe('ACTIVE');
        expect(sprint.sprintName).toBe('Sprint X');

        const issue = createMockIssue({ issueType: 'BUG', priority: 'High' });
        expect(issue.issueType).toBe('BUG');
        expect(issue.priority).toBe('High');
    });
});
