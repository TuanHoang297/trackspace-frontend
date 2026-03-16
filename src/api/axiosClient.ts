import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const sanitizeToken = (token: string | null): string | null => {
    if (!token) return null;
    let t = token.trim();
    if (!t || t === 'null' || t === 'undefined') return null;
    if (t.startsWith('Bearer ')) t = t.slice(7).trim();
    if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
    return t || null;
};

const resolveToken = (): string | null => {
    const localToken = sanitizeToken(localStorage.getItem('token'));
    if (localToken) return localToken;

    const sessionToken = sanitizeToken(sessionStorage.getItem('token'));
    if (sessionToken) return sessionToken;

    const urlToken = sanitizeToken(new URLSearchParams(window.location.search).get('token'));
    if (urlToken) {
        localStorage.setItem('token', urlToken);
        return urlToken;
    }

    return null;
};

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token
axiosClient.interceptors.request.use(
    (config) => {
        const token = resolveToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 / 403
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
