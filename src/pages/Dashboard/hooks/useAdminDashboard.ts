import { useEffect, useState, useCallback, useMemo } from 'react';
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
    roles: { admins: number; lecturers: number; leaders: number; members: number };
}

export function useAdminDashboard() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersRes, classesRes] = await Promise.all([
                adminService.getUsers(),
                classService.getClasses(),
            ]);
            setUsers(usersRes.data.data);
            setClasses(classesRes.data.data);
            setError('');
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Không thể tải dữ liệu';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats: DashboardStats = useMemo(() => ({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.active).length,
        lockedUsers: users.filter(u => !u.active).length,
        totalClasses: classes.length,
        activeClasses: classes.filter(c => c.active).length,
        totalStudents: classes.reduce((sum, c) => sum + (c.totalStudents || 0), 0),
        roles: {
            admins: users.filter(u => u.role === 'ADMIN').length,
            lecturers: users.filter(u => u.role === 'LECTURER').length,
            leaders: users.filter(u => u.role === 'TEAMLEADER').length,
            members: users.filter(u => u.role === 'TEAMMEMBER').length,
        },
    }), [users, classes]);

    const recentUsers = useMemo(() => users.slice(0, 5), [users]);
    const recentClasses = useMemo(() => classes.slice(0, 5), [classes]);

    return { loading, error, stats, recentUsers, recentClasses };
}
