import axiosClient from '../axiosClient';
import type {
    ApiResponse,
    ProjectResponse,
    CreateProjectRequest,
    UpdateProjectRequest,
    ProjectInfoResponse,
    ProjectInfoRequest,
} from '../types/types';

const projectService = {
    // Project CRUD
    getProjectsByClass: (classId: number) =>
        axiosClient.get<ApiResponse<ProjectResponse[]>>(`/classes/${classId}/projects`),

    getProjectById: (projectId: number) =>
        axiosClient.get<ApiResponse<ProjectResponse>>(`/projects/${projectId}`),

    getProjectByGroup: (groupId: number) =>
        axiosClient.get<ApiResponse<ProjectResponse>>(`/groups/${groupId}/project`),

    createProject: (groupId: number, data: CreateProjectRequest) =>
        axiosClient.post<ApiResponse<ProjectResponse>>(`/groups/${groupId}/project`, data),

    updateProject: (projectId: number, data: UpdateProjectRequest) =>
        axiosClient.put<ApiResponse<ProjectResponse>>(`/projects/${projectId}`, data),

    deleteProject: (projectId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/projects/${projectId}`),

    // Project Info (SRS data)
    getProjectInfo: (projectId: number) =>
        axiosClient.get<ApiResponse<ProjectInfoResponse>>(`/projects/${projectId}/info`),

    saveProjectInfo: (projectId: number, data: ProjectInfoRequest) =>
        axiosClient.put<ApiResponse<ProjectInfoResponse>>(`/projects/${projectId}/info`, data),

    deleteProjectInfo: (projectId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/projects/${projectId}/info`),
};

export default projectService;
