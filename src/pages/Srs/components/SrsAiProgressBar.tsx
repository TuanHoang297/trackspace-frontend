import React from 'react';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';
import { ESTIMATED_SECONDS } from '../hooks/useSrsAiProgress';

interface AiProgressBarProps {
    aiProgress: number;
    aiStage: string;
    aiElapsed: number;
}

/** Full progress box — used in Empty State */
export const SrsAiProgressBox: React.FC<AiProgressBarProps> = ({ aiProgress, aiStage, aiElapsed }) => (
    <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto', mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, justifyContent: 'center' }}>
            <CircularProgress size={20} sx={{ color: '#8B5CF6' }} />
            <Typography fontWeight={600} sx={{ color: '#6D28D9' }}>AI đang tạo SRS...</Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={aiProgress}
            sx={{
                height: 8, borderRadius: 4, mb: 1.5,
                bgcolor: '#EDE9FE',
                '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6', borderRadius: 4 }
            }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">{aiStage}</Typography>
            <Typography variant="caption" color="text.secondary">{aiElapsed}s / ~{ESTIMATED_SECONDS}s</Typography>
        </Box>
    </Box>
);

/** Inline progress bar — used below header in main view */
export const SrsAiProgressInline: React.FC<AiProgressBarProps> = ({ aiProgress, aiStage, aiElapsed }) => (
    <Box sx={{ px: 3, py: 1.5, bgcolor: '#F5F3FF', borderBottom: '1px solid #DDD6FE', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <CircularProgress size={14} sx={{ color: '#8B5CF6' }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: '#6D28D9' }}>{aiStage}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{aiElapsed}s / ~{ESTIMATED_SECONDS}s</Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={aiProgress}
            sx={{
                height: 4, borderRadius: 2,
                bgcolor: '#EDE9FE',
                '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6', borderRadius: 2 }
            }}
        />
    </Box>
);
