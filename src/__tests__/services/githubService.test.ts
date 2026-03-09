import { describe, it, expect, vi, beforeEach } from 'vitest';
import githubService from '../../api/services/githubService';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
    default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mock = axiosClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

describe('githubService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('connect - POST /v1/github/connect', async () => {
        const data = { projectId: 1, repoOwner: 'user', repoName: 'repo', accessToken: 'tok' };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await githubService.connect(data as any);
        expect(mock.post).toHaveBeenCalledWith('/v1/github/connect', data);
    });

    it('getStatus - GET /v1/github/status/:projectId', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: {} } });
        await githubService.getStatus(1);
        expect(mock.get).toHaveBeenCalledWith('/v1/github/status/1');
    });

    it('disconnect - DELETE /v1/github/disconnect/:projectId', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await githubService.disconnect(1);
        expect(mock.delete).toHaveBeenCalledWith('/v1/github/disconnect/1');
    });

    it('sync - POST /v1/github/sync', async () => {
        const data = { projectId: 1 };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await githubService.sync(data as any);
        expect(mock.post).toHaveBeenCalledWith('/v1/github/sync', data);
    });

    it('getCommits - GET /v1/github/commits/:projectId', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await githubService.getCommits(1);
        expect(mock.get).toHaveBeenCalledWith('/v1/github/commits/1', { params: undefined });
    });

    it('getCommits with filters - passes params', async () => {
        const params = { branch: 'main', userId: 2 };
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await githubService.getCommits(1, params);
        expect(mock.get).toHaveBeenCalledWith('/v1/github/commits/1', { params });
    });

    it('getStats - GET /v1/github/stats/:projectId', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await githubService.getStats(1);
        expect(mock.get).toHaveBeenCalledWith('/v1/github/stats/1', { params: undefined });
    });

    it('getBranches - GET /v1/github/branches/:projectId', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await githubService.getBranches(1);
        expect(mock.get).toHaveBeenCalledWith('/v1/github/branches/1');
    });

    it('getConnections - GET /v1/github/connections/:projectId', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await githubService.getConnections(1);
        expect(mock.get).toHaveBeenCalledWith('/v1/github/connections/1');
    });
});
