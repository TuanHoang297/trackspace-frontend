import type { StoredUser } from '../api/types/types';

export const getToken = (): string | null => localStorage.getItem('token');

export const getUser = (): StoredUser | null => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const isAuthenticated = (): boolean => !!getToken();

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};
