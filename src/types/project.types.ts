// ==================== Project ====================

export interface ProjectResponse {
    id: number;
    projectName: string;
    groupId: number;
    groupName: string;
    classId: number;
    className: string;
    hasProjectInfo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectRequest {
    projectName: string;
}

export interface UpdateProjectRequest {
    projectName: string;
}

export interface ProjectInfoResponse {
    id: number;
    projectId: number;
    projectName: string;
    topic: string | null;
    context: string | null;
    problems: string | null;
    primaryActors: string | null;
    functionalRequirements: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectInfoRequest {
    topic?: string;
    context?: string;
    problems?: string;
    primaryActors?: string;
    functionalRequirements?: string;
}
