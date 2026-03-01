import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#4F6BF6',
            light: '#7B8FFF',
            dark: '#3A51D4',
        },
        secondary: {
            main: '#7C3AED',
            light: '#A78BFA',
            dark: '#5B21B6',
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
            default: '#F5F6FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
        },
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
                    boxShadow: '0 2px 8px rgba(79,107,246,0.3)',
                    '&:hover': {
                        boxShadow: '0 4px 14px rgba(79,107,246,0.4)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.05)',
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
    },
});
