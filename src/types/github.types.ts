// ==================== GitHub Integration ====================

export interface GitHubConnectionRequest {
    projectId: number;
    repositoryUrl: string;
    accessToken: string;
    branchName?: string;
    repoLabel?: string; // "FRONTEND" or "BACKEND"
}

export interface GitHubConnectionResponse {
    connectionId: number;
    projectId: number;
    repositoryUrl: string;
    branchName: string;
    connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    lastSyncAt: string | null;
    totalCommits: number;
    repoLabel: string | null;
}

export interface GitHubSyncRequest {
    projectId: number;
    since?: string;
    branch?: string;
}

export interface GitHubSyncResponse {
    commitsSynced: number;
    commitsSkipped: number;
    lastSyncAt: string;
    message: string;
}

export interface GitHubCommitResponse {
    commitId: number;
    commitSha: string;
    commitMessage: string;
    authorName: string;
    authorEmail: string;
    githubLogin: string;
    authorId: number | null;
    commitDate: string;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    branchName: string;
    linkedIssueId: number | null;
    repoLabel: string | null;
}

export interface GitHubStatsResponse {
    userId: number;
    userName: string;
    githubLogin: string;
    totalCommits: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
    totalChanges: number;
    lastCommitAt: string;
}

export interface GitHubBranchResponse {
    name: string;
    isProtected: boolean;
    lastCommitSha: string | null;
}
