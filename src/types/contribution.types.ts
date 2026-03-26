// ==================== Contribution Analytics ====================

export interface ContributionResponse {
    userId: number;
    fullName: string;
    email: string;
    role: string;

    // Code Pillar (40%)
    totalCommits: number;
    linesAdded: number;
    linesDeleted: number;
    bugFixCommits: number;
    weightedLinesAdded: number;
    codeScore: number;

    // Consistency Pillar (20%)
    activeDays: number;
    consistencyScore: number;

    // Task Pillar (40%)
    tasksAssigned: number;
    tasksCompleted: number;
    tasksInProgress: number;
    taskCompletionRate: number;
    overdueTaskCount: number;
    taskScore: number;

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
