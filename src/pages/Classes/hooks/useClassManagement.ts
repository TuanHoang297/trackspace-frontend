import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import classService from '../../../api/services/classService';
import { semesterService } from '../../../api/services/classService';
import adminService from '../../../api/services/adminService';
import type { ClassResponse, CreateClassRequest, UpdateClassRequest, SemesterResponse } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';

export function useClassManagement() {
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [semesterFilter, setSemesterFilter] = useState<number | ''>('');
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('active');

    // Dialog state
    const [openCreate, setOpenCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<ClassResponse | null>(null);
    const [assignTarget, setAssignTarget] = useState<ClassResponse | null>(null);
    const [studentTarget, setStudentTarget] = useState<ClassResponse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ClassResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Actions Menu
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuClass, setMenuClass] = useState<ClassResponse | null>(null);

    // ── Parallel queries with React Query ──
    const { data: classes = [], isLoading: classesLoading, error: classesError } = useQuery({
        queryKey: ['admin', 'classes'],
        queryFn: async () => { const r = await classService.getClasses(); return (r.data.data ?? []) as ClassResponse[]; },
    });
    const { data: allUsers = [], isLoading: usersLoading } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => { const r = await adminService.getUsers(); return (r.data.data ?? []) as UserResponse[]; },
    });
    const { data: semesters = [], isLoading: semestersLoading } = useQuery({
        queryKey: ['admin', 'semesters'],
        queryFn: async () => { const r = await semesterService.getAllSemesters(); return (r.data.data ?? []) as SemesterResponse[]; },
    });

    const loading = classesLoading || usersLoading || semestersLoading;
    const error = classesError ? ((classesError as any)?.response?.data?.message || 'Không thể tải dữ liệu') : '';

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

    const lecturers = useMemo(() => allUsers.filter(u => u.role === 'LECTURER'), [allUsers]);

    const filtered = useMemo(() => classes.filter(c => {
        const matchesSearch = (c.subjectName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.classCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSemester = semesterFilter === '' || c.semesterId === semesterFilter;
        const matchesStatus = statusFilter === '' || (statusFilter === 'active' ? c.active : !c.active);
        return matchesSearch && matchesSemester && matchesStatus;
    }), [classes, searchTerm, semesterFilter, statusFilter]);

    const activeCount = useMemo(() => classes.filter(c => c.active).length, [classes]);
    const totalStudents = useMemo(() => classes.reduce((s, c) => s + (c.totalStudents || 0), 0), [classes]);

    const handleCreate = async (data: CreateClassRequest) => {
        try {
            await classService.createClass(data);
            toast.success('Tạo lớp học thành công!');
            invalidate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Tạo lớp học thất bại';
            toast.error(message);
            throw err;
        }
    };

    const handleEdit = async (classId: number, data: UpdateClassRequest) => {
        try {
            await classService.updateClass(classId, data);
            toast.success('Cập nhật lớp học thành công!');
            invalidate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Cập nhật lớp học thất bại';
            toast.error(message);
            throw err;
        }
    };

    const handleAssign = async (classId: number, lecturerId: number) => {
        try {
            await classService.assignLecturer(classId, lecturerId);
            toast.success('Gán giảng viên thành công!');
            invalidate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Gán giảng viên thất bại';
            toast.error(message);
            throw err;
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await classService.deleteClass(deleteTarget.id);
            toast.success(`Đã xóa lớp ${deleteTarget.classCode}`);
            setDeleteTarget(null);
            invalidate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Xóa lớp thất bại';
            toast.error(message);
        } finally { setDeleting(false); }
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, cls: ClassResponse) => {
        setMenuAnchor(e.currentTarget); setMenuClass(cls);
    };
    const handleMenuClose = () => { setMenuAnchor(null); setMenuClass(null); };

    return {
        classes, allUsers, loading, error, searchTerm, setSearchTerm,
        filtered, activeCount, totalStudents, lecturers,
        semesters, semesterFilter, setSemesterFilter,
        statusFilter, setStatusFilter,
        openCreate, setOpenCreate, handleCreate,
        editTarget, setEditTarget, handleEdit,
        assignTarget, setAssignTarget, handleAssign,
        studentTarget, setStudentTarget,
        deleteTarget, setDeleteTarget, deleting, handleDelete,
        menuAnchor, menuClass, handleMenuOpen, handleMenuClose,
        fetchData: invalidate,
    };
}
