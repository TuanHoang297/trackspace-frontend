import { describe, it, expect, vi, beforeEach } from 'vitest';
import studentService from '../../api/services/studentService';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
    default: { get: vi.fn() },
}));

const mock = axiosClient as unknown as {
    get: ReturnType<typeof vi.fn>;
};

describe('studentService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getMyWorkspaces - GET /student/my-workspaces', async () => {
        const workspaces = [
            { classId: 1, className: 'CS101', groupId: 1, groupName: 'G1', projectId: 1, projectName: 'P1', isLeader: true },
        ];
        mock.get.mockResolvedValueOnce({ data: { data: workspaces } });

        const res = await studentService.getMyWorkspaces();

        expect(mock.get).toHaveBeenCalledWith('/student/my-workspaces');
        expect(res.data.data).toHaveLength(1);
        expect(res.data.data[0].isLeader).toBe(true);
    });
});
