import { describe, it, expect, vi, beforeEach } from 'vitest';
import classService, { semesterService, subjectService } from '../../api/services/classService';
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

describe('classService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getClasses - GET /classes', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await classService.getClasses();
        expect(mock.get).toHaveBeenCalledWith('/classes');
    });

    it('getClassById - GET /classes/:id', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: {} } });
        await classService.getClassById(1);
        expect(mock.get).toHaveBeenCalledWith('/classes/1');
    });

    it('createClass - POST /classes', async () => {
        const data = { name: 'CS101', subjectId: 1, semesterId: 1 };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await classService.createClass(data as any);
        expect(mock.post).toHaveBeenCalledWith('/classes', data);
    });

    it('updateClass - PUT /classes/:id', async () => {
        const data = { name: 'CS102' };
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await classService.updateClass(1, data as any);
        expect(mock.put).toHaveBeenCalledWith('/classes/1', data);
    });

    it('deleteClass - DELETE /classes/:id', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await classService.deleteClass(1);
        expect(mock.delete).toHaveBeenCalledWith('/classes/1');
    });

    it('assignLecturer - PUT /classes/:id/lecturer', async () => {
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await classService.assignLecturer(1, 5);
        expect(mock.put).toHaveBeenCalledWith('/classes/1/lecturer', { lecturerId: 5 });
    });

    it('getStudents - GET /classes/:id/students', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await classService.getStudents(1);
        expect(mock.get).toHaveBeenCalledWith('/classes/1/students');
    });

    it('addStudent - POST /classes/:id/students', async () => {
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await classService.addStudent(1, 10);
        expect(mock.post).toHaveBeenCalledWith('/classes/1/students', { studentId: 10 });
    });

    it('removeStudent - DELETE /classes/:id/students/:studentId', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await classService.removeStudent(1, 10);
        expect(mock.delete).toHaveBeenCalledWith('/classes/1/students/10');
    });

    it('getEnrolledStudentIds - GET /classes/enrolled-student-ids', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [1, 2, 3] } });
        await classService.getEnrolledStudentIds();
        expect(mock.get).toHaveBeenCalledWith('/classes/enrolled-student-ids');
    });

    it('getEnrolledStudentIdsByClass - GET /classes/:id/enrolled-student-ids', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [1] } });
        await classService.getEnrolledStudentIdsByClass(1);
        expect(mock.get).toHaveBeenCalledWith('/classes/1/enrolled-student-ids');
    });
});

describe('semesterService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getSemesters - GET /semesters', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await semesterService.getSemesters();
        expect(mock.get).toHaveBeenCalledWith('/semesters');
    });

    it('getAllSemesters - GET /semesters/all', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await semesterService.getAllSemesters();
        expect(mock.get).toHaveBeenCalledWith('/semesters/all');
    });

    it('createSemester - POST /semesters', async () => {
        const data = { name: 'HK1' };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await semesterService.createSemester(data as any);
        expect(mock.post).toHaveBeenCalledWith('/semesters', data);
    });

    it('updateSemester - PUT /semesters/:id', async () => {
        const data = { name: 'HK2' };
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await semesterService.updateSemester(1, data as any);
        expect(mock.put).toHaveBeenCalledWith('/semesters/1', data);
    });

    it('deleteSemester - DELETE /semesters/:id', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await semesterService.deleteSemester(1);
        expect(mock.delete).toHaveBeenCalledWith('/semesters/1');
    });
});

describe('subjectService', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getSubjects - GET /subjects', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await subjectService.getSubjects();
        expect(mock.get).toHaveBeenCalledWith('/subjects');
    });

    it('getAllSubjects - GET /subjects/all', async () => {
        mock.get.mockResolvedValueOnce({ data: { data: [] } });
        await subjectService.getAllSubjects();
        expect(mock.get).toHaveBeenCalledWith('/subjects/all');
    });

    it('createSubject - POST /subjects', async () => {
        const data = { name: 'Math' };
        mock.post.mockResolvedValueOnce({ data: { data: {} } });
        await subjectService.createSubject(data as any);
        expect(mock.post).toHaveBeenCalledWith('/subjects', data);
    });

    it('updateSubject - PUT /subjects/:id', async () => {
        const data = { name: 'Physics' };
        mock.put.mockResolvedValueOnce({ data: { data: {} } });
        await subjectService.updateSubject(1, data as any);
        expect(mock.put).toHaveBeenCalledWith('/subjects/1', data);
    });

    it('deleteSubject - DELETE /subjects/:id', async () => {
        mock.delete.mockResolvedValueOnce({ data: { data: null } });
        await subjectService.deleteSubject(1);
        expect(mock.delete).toHaveBeenCalledWith('/subjects/1');
    });
});
