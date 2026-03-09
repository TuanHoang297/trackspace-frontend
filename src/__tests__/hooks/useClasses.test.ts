import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClasses } from '../../hooks/useClasses';
import classService from '../../api/services/classService';

vi.mock('../../api/services/classService', () => ({
    default: { getClasses: vi.fn() },
}));

const mockClassService = classService as unknown as {
    getClasses: ReturnType<typeof vi.fn>;
};

describe('useClasses', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches classes on mount', async () => {
        mockClassService.getClasses.mockResolvedValue({
            data: { data: [{ classId: 1, name: 'CS101' }] },
        });

        const { result } = renderHook(() => useClasses());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.classes).toHaveLength(1);
        expect(result.current.error).toBe('');
    });

    it('sets error when fetch fails', async () => {
        mockClassService.getClasses.mockRejectedValue({
            response: { data: { message: 'Unauthorized' } },
        });

        const { result } = renderHook(() => useClasses());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Unauthorized');
        expect(result.current.classes).toHaveLength(0);
    });

    it('sets default error when no message in response', async () => {
        mockClassService.getClasses.mockRejectedValue(new Error('Network'));

        const { result } = renderHook(() => useClasses());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Không thể tải danh sách lớp');
    });
});
