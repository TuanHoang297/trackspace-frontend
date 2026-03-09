import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getToken, getUser, isAuthenticated, logout } from '../../utils/auth';

// Keep a reference to the real location object
const originalLocation = window.location;

describe('auth utils', () => {
    beforeEach(() => {
        localStorage.clear();

        // Mock window.location.href
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...originalLocation, href: '' },
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        });
    });

    // ── getToken ──

    it('getToken returns token from localStorage', () => {
        localStorage.setItem('token', 'jwt-abc-123');
        expect(getToken()).toBe('jwt-abc-123');
    });

    it('getToken returns null when no token stored', () => {
        expect(getToken()).toBeNull();
    });

    // ── getUser ──

    it('getUser returns parsed user object', () => {
        const user = { userId: 1, email: 'a@b.com', fullName: 'Test', role: 'ADMIN' };
        localStorage.setItem('user', JSON.stringify(user));

        const result = getUser();
        expect(result).toEqual(user);
        expect(result?.userId).toBe(1);
        expect(result?.role).toBe('ADMIN');
    });

    it('getUser returns null when no user stored', () => {
        expect(getUser()).toBeNull();
    });

    it('getUser returns null when stored value is invalid JSON', () => {
        localStorage.setItem('user', 'not-valid-json{');
        expect(getUser()).toBeNull();
    });

    // ── isAuthenticated ──

    it('isAuthenticated returns true when token exists', () => {
        localStorage.setItem('token', 'some-token');
        expect(isAuthenticated()).toBe(true);
    });

    it('isAuthenticated returns false when no token', () => {
        expect(isAuthenticated()).toBe(false);
    });

    // ── logout ──

    it('logout clears token and user from localStorage', () => {
        localStorage.setItem('token', 'jwt');
        localStorage.setItem('user', '{}');

        logout();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('logout redirects to /login', () => {
        logout();
        expect(window.location.href).toBe('/login');
    });
});
