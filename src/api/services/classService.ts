import axiosClient from '../axiosClient';
import type {
    ApiResponse,
    ClassResponse,
    CreateClassRequest,
    UpdateClassRequest,
    StudentInClassResponse,
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

export default classService;
