import axiosClient from '../axiosClient';
import type { ApiResponse, UserResponse, CreateUserRequest } from '../types/types';

const adminService = {
    getUsers: () =>
        axiosClient.get<ApiResponse<UserResponse[]>>('/admin/users'),

    createUser: (data: CreateUserRequest) =>
        axiosClient.post<ApiResponse<any>>('/admin/users', data),

    updateUserStatus: (userId: number, active: boolean) =>
        axiosClient.patch<ApiResponse<UserResponse>>(`/admin/users/${userId}/status`, { active }),

    deleteUser: (userId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/admin/users/${userId}`),

    importUsers: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.post<ApiResponse<any>>('/admin/users/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    downloadTemplate: () =>
        axiosClient.get('/admin/users/import-template', { responseType: 'blob' }),
};

export default adminService;
