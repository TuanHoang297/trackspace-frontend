import React from 'react';
import { Box, Typography, Paper, Button, Tooltip, CircularProgress } from '@mui/material';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import type { SrsVisionRequest } from '../../../types/srs.types';

const VISION_ITEMS: { type: SrsVisionRequest['type']; label: string; emoji: string }[] = [
    { type: 'usecase', label: 'Use Case', emoji: '🔄' },
    { type: 'screenflow', label: 'Screen Flow', emoji: '🖥️' },
    { type: 'db_schema', label: 'DB Schema', emoji: '🗄️' },
    { type: 'mockup', label: 'Mockup', emoji: '📱' },
];

interface SrsVisionBarProps {
    onDescribeImage: (imageType: SrsVisionRequest['type']) => void;
    visionLoading: boolean;
}

const SrsVisionBar: React.FC<SrsVisionBarProps> = ({ onDescribeImage, visionLoading }) => (
    <Paper
        elevation={0}
        sx={{
            px: 2, py: 1,
            display: 'flex', alignItems: 'center', gap: 1,
            borderTop: '1px solid #BBF7D0',
            bgcolor: '#F0FDF4',
            flexShrink: 0,
            flexWrap: 'wrap',
        }}
    >
        <Tooltip title="Upload ảnh để AI phân tích và sinh nội dung SRS" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5 }}>
                <ImageSearchIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: '#15803D' }}>
                    AI Mô tả:
                </Typography>
            </Box>
        </Tooltip>
        {VISION_ITEMS.map((item) => (
            <Button
                key={item.type}
                variant="outlined"
                size="small"
                onClick={() => onDescribeImage(item.type)}
                disabled={visionLoading}
                startIcon={visionLoading ? <CircularProgress size={12} /> : undefined}
                sx={{
                    textTransform: 'none', borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem',
                    borderColor: '#86EFAC', color: '#15803D', bgcolor: 'white', py: 0.3,
                    '&:hover': { borderColor: '#22C55E', bgcolor: '#F0FDF4' }
                }}
            >
                {item.emoji} {item.label}
            </Button>
        ))}
    </Paper>
);

export default SrsVisionBar;
