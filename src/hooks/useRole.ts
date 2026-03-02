import { getUser } from '../utils/auth';

/**
 * Hook to check current user's role.
 * Role is stored in localStorage by the auth service.
 */
export const useRole = () => {
    const user = getUser();
    const role = user?.role ?? '';

    return {
        role,
        isLecturer: () => role === 'LECTURER',
        isAdmin: () => role === 'ADMIN',
        isTeamLeader: () => role === 'TEAMLEADER',
        isTeamMember: () => role === 'TEAMMEMBER',
        /** Lecturer has read-only access — no CRUD allowed */
        isReadOnly: () => role === 'LECTURER',
    };
};
