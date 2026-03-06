import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import classService from '../../../api/services/classService';
import { semesterService } from '../../../api/services/classService';
import adminService from '../../../api/services/adminService';
import type { ClassResponse, CreateClassRequest, UpdateClassRequest, SemesterResponse } from '../../../types/class.types';
import type { UserResponse } from '../../../types/auth.types';

export function useClassManagement() {
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
    const [semesterFilter, setSemesterFilter] = useState<number | ''>('');

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

    const lecturers = useMemo(() => allUsers.filter(u => u.role === 'LECTURER'), [allUsers]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [classesRes, usersRes, semestersRes] = await Promise.all([
                classService.getClasses(), adminService.getUsers(), semesterService.getAllSemesters(),
            ]);
            setClasses(classesRes.data.data ?? []);
            setAllUsers(usersRes.data.data ?? []);
            setSemesters(semestersRes.data.data ?? []);
            setError('');
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })
                .response?.data?.message || 'Không thể tải dữ liệu';
            setError(message);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = useMemo(() => classes.filter(c => {
        const matchesSearch = (c.subjectName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.classCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSemester = semesterFilter === '' || c.semesterId === semesterFilter;
        return matchesSearch && matchesSemester;
    }), [classes, searchTerm, semesterFilter]);

    const activeCount = useMemo(() => classes.filter(c => c.active).length, [classes]);
    const totalStudents = useMemo(() => classes.reduce((s, c) => s + (c.totalStudents || 0), 0), [classes]);

    const handleCreate = async (data: CreateClassRequest) => {
        try {
            await classService.createClass(data);
            toast.success('Tạo lớp học thành công!');
            fetchData();
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
            fetchData();
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
            fetchData();
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
            fetchData();
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
        openCreate, setOpenCreate, handleCreate,
        editTarget, setEditTarget, handleEdit,
        assignTarget, setAssignTarget, handleAssign,
        studentTarget, setStudentTarget,
        deleteTarget, setDeleteTarget, deleting, handleDelete,
        menuAnchor, menuClass, handleMenuOpen, handleMenuClose,
        fetchData,
    };
}
