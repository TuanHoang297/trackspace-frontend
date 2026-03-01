import React from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    sx?: SxProps<Theme>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    actionLabel,
    onAction,
    sx,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                ...sx,
            }}
        >
            <Box>
                <Typography variant="h4" fontWeight={700}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {actionLabel && onAction && (
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAction}
                    sx={{ borderRadius: 2, py: 1.2, px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
};

export default PageHeader;
