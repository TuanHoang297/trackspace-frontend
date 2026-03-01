// ==================== Classroom ====================

export interface ClassResponse {
    id: number;
    className: string;
    classCode: string;
    semester: string;
    lecturerId: number | null;
    lecturerName: string | null;
    lecturerEmail: string | null;
    totalStudents: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClassRequest {
    className: string;
    classCode: string;
    semester: string;
}

export interface UpdateClassRequest {
    className?: string;
    semester?: string;
    active?: boolean;
}

export interface AssignLecturerRequest {
    lecturerId: number;
}

export interface StudentInClassResponse {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    email: string;
    studentCode: string | null;
    groupId: number | null;
    groupName: string | null;
    enrolledAt: string;
}
