import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import adminService from '../../../api/services/adminService';
import classService from '../../../api/services/classService';
import type { UserResponse } from '../../../api/types/types';
import type { ClassResponse } from '../../../types/class.types';

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    totalClasses: number;
    activeClasses: number;
    totalStudents: number;
    roles: { admins: number; lecturers: number; students: number };
}

export function useAdminDashboard() {
    const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => { const r = await adminService.getUsers(); return r.data.data as UserResponse[]; },
    });

    const { data: classes = [], isLoading: classesLoading } = useQuery({
        queryKey: ['admin', 'classes'],
        queryFn: async () => { const r = await classService.getClasses(); return r.data.data as ClassResponse[]; },
    });

    const loading = usersLoading || classesLoading;
    const error = usersError ? ((usersError as any)?.response?.data?.message || 'Không thể tải dữ liệu') : '';

    const stats: DashboardStats = useMemo(() => ({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.active).length,
        lockedUsers: users.filter(u => !u.active).length,
        totalClasses: classes.filter(c => c.active).length,
        activeClasses: classes.filter(c => c.active).length,
        totalStudents: users.filter(u => u.role === 'STUDENT').length,
        roles: {
            admins: users.filter(u => u.role === 'ADMIN').length,
            lecturers: users.filter(u => u.role === 'LECTURER').length,
            students: users.filter(u => u.role === 'STUDENT').length,
        },
    }), [users, classes]);

    const recentUsers = useMemo(() => users.slice(0, 5), [users]);
    const recentClasses = useMemo(() => classes.filter(c => c.active).slice(0, 5), [classes]);

    return { loading, error, stats, recentUsers, recentClasses };
}
