import { describe, it, expect } from 'vitest';
import type {
    ApiResponse,
    StoredUser,
    UserResponse,
    CreateUserRequest,
    UpdateUserStatusRequest,
} from '../../types/auth.types';

// Factory helpers
function createMockStoredUser(overrides?: Partial<StoredUser>): StoredUser {
    return {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'LECTURER',
        ...overrides,
    };
}

function createMockUserResponse(overrides?: Partial<UserResponse>): UserResponse {
    return {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'LECTURER',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

function createMockApiResponse<T>(data: T, overrides?: Partial<ApiResponse<T>>): ApiResponse<T> {
    return {
        success: true,
        message: 'OK',
        data,
        ...overrides,
    };
}

describe('Auth Types — Shape Contracts', () => {
    it('ApiResponse has success, message, and data', () => {
        const res = createMockApiResponse({ token: 'abc' });
        expect(res).toHaveProperty('success');
        expect(res).toHaveProperty('message');
        expect(res).toHaveProperty('data');
        expect(res.success).toBe(true);
    });

    it('ApiResponse handles error state', () => {
        const res = createMockApiResponse(null, { success: false, message: 'Unauthorized' });
        expect(res.success).toBe(false);
        expect(res.message).toBe('Unauthorized');
        expect(res.data).toBeNull();
    });

    it('StoredUser has required fields', () => {
        const user = createMockStoredUser();
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('fullName');
        expect(user).toHaveProperty('role');
    });

    it('UserResponse includes active status and timestamps', () => {
        const user = createMockUserResponse();
        expect(user).toHaveProperty('active');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        expect(user.active).toBe(true);
    });

    it('UserResponse role is one of the valid roles', () => {
        const validRoles = ['ADMIN', 'LECTURER', 'TEAMLEADER', 'TEAMMEMBER'];
        const user = createMockUserResponse({ role: 'ADMIN' });
        expect(validRoles).toContain(user.role);
    });

    it('factory functions support overrides', () => {
        const admin = createMockStoredUser({ role: 'ADMIN', fullName: 'Admin' });
        expect(admin.role).toBe('ADMIN');
        expect(admin.fullName).toBe('Admin');

        const inactive = createMockUserResponse({ active: false });
        expect(inactive.active).toBe(false);
    });

    it('CreateUserRequest shape is correct', () => {
        const req: CreateUserRequest = {
            email: 'new@test.com',
            password: 'pass123',
            fullName: 'New User',
            role: 'TEAMMEMBER',
        };
        expect(req.email).toBe('new@test.com');
        expect(req.role).toBe('TEAMMEMBER');
    });
});
