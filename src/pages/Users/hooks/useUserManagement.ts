import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../../api/services/adminService';
import type { UserResponse, CreateUserRequest } from '../../../api/types/types';

export function useUserManagement() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Dialog targets
    const [openCreate, setOpenCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
    const [toggleTarget, setToggleTarget] = useState<UserResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Actions Menu
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuUser, setMenuUser] = useState<UserResponse | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getUsers();
            setUsers(res.data.data);
            setError('');
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Không thể tải danh sách tài khoản';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
        fetchUsers();
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
            fetchUsers();
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
            fetchUsers();
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
        activeCount, inactiveCount, fetchUsers,
        openCreate, setOpenCreate, handleCreateUser,
        deleteTarget, setDeleteTarget, deleting, handleDeleteUser,
        toggleTarget, setToggleTarget, handleToggleStatus,
        menuAnchor, menuUser, handleMenuOpen, handleMenuClose,
    };
}
