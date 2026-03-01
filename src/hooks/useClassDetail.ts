import { useState, useEffect, useCallback } from 'react';
import classService from '../api/services/classService';
import groupService from '../api/services/groupService';
import projectService from '../api/services/projectService';
import type { StudentInClassResponse } from '../types/class.types';
import type { GroupResponse } from '../types/group.types';
import type { ProjectResponse } from '../types/project.types';

export const useClassDetail = (classId: number) => {
    const [students, setStudents] = useState<StudentInClassResponse[]>([]);
    const [groups, setGroups] = useState<GroupResponse[]>([]);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!classId) return;
        try {
            setLoading(true);
            const [studRes, grpRes, prjRes] = await Promise.all([
                classService.getStudents(classId),
                groupService.getGroups(classId),
                projectService.getProjectsByClass(classId),
            ]);
            setStudents(studRes.data.data);
            setGroups(grpRes.data.data);
            setProjects(prjRes.data.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải dữ liệu lớp');
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => { refresh(); }, [refresh]);

    return { students, groups, projects, loading, error, refresh };
};
