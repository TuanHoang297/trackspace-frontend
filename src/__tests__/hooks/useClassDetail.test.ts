import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClassDetail } from '../../hooks/useClassDetail';
import classService from '../../api/services/classService';
import groupService from '../../api/services/groupService';
import projectService from '../../api/services/projectService';

vi.mock('../../api/services/classService', () => ({
    default: { getStudents: vi.fn() },
}));
vi.mock('../../api/services/groupService', () => ({
    default: { getGroups: vi.fn() },
}));
vi.mock('../../api/services/projectService', () => ({
    default: { getProjectsByClass: vi.fn() },
}));

const mockClass = classService as unknown as { getStudents: ReturnType<typeof vi.fn> };
const mockGroup = groupService as unknown as { getGroups: ReturnType<typeof vi.fn> };
const mockProject = projectService as unknown as { getProjectsByClass: ReturnType<typeof vi.fn> };

describe('useClassDetail', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches students, groups, and projects in parallel', async () => {
        mockClass.getStudents.mockResolvedValue({ data: { data: [{ studentId: 1 }] } });
        mockGroup.getGroups.mockResolvedValue({ data: { data: [{ groupId: 1 }] } });
        mockProject.getProjectsByClass.mockResolvedValue({ data: { data: [{ projectId: 1 }] } });

        const { result } = renderHook(() => useClassDetail(1));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.students).toHaveLength(1);
        expect(result.current.groups).toHaveLength(1);
        expect(result.current.projects).toHaveLength(1);
        expect(result.current.error).toBe('');
    });

    it('sets error when any fetch fails', async () => {
        mockClass.getStudents.mockRejectedValue({
            response: { data: { message: 'Not found' } },
        });
        mockGroup.getGroups.mockResolvedValue({ data: { data: [] } });
        mockProject.getProjectsByClass.mockResolvedValue({ data: { data: [] } });

        const { result } = renderHook(() => useClassDetail(1));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Not found');
    });

    it('does not fetch when classId is 0', async () => {
        const { result } = renderHook(() => useClassDetail(0));

        // Should remain in initial loading state since fetchData returns early
        expect(mockClass.getStudents).not.toHaveBeenCalled();
        expect(mockGroup.getGroups).not.toHaveBeenCalled();
    });
});
