// ==================== Auth / User ====================

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface StoredUser {
    userId: number;
    email: string;
    fullName: string;
    role: string;
}

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
