import axiosClient from '../axiosClient';

export interface WorkspaceResponse {
    classId: number;
    className: string;
    groupId: number;
    groupName: string;
    projectId: number | null;
    projectName: string | null;
    isLeader: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

const studentService = {
    getMyWorkspaces: () =>
        axiosClient.get<ApiResponse<WorkspaceResponse[]>>('/student/my-workspaces'),
};

export default studentService;
