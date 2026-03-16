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
    additionalInfo?: string;
}

export interface SrsUpdateRequest {
    title?: string;
    content: string;
}

export interface SrsVisionRequest {
    image: string; // base64
    type: 'usecase' | 'screenflow' | 'db_schema' | 'mockup';
    context?: string;
}
