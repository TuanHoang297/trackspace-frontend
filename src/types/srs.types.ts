export interface SrsDocumentResponse {
    id: number;
    versionNumber: number;
    title: string;
    content: string;
    generatedByAi: boolean;
    projectId: number;
    createdByName: string;
    updatedAt: string;
}

export interface SrsGenerateRequest {
    projectId: number;
}

export interface SrsUpdateRequest {
    title?: string;
    content: string;
}
