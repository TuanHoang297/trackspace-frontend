import axiosClient from '../axiosClient';
import type {
    ApiResponse,
    GroupResponse,
    CreateGroupRequest,
    UpdateGroupRequest,
    GroupMemberResponse,
} from '../types/types';

const groupService = {
    getGroups: (classId: number) =>
        axiosClient.get<ApiResponse<GroupResponse[]>>(`/classes/${classId}/groups`),

    getGroupById: (classId: number, groupId: number) =>
        axiosClient.get<ApiResponse<GroupResponse>>(`/classes/${classId}/groups/${groupId}`),

    createGroup: (classId: number, data: CreateGroupRequest) =>
        axiosClient.post<ApiResponse<GroupResponse>>(`/classes/${classId}/groups`, data),

    updateGroup: (classId: number, groupId: number, data: UpdateGroupRequest) =>
        axiosClient.put<ApiResponse<GroupResponse>>(`/classes/${classId}/groups/${groupId}`, data),

    deleteGroup: (classId: number, groupId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/classes/${classId}/groups/${groupId}`),

    assignLeader: (classId: number, groupId: number, studentId: number) =>
        axiosClient.put<ApiResponse<GroupResponse>>(`/classes/${classId}/groups/${groupId}/leader`, { studentId }),

    getMembers: (classId: number, groupId: number) =>
        axiosClient.get<ApiResponse<GroupMemberResponse[]>>(`/classes/${classId}/groups/${groupId}/members`),

    addMember: (classId: number, groupId: number, studentId: number) =>
        axiosClient.post<ApiResponse<GroupMemberResponse>>(`/classes/${classId}/groups/${groupId}/members`, { studentId }),

    removeMember: (classId: number, groupId: number, studentId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/classes/${classId}/groups/${groupId}/members/${studentId}`),
};

export default groupService;
