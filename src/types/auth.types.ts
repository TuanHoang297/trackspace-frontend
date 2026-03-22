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
    githubLogin?: string;
}

export interface UserResponse {
    userId: number;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    studentCode?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    fullName: string;
    role: 'LECTURER' | 'STUDENT';
    studentCode?: string;
}

export interface UpdateUserRequest {
    fullName: string;
    email: string;
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    studentCode?: string;
    password?: string;
}

export interface UpdateUserStatusRequest {
    active: boolean;
}
