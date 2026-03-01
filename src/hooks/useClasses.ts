import { useState, useEffect, useCallback } from 'react';
import classService from '../api/services/classService';
import type { ClassResponse } from '../types/class.types';

export const useClasses = () => {
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const res = await classService.getClasses();
            setClasses(res.data.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách lớp');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return { classes, loading, error, refresh };
};
