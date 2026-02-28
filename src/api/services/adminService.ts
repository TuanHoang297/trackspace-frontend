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
};

export default adminService;
