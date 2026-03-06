import axiosClient from '../axiosClient';
import type {
    ApiResponse,
    ClassResponse,
    CreateClassRequest,
    UpdateClassRequest,
    StudentInClassResponse,
    SemesterResponse,
    SemesterRequest,
    SubjectResponse,
    SubjectRequest,
} from '../types/types';

const classService = {
    getClasses: () =>
        axiosClient.get<ApiResponse<ClassResponse[]>>('/classes'),

    getClassById: (classId: number) =>
        axiosClient.get<ApiResponse<ClassResponse>>(`/classes/${classId}`),

    createClass: (data: CreateClassRequest) =>
        axiosClient.post<ApiResponse<ClassResponse>>('/classes', data),

    updateClass: (classId: number, data: UpdateClassRequest) =>
        axiosClient.put<ApiResponse<ClassResponse>>(`/classes/${classId}`, data),

    deleteClass: (classId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/classes/${classId}`),

    assignLecturer: (classId: number, lecturerId: number) =>
        axiosClient.put<ApiResponse<ClassResponse>>(`/classes/${classId}/lecturer`, { lecturerId }),

    getStudents: (classId: number) =>
        axiosClient.get<ApiResponse<StudentInClassResponse[]>>(`/classes/${classId}/students`),

    addStudent: (classId: number, studentId: number) =>
        axiosClient.post<ApiResponse<StudentInClassResponse>>(`/classes/${classId}/students`, { studentId }),

    removeStudent: (classId: number, studentId: number) =>
        axiosClient.delete<ApiResponse<void>>(`/classes/${classId}/students/${studentId}`),

    getEnrolledStudentIds: () =>
        axiosClient.get<ApiResponse<number[]>>('/classes/enrolled-student-ids'),
};

export const semesterService = {
    getSemesters: () =>
        axiosClient.get<ApiResponse<SemesterResponse[]>>('/semesters'),

    getAllSemesters: () =>
        axiosClient.get<ApiResponse<SemesterResponse[]>>('/semesters/all'),

    createSemester: (data: SemesterRequest) =>
        axiosClient.post<ApiResponse<SemesterResponse>>('/semesters', data),

    updateSemester: (id: number, data: SemesterRequest) =>
        axiosClient.put<ApiResponse<SemesterResponse>>(`/semesters/${id}`, data),

    deleteSemester: (id: number) =>
        axiosClient.delete<ApiResponse<void>>(`/semesters/${id}`),
};

export const subjectService = {
    getSubjects: () =>
        axiosClient.get<ApiResponse<SubjectResponse[]>>('/subjects'),

    getAllSubjects: () =>
        axiosClient.get<ApiResponse<SubjectResponse[]>>('/subjects/all'),

    createSubject: (data: SubjectRequest) =>
        axiosClient.post<ApiResponse<SubjectResponse>>('/subjects', data),

    updateSubject: (id: number, data: SubjectRequest) =>
        axiosClient.put<ApiResponse<SubjectResponse>>(`/subjects/${id}`, data),

    deleteSubject: (id: number) =>
        axiosClient.delete<ApiResponse<void>>(`/subjects/${id}`),
};

export default classService;
