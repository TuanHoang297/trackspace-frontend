// ==================== Subject ====================

export interface SubjectResponse {
    id: number;
    subjectCode: string;
    subjectName: string;
    description: string | null;
    active: boolean;
    createdAt: string;
}

export interface SubjectRequest {
    subjectCode: string;
    subjectName: string;
    description?: string;
}

// ==================== Semester ====================

export interface SemesterResponse {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    active: boolean;
    createdAt: string;
}

export interface SemesterRequest {
    name: string;
    startDate: string | null;
    endDate: string | null;
}

// ==================== Classroom ====================

export interface ClassResponse {
    id: number;
    subjectId: number | null;
    subjectCode: string | null;
    subjectName: string | null;
    classCode: string;
    semesterId: number | null;
    semesterName: string | null;
    lecturerId: number | null;
    lecturerName: string | null;
    lecturerEmail: string | null;
    totalStudents: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClassRequest {
    subjectId: number | null;
    classCode: string;
    semesterId: number | null;
    lecturerId: number | null;
}

export interface UpdateClassRequest {
    subjectId?: number | null;
    semesterId?: number | null;
    active?: boolean;
    lecturerId?: number | null;
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
