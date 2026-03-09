import { describe, it, expect, vi, beforeEach } from 'vitest';
import projectService from '../../api/services/projectService';
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

describe('projectService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getProjectsByClass - GET /classes/:classId/projects', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await projectService.getProjectsByClass(1);
        expect(mock.get).toHaveBeenCalledWith('/classes/1/projects');
    });

    it('getProjectById - GET /projects/:id', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: {} } });
        await projectService.getProjectById(5);
        expect(mock.get).toHaveBeenCalledWith('/projects/5');
    });

    it('getProjectByGroup - GET /groups/:groupId/project', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: {} } });
        await projectService.getProjectByGroup(3);
        expect(mock.get).toHaveBeenCalledWith('/groups/3/project');
    });

    it('createProject - POST /groups/:groupId/project', async () => {
        const data = { name: 'Project X' };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await projectService.createProject(3, data as any);
        expect(mock.post).toHaveBeenCalledWith('/groups/3/project', data);
    });

    it('updateProject - PUT /projects/:id', async () => {
        const data = { name: 'Updated' };
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await projectService.updateProject(5, data as any);
        expect(mock.put).toHaveBeenCalledWith('/projects/5', data);
    });

    it('deleteProject - DELETE /projects/:id', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await projectService.deleteProject(5);
        expect(mock.delete).toHaveBeenCalledWith('/projects/5');
    });

    it('getProjectInfo - GET /projects/:id/info', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: {} } });
        await projectService.getProjectInfo(5);
        expect(mock.get).toHaveBeenCalledWith('/projects/5/info');
    });

    it('saveProjectInfo - PUT /projects/:id/info', async () => {
        const data = { description: 'SRS data' };
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await projectService.saveProjectInfo(5, data as any);
        expect(mock.put).toHaveBeenCalledWith('/projects/5/info', data);
    });

    it('deleteProjectInfo - DELETE /projects/:id/info', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await projectService.deleteProjectInfo(5);
        expect(mock.delete).toHaveBeenCalledWith('/projects/5/info');
    });
});
