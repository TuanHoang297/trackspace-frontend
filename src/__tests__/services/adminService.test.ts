import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminService from '../../api/services/adminService';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mock = axiosClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

describe('adminService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getUsers - GET /admin/users', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await adminService.getUsers();
        expect(mock.get).toHaveBeenCalledWith('/admin/users');
    });

    it('createUser - POST /admin/users', async () => {
        const data = { email: 'new@test.com', password: '123456', fullName: 'New', role: 'LECTURER' as const };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await adminService.createUser(data);
        expect(mock.post).toHaveBeenCalledWith('/admin/users', data);
    });

    it('updateUserStatus - PATCH /admin/users/:id/status', async () => {
        mock.patch.mockResolvedValueOnce({ data: { data: {} } });
        await adminService.updateUserStatus(1, false);
        expect(mock.patch).toHaveBeenCalledWith('/admin/users/1/status', { active: false });
    });

    it('deleteUser - DELETE /admin/users/:id', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await adminService.deleteUser(1);
        expect(mock.delete).toHaveBeenCalledWith('/admin/users/1');
    });

    it('importUsers - POST /admin/users/import with FormData', async () => {
        const file = new File(['test'], 'users.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        mock.post.mockResolvedValueOnce({ data: { data: {} } });

        await adminService.importUsers(file);

        expect(mock.post).toHaveBeenCalledWith(
            '/admin/users/import',
            expect.any(FormData),
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    });

    it('downloadTemplate - GET /admin/users/import-template as blob', async () => {
        mock.get.mockResolvedValueOnce({ data: new Blob() });
        await adminService.downloadTemplate();
        expect(mock.get).toHaveBeenCalledWith('/admin/users/import-template', { responseType: 'blob' });
    });
});
