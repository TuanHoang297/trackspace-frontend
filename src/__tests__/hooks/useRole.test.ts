import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRole } from '../../hooks/useRole';
import * as authUtils from '../../utils/auth';

vi.mock('../../utils/auth', () => ({
    getUser: vi.fn(),
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
    logout: vi.fn(),
}));

const mockGetUser = authUtils.getUser as ReturnType<typeof vi.fn>;

describe('useRole', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns correct role for ADMIN', () => {
        mockGetUser.mockReturnValue({ userId: 1, email: 'a@b.com', fullName: 'Admin', role: 'ADMIN' });

        const { result } = renderHook(() => useRole());

        expect(result.current.role).toBe('ADMIN');
        expect(result.current.isAdmin()).toBe(true);
        expect(result.current.isLecturer()).toBe(false);
    });

    it('returns correct role for LECTURER', () => {
        mockGetUser.mockReturnValue({ userId: 2, email: 'l@b.com', fullName: 'Lecturer', role: 'LECTURER' });

        const { result } = renderHook(() => useRole());

        expect(result.current.role).toBe('LECTURER');
        expect(result.current.isLecturer()).toBe(true);
        expect(result.current.isReadOnly()).toBe(true);
    });

    it('returns correct role for STUDENT', () => {
        mockGetUser.mockReturnValue({ userId: 3, email: 's@b.com', fullName: 'Student', role: 'STUDENT' });

        const { result } = renderHook(() => useRole());

        expect(result.current.isStudent()).toBe(true);
        expect(result.current.isAdmin()).toBe(false);
        expect(result.current.isReadOnly()).toBe(false);
    });

    it('returns empty role when no user', () => {
        mockGetUser.mockReturnValue(null);

        const { result } = renderHook(() => useRole());

        expect(result.current.role).toBe('');
        expect(result.current.isAdmin()).toBe(false);
        expect(result.current.isLecturer()).toBe(false);
        expect(result.current.isStudent()).toBe(false);
    });
});
