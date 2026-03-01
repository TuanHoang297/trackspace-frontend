// ==================== Group ====================

export interface GroupResponse {
    id: number;
    groupName: string;
    description: string;
    classId: number;
    className: string;
    teamLeaderId: number | null;
    teamLeaderName: string | null;
    teamLeaderEmail: string | null;
    totalMembers: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroupRequest {
    groupName: string;
    description?: string;
}

export interface UpdateGroupRequest {
    groupName?: string;
    description?: string;
}

export interface GroupMemberResponse {
    membershipId: number;
    userId: number;
    fullName: string;
    email: string;
    studentCode: string | null;
    role: string;
    isLeader: boolean;
    joinedAt: string;
}
