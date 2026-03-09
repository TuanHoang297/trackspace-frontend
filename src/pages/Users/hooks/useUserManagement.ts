import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import adminService from '../../../api/services/adminService';
import type { UserResponse, CreateUserRequest, UpdateUserRequest } from '../../../api/types/types';

export function useUserManagement() {
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Dialog targets
    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<UserResponse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
    const [toggleTarget, setToggleTarget] = useState<UserResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Actions Menu
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuUser, setMenuUser] = useState<UserResponse | null>(null);

    const { data: users = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => { const r = await adminService.getUsers(); return r.data.data as UserResponse[]; },
    });

    const error = queryError ? ((queryError as any)?.response?.data?.message || 'Không thể tải danh sách tài khoản') : '';

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

    const filteredUsers = useMemo(() => users.filter((u) => {
        const matchesSearch =
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    }), [users, searchTerm, roleFilter]);

    const activeCount = useMemo(() => users.filter((u) => u.active).length, [users]);
    const inactiveCount = useMemo(() => users.filter((u) => !u.active).length, [users]);

    const handleCreateUser = async (newUser: CreateUserRequest) => {
        await adminService.createUser(newUser);
        toast.success('Tạo tài khoản thành công!');
        setOpenCreate(false);
        invalidate();
    };

    const handleEditUser = async (userId: number, data: UpdateUserRequest) => {
        await adminService.updateUser(userId, data);
        toast.success('Cập nhật thông tin thành công!');
        setEditTarget(null);
        invalidate();
    };

    const handleToggleStatus = async () => {
        if (!toggleTarget) return;
        try {
            await adminService.updateUserStatus(toggleTarget.userId, !toggleTarget.active);
            toast.success(
                toggleTarget.active
                    ? `Đã khóa tài khoản ${toggleTarget.fullName}`
                    : `Đã kích hoạt tài khoản ${toggleTarget.fullName}`
            );
            setToggleTarget(null);
            invalidate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Cập nhật trạng thái thất bại';
            toast.error(message);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await adminService.deleteUser(deleteTarget.userId);
            toast.success(`Đã xóa tài khoản ${deleteTarget.fullName}`);
            setDeleteTarget(null);
            invalidate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Xóa tài khoản thất bại';
            toast.error(message);
        } finally {
            setDeleting(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserResponse) => {
        setMenuAnchor(event.currentTarget);
        setMenuUser(user);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuUser(null);
    };

    return {
        users, loading, error, searchTerm, setSearchTerm,
        roleFilter, setRoleFilter, filteredUsers,
        activeCount, inactiveCount, fetchUsers: invalidate,
        openCreate, setOpenCreate, handleCreateUser,
        editTarget, setEditTarget, handleEditUser,
        deleteTarget, setDeleteTarget, deleting, handleDeleteUser,
        toggleTarget, setToggleTarget, handleToggleStatus,
        menuAnchor, menuUser, handleMenuOpen, handleMenuClose,
    };
}
