// =============================================
// Jira Integration Types
// =============================================

// Enums matching BE
export type SprintStatus = 'ACTIVE' | 'CLOSED' | 'FUTURE';
export type IssueType = 'EPIC' | 'STORY' | 'TASK' | 'BUG' | 'SUBTASK';
export type JiraConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
export type IssuePriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
export type IssueStatus = 'To Do' | 'In Progress' | 'Done';

// --- Requests ---

export interface JiraConnectionRequest {
    projectId: number;
    siteUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
}

export interface JiraSyncRequest {
    projectId: number;
}

export interface JiraIssueRequest {
    projectId: number;
    sprintId?: number;
    issueType: string;
    summary: string;
    description?: string;
    priority?: string;
    assigneeId?: number;
    dueDate?: string; // ISO date
}

export interface JiraSprintRequest {
    projectId: number;
    name: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
    status?: SprintStatus;
}

// --- Responses ---

export interface JiraConnectionResponse {
    connectionId: number;
    projectId: number;
    siteUrl: string;
    email: string;
    projectKey: string;
    connectionStatus: JiraConnectionStatus;
    lastSyncAt: string | null;
    totalSprints: number;
    totalIssues: number;
}

export interface JiraSprintResponse {
    sprintId: number;
    projectId: number;
    jiraSprintId: string;
    sprintName: string;
    sprintGoal: string | null;
    startDate: string | null;
    endDate: string | null;
    status: SprintStatus;
    totalIssues: number;
    doneIssues: number;
}

export interface JiraIssueResponse {
    issueId: number;
    projectId: number;
    sprintId: number | null;
    jiraIssueId: string;
    issueKey: string;
    issueType: IssueType;
    summary: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: number | null;
    assigneeName: string | null;
    jiraAccountId: string | null;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
}
