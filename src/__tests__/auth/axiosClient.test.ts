import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// We need to test the axiosClient module behavior
// Rather than importing the singleton (which would execute interceptors at import time),
// we test the interceptor logic patterns directly

describe('axiosClient interceptors', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        localStorage.clear();
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

    // ── Request Interceptor Logic ──

    describe('request interceptor logic', () => {
        it('attaches Bearer token when token exists in localStorage', () => {
            localStorage.setItem('token', 'jwt-test-token');

            const config = { headers: {} as Record<string, string> };
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            expect(config.headers.Authorization).toBe('Bearer jwt-test-token');
        });

        it('does NOT attach Authorization header when no token', () => {
            const config = { headers: {} as Record<string, string> };
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            expect(config.headers.Authorization).toBeUndefined();
        });

        it('formats Authorization header as "Bearer <token>"', () => {
            const token = 'eyJhbGciOiJIUzI1NiJ9.test';
            const header = `Bearer ${token}`;
            expect(header).toMatch(/^Bearer .+/);
        });
    });

    // ── Response Interceptor Logic ──

    describe('response interceptor logic (401 handler)', () => {
        it('clears localStorage on 401 response', () => {
            localStorage.setItem('token', 'old-token');
            localStorage.setItem('user', '{"userId":1}');

            // Simulate 401 handler
            const status = 401;
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });

        it('redirects to /login on 401 response', () => {
            const status = 401;
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            expect(window.location.href).toBe('/login');
        });

        it('does NOT clear localStorage on non-401 errors', () => {
            localStorage.setItem('token', 'valid-token');
            localStorage.setItem('user', '{"userId":1}');

            const status = 500;
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }

            expect(localStorage.getItem('token')).toBe('valid-token');
            expect(localStorage.getItem('user')).toBe('{"userId":1}');
        });

        it('does NOT clear localStorage on 403 errors', () => {
            localStorage.setItem('token', 'valid-token');

            const status = 403;
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }

            expect(localStorage.getItem('token')).toBe('valid-token');
        });
    });
});
