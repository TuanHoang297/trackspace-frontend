/* Contribution Design Tokens & Utilities */

export const GRADIENTS = {
    gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
    silver: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
    bronze: 'linear-gradient(135deg, #CD7F32, #B8860B)',
    blue: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    green: 'linear-gradient(135deg, #10B981, #059669)',
    purple: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    amber: 'linear-gradient(135deg, #F59E0B, #D97706)',
    header: 'linear-gradient(135deg, #0F172A 0%, #1E2A4A 50%, #2D3A5C 100%)',
};

export const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
    '#EF4444', '#EC4899', '#06B6D4', '#6366F1',
];

export const DOMAIN_META: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    FRONTEND: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Frontend', icon: '' },
    BACKEND: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Backend', icon: '' },
    BOTH: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Full Stack', icon: '' },
    UNKNOWN: { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: 'Unassigned', icon: '' },
};

export const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};
