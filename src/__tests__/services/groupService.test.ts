import { describe, it, expect, vi, beforeEach } from 'vitest';
import groupService from '../../api/services/groupService';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mock = axiosClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

describe('groupService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getGroups - GET /classes/:classId/groups', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await groupService.getGroups(1);
        expect(mock.get).toHaveBeenCalledWith('/classes/1/groups');
    });

    it('getGroupById - GET /classes/:classId/groups/:groupId', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: {} } });
        await groupService.getGroupById(1, 5);
        expect(mock.get).toHaveBeenCalledWith('/classes/1/groups/5');
    });

    it('createGroup - POST /classes/:classId/groups', async () => {
        const data = { name: 'Group A' };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await groupService.createGroup(1, data);
        expect(mock.post).toHaveBeenCalledWith('/classes/1/groups', data);
    });

    it('updateGroup - PUT /classes/:classId/groups/:groupId', async () => {
        const data = { name: 'Updated' };
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await groupService.updateGroup(1, 5, data);
        expect(mock.put).toHaveBeenCalledWith('/classes/1/groups/5', data);
    });

    it('deleteGroup - DELETE /classes/:classId/groups/:groupId', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await groupService.deleteGroup(1, 5);
        expect(mock.delete).toHaveBeenCalledWith('/classes/1/groups/5');
    });

    it('assignLeader - PUT /classes/:classId/groups/:groupId/leader', async () => {
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await groupService.assignLeader(1, 5, 10);
        expect(mock.put).toHaveBeenCalledWith('/classes/1/groups/5/leader', { studentId: 10 });
    });

    it('getMembers - GET /classes/:classId/groups/:groupId/members', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await groupService.getMembers(1, 5);
        expect(mock.get).toHaveBeenCalledWith('/classes/1/groups/5/members');
    });

    it('addMember - POST /classes/:classId/groups/:groupId/members', async () => {
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await groupService.addMember(1, 5, 10);
        expect(mock.post).toHaveBeenCalledWith('/classes/1/groups/5/members', { studentId: 10 });
    });

    it('removeMember - DELETE /classes/:classId/groups/:groupId/members/:studentId', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await groupService.removeMember(1, 5, 10);
        expect(mock.delete).toHaveBeenCalledWith('/classes/1/groups/5/members/10');
    });
});
