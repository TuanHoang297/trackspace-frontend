import axiosClient from '../axiosClient';
import type {
    ApiResponse,
    SrsDocumentResponse,
    SrsUpdateRequest
} from '../types/types';

const srsService = {
    // Lấy bản SRS mới nhất của project
    getLatestSrs: (projectId: number) =>
        axiosClient.get<ApiResponse<SrsDocumentResponse>>(`/projects/${projectId}/srs`),

    // Lấy toàn bộ lịch sử version
    getAllSrsVersions: (projectId: number) =>
        axiosClient.get<ApiResponse<SrsDocumentResponse[]>>(`/projects/${projectId}/srs/versions`),

    // Generate SRS (AI)
    generateSrs: (projectId: number) =>
        axiosClient.post<ApiResponse<SrsDocumentResponse>>(`/projects/${projectId}/srs/generate`),

    // Edit (Update) SRS bằng tay
    updateSrs: (srsId: number, data: SrsUpdateRequest) =>
        axiosClient.put<ApiResponse<SrsDocumentResponse>>(`/srs/${srsId}`, data),

    // Export PDF
    exportPdf: (srsId: number) =>
        axiosClient.get(`/srs/${srsId}/export?format=pdf`, { responseType: 'blob' }),

    // Export DOCX
    exportDocx: (srsId: number) =>
        axiosClient.get(`/srs/${srsId}/export?format=docx`, { responseType: 'blob' }),
};

export default srsService;
