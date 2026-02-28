// Generic API Response matching backend ApiResponse<T>
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// ==================== User ====================

export interface UserResponse {
    userId: number;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'LECTURER' | 'TEAMLEADER' | 'TEAMMEMBER';
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    fullName: string;
    role: 'LECTURER' | 'TEAMLEADER' | 'TEAMMEMBER';
}

export interface UpdateUserStatusRequest {
    active: boolean;
}

// ==================== Classroom ====================

export interface ClassResponse {
    id: number;
    className: string;
    classCode: string;
    semester: string;
    lecturerId: number | null;
    lecturerName: string | null;
    lecturerEmail: string | null;
    totalStudents: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClassRequest {
    className: string;
    classCode: string;
    semester: string;
}

export interface UpdateClassRequest {
    className?: string;
    semester?: string;
    active?: boolean;
}

export interface AssignLecturerRequest {
    lecturerId: number;
}

export interface StudentInClassResponse {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    email: string;
    enrolledAt: string;
}

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
    role: string;
    isLeader: boolean;
    joinedAt: string;
}

// ==================== Auth ====================

export interface StoredUser {
    userId: number;
    email: string;
    fullName: string;
    role: string;
}
