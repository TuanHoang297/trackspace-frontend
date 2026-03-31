import React from 'react';
import { Box, Typography } from '@mui/material';

interface MiniProgressProps {
    label: string;
    value: number;
    color: string;
}

const MiniProgress: React.FC<MiniProgressProps> = ({ label, value, color }) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography fontSize="0.75rem" color="text.secondary" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>{label}</Typography>
                <Typography fontSize="0.75rem" fontWeight={800} sx={{ color, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', ml: 0.5 }}>
                    {Math.round(safeValue)}
                </Typography>
            </Box>
            <Box sx={{ height: 5, borderRadius: 3, bgcolor: `${color}12`, overflow: 'hidden' }}>
                <Box sx={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.max(0, Math.min(safeValue, 100))}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}BB)`,
                    transition: 'width 0.8s ease',
                }} />
            </Box>
        </Box>
    );
};

export default MiniProgress;
