import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { AVATAR_COLORS } from './constants';
import type { ContributionResponse } from '../../../types/contribution.types';

interface ContributionDonutProps {
    members: ContributionResponse[];
    totalRawScore: number;
}

const ContributionDonut: React.FC<ContributionDonutProps> = ({ members, totalRawScore }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 110;
    const innerR = 70;

    const slices = members.map((m, i) => ({
        name: m.fullName,
        percent: totalRawScore > 0 ? (m.contributionScore / totalRawScore) * 100 : 0,
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    }));

    let cumulative = 0;

    const polarToCart = (angle: number, r: number) => ({
        x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
        y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
    });

    const renderSlice = (slice: typeof slices[0], idx: number) => {
        const startAngle = (cumulative / 100) * 360;
        const sweep = (slice.percent / 100) * 360;
        cumulative += slice.percent;

        if (slice.percent <= 0) return null;

        const isHovered = hoveredIdx === idx;
        const effectiveOuterR = isHovered ? outerR + 6 : outerR;

        const s1 = polarToCart(startAngle, innerR);
        const s2 = polarToCart(startAngle, effectiveOuterR);
        const e1 = polarToCart(startAngle + sweep, innerR);
        const e2 = polarToCart(startAngle + sweep, effectiveOuterR);

        const largeArc = sweep > 180 ? 1 : 0;

        const d = [
            `M ${s1.x} ${s1.y}`,
            `L ${s2.x} ${s2.y}`,
            `A ${effectiveOuterR} ${effectiveOuterR} 0 ${largeArc} 1 ${e2.x} ${e2.y}`,
            `L ${e1.x} ${e1.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${s1.x} ${s1.y}`,
            'Z',
        ].join(' ');

        return (
            <path
                key={idx}
                d={d}
                fill={slice.color}
                opacity={hoveredIdx !== null && !isHovered ? 0.4 : 1}
                style={{
                    transition: 'opacity 0.2s, d 0.2s',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 2px 8px ${slice.color}60)` : 'none',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
            />
        );
    };

    cumulative = 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {slices.map((s, i) => renderSlice(s, i))}
                </svg>
                {/* Center text */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    {hoveredIdx !== null ? (
                        <>
                            <Typography fontWeight={800} fontSize="1.3rem"
                                sx={{ fontFamily: "'Inter', sans-serif", color: slices[hoveredIdx].color, lineHeight: 1 }}>
                                {slices[hoveredIdx].percent.toFixed(1)}%
                            </Typography>
                            <Typography fontSize="0.68rem" color="text.secondary" fontWeight={600}
                                sx={{ mt: 0.3, maxWidth: 90, textAlign: 'center', lineHeight: 1.2 }}>
                                {slices[hoveredIdx].name}
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Typography fontWeight={800} fontSize="1.2rem"
                                sx={{ fontFamily: "'Inter', sans-serif", color: '#1E293B', lineHeight: 1 }}>
                                {members.length}
                            </Typography>
                            <Typography fontSize="0.72rem" color="text.secondary" fontWeight={600} sx={{ mt: 0.2 }}>
                                members
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ContributionDonut;
