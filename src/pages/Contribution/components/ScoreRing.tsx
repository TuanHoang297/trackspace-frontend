import React from 'react';
import { Box, Typography } from '@mui/material';

interface ScoreRingProps {
    score: number;
    size?: number;
    thickness?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 72, thickness = 5 }) => {
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (Math.min(score, 100) / 100) * circumference;
    const color = score >= 30 ? '#10B981' : score >= 20 ? '#F59E0B' : score >= 10 ? '#EF4444' : '#94A3B8';

    return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id={`ring-${score}-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={thickness} />
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={`url(#ring-${score}-${size})`} strokeWidth={thickness}
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
            </svg>
            <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography fontWeight={800} fontSize={size * 0.28}
                    sx={{ fontFamily: "'Inter', sans-serif", color, lineHeight: 1 }}>
                    {Math.round(score)}
                </Typography>
                <Typography fontSize={size * 0.11} color="text.secondary" fontWeight={600}
                    sx={{ lineHeight: 1, mt: 0.2, letterSpacing: '0.02em' }}>
                    %
                </Typography>
            </Box>
        </Box>
    );
};

export default ScoreRing;
