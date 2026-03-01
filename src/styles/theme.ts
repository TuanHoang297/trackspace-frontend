import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#3B82F6',
            light: '#93C5FD',
            dark: '#2563EB',
        },
        secondary: {
            main: '#8B5CF6',
            light: '#C4B5FD',
            dark: '#7C3AED',
        },
        success: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
        },
        warning: {
            main: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
        },
        error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
        },
        background: {
            default: '#F8FAFC',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
        },
        divider: '#E2E8F0',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' },
        h2: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' },
        h3: { fontSize: '1.75rem', fontWeight: 700 },
        h4: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
        h5: { fontSize: '1.25rem', fontWeight: 700 },
        h6: { fontSize: '1.1rem', fontWeight: 700 },
        body1: { fontSize: '0.938rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    padding: '8px 20px',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    },
                    '&:disabled': {
                        background: '#E2E8F0',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                    border: '1px solid #E2E8F0',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        backgroundColor: '#F8FAFC',
                        color: '#64748B',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #E2E8F0',
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: '#F8FAFC',
                    },
                    '&:last-child td': {
                        borderBottom: 0,
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    '& fieldset': {
                        borderColor: '#E2E8F0',
                    },
                    '&:hover fieldset': {
                        borderColor: '#93C5FD',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(248,250,252,0.9)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid #E2E8F0',
                    boxShadow: 'none',
                },
            },
        },
    },
});
