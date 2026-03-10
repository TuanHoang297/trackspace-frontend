import { useQuery, useQueryClient } from '@tanstack/react-query';
import classService from '../api/services/classService';
import groupService from '../api/services/groupService';
import projectService from '../api/services/projectService';
import type { StudentInClassResponse } from '../types/class.types';
import type { GroupResponse } from '../types/group.types';
import type { ProjectResponse } from '../types/project.types';

export const useClassDetail = (classId: number) => {
    const queryClient = useQueryClient();

    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ['class', classId, 'students'],
        queryFn: async () => { const r = await classService.getStudents(classId); return r.data.data as StudentInClassResponse[]; },
        enabled: !!classId,
    });

    const { data: groups = [], isLoading: groupsLoading } = useQuery({
        queryKey: ['class', classId, 'groups'],
        queryFn: async () => { const r = await groupService.getGroups(classId); return r.data.data as GroupResponse[]; },
        enabled: !!classId,
    });

    const { data: projects = [], isLoading: projectsLoading } = useQuery({
        queryKey: ['class', classId, 'projects'],
        queryFn: async () => { const r = await projectService.getProjectsByClass(classId); return r.data.data as ProjectResponse[]; },
        enabled: !!classId,
    });

    const loading = studentsLoading || groupsLoading || projectsLoading;
    const error = '';

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['class', classId] });

    return { students, groups, projects, loading, error, refresh };
};
