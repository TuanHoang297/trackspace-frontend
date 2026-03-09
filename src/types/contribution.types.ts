// ==================== Contribution Analytics ====================

export interface ContributionResponse {
    userId: number;
    fullName: string;
    email: string;

    // GitHub Pillar (50%)
    totalCommits: number;
    linesAdded: number;
    linesDeleted: number;
    bugFixCommits: number;
    githubImpactScore: number;

    // Consistency
    activeDays: number;
    consistencyFactor: number;

    // Jira Pillar (50%)
    tasksAssigned: number;
    tasksCompleted: number;
    tasksInProgress: number;
    taskCompletionRate: number;
    reworkCount: number;
    jiraExecutionScore: number;

    // Code Churn
    codeChurnRate: number;

    // Domain
    domain: 'FRONTEND' | 'BACKEND' | 'BOTH' | 'UNKNOWN';
    smartCoderBonus: number;

    // Final
    contributionScore: number;

    // Issue Flags
    inactive: boolean;
    hasLowContribution: boolean;
    hasOverdueTasks: boolean;

    lastActivityDate: string | null;
    calculatedAt: string | null;
}

export interface DashboardResponse {
    projectId: number;
    totalMembers: number;
    totalCommits: number;
    totalLinesAdded: number;
    totalTasksAssigned: number;
    totalTasksCompleted: number;
    overallCompletionRate: number;
    issueStatusDistribution: Record<string, number>;
    memberContributions: ContributionResponse[];
    detectedAnomalies: string[];
}

export interface HeatmapEntry {
    date: string;
    commitCount: number;
    linesAdded: number;
    linesDeleted: number;
}

export interface HeatmapResponse {
    userId: number;
    fullName: string;
    projectId: number;
    entries: HeatmapEntry[];
    totalActiveDays: number;
    totalCommits: number;
    totalLinesAdded: number;
}

export interface MemberIssue {
    userId: number;
    userName: string;
    issueType: 'INACTIVE' | 'LOW_CONTRIBUTION' | 'OVERDUE_TASKS' | 'HIGH_CHURN' | 'HIGH_REWORK';
    description: string;
    currentScore: number;
}

export interface IssueDetectionResponse {
    projectId: number;
    issues: MemberIssue[];
}
