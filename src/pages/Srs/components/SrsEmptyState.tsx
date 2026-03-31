import React from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { SrsAiProgressBox } from './SrsAiProgressBar';
import SrsSupplementForm from './SrsSupplementForm';

interface SrsEmptyStateProps {
    readOnly: boolean;
    isPending: boolean;
    aiProgress: number;
    aiStage: string;
    aiElapsed: number;
    showSupplement: boolean;
    setShowSupplement: (v: boolean) => void;
    supplementInfo: string;
    setSupplementInfo: (v: string) => void;
    onGenerate: () => void;
    generateError: string | null;
    setGenerateError: (v: string | null) => void;
}

const SrsEmptyState: React.FC<SrsEmptyStateProps> = ({
    readOnly, isPending, aiProgress, aiStage, aiElapsed,
    showSupplement, setShowSupplement,
    supplementInfo, setSupplementInfo,
    onGenerate, generateError, setGenerateError,
}) => (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC' }} elevation={0}>
            <DescriptionIcon sx={{ fontSize: 60, color: '#94A3B8', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: '#1E293B' }}>
                Tài liệu SRS
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                Chưa có tài liệu Software Requirements Specification nào. AI sẽ tự động tạo dựa trên dữ liệu Jira của project.
            </Typography>

            {!readOnly ? (
                isPending ? (
                    <SrsAiProgressBox aiProgress={aiProgress} aiStage={aiStage} aiElapsed={aiElapsed} />
                ) : (
                    <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Button
                                size="small"
                                onClick={() => setShowSupplement(!showSupplement)}
                                endIcon={showSupplement ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{ textTransform: 'none', color: '#6D28D9', fontWeight: 600 }}
                            >
                                📝 Thông tin bổ sung (tùy chọn)
                            </Button>
                        </Box>
                        <SrsSupplementForm
                            show={showSupplement}
                            onClose={() => setShowSupplement(false)}
                            supplementInfo={supplementInfo}
                            setSupplementInfo={setSupplementInfo}
                            variant="empty"
                        />
                        <Box sx={{ textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AutoFixHighIcon />}
                                onClick={onGenerate}
                                sx={{
                                    textTransform: 'none', px: 4, py: 1.5, borderRadius: 2, fontWeight: 600,
                                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                                    '&:hover': { background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }
                                }}
                            >
                                ✨ Tạo SRS bằng AI
                            </Button>
                        </Box>
                    </Box>
                )
            ) : (
                <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>
                    Chỉ Leader mới có quyền tạo SRS.
                </Typography>
            )}
            {generateError && (
                <Alert severity="error" sx={{ mt: 3, textAlign: 'left', borderRadius: 2 }} onClose={() => setGenerateError(null)}>
                    <strong>AI không thể tạo SRS</strong><br />{generateError}
                </Alert>
            )}
        </Paper>
    </Box>
);

export default SrsEmptyState;
