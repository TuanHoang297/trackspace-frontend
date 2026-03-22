export enum UserRole {
    ADMIN = 'ADMIN',
    LECTURER = 'LECTURER',
    STUDENT = 'STUDENT',
}

export enum IssueStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    DONE = 'DONE',
}

export enum IssueType {
    EPIC = 'EPIC',
    STORY = 'STORY',
    TASK = 'TASK',
    BUG = 'BUG',
}

export enum SprintStatus {
    FUTURE = 'FUTURE',
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
}

export enum ConnectionStatus {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR',
}
