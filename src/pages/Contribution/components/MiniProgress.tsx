import React from 'react';
import { Box, Typography } from '@mui/material';

interface MiniProgressProps {
    label: string;
    value: number;
    color: string;
}

const MiniProgress: React.FC<MiniProgressProps> = ({ label, value, color }) => (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography fontSize="0.72rem" color="text.secondary" fontWeight={600}>{label}</Typography>
            <Typography fontSize="0.72rem" fontWeight={800} sx={{ color, fontFamily: "'Inter', sans-serif" }}>
                {Math.round(value)}
            </Typography>
        </Box>
        <Box sx={{ height: 5, borderRadius: 3, bgcolor: `${color}12`, overflow: 'hidden' }}>
            <Box sx={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(value, 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}BB)`,
                transition: 'width 0.8s ease',
            }} />
        </Box>
    </Box>
);

export default MiniProgress;
