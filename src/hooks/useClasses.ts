import { useQuery, useQueryClient } from '@tanstack/react-query';
import classService from '../api/services/classService';
import type { ClassResponse } from '../types/class.types';

export const useClasses = () => {
    const queryClient = useQueryClient();

    const { data: classes = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ['lecturer', 'classes'],
        queryFn: async () => {
            const res = await classService.getClasses();
            return res.data.data as ClassResponse[];
        },
    });

    const error = queryError ? ((queryError as any)?.response?.data?.message || 'Không thể tải danh sách lớp') : '';
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['lecturer', 'classes'] });

    return { classes, loading, error, refresh };
};
