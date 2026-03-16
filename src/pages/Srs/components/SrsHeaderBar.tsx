import React from 'react';
import {
    Box, Typography, Paper, Button, Chip, MenuItem, Select, FormControl,
    CircularProgress, Tooltip, IconButton, Divider
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { SrsDocumentResponse } from '../../../types/srs.types';

interface SrsHeaderBarProps {
    activeSrs: SrsDocumentResponse | null | undefined;
    latestSrs: SrsDocumentResponse | null | undefined;
    versions: SrsDocumentResponse[];
    selectedVersionId: number | '';
    setSelectedVersionId: (v: number | '') => void;
    isLatest: boolean;
    readOnly: boolean;
    showSupplement: boolean;
    setShowSupplement: (v: boolean) => void;
    isGenerating: boolean;
    isUpdating: boolean;
    onGenerate: () => void;
    onSave: () => void;
    onExportPdf: () => void;
    onExportDocx: () => void;
}

const SrsHeaderBar: React.FC<SrsHeaderBarProps> = ({
    activeSrs, latestSrs, versions, selectedVersionId, setSelectedVersionId,
    isLatest, readOnly, showSupplement, setShowSupplement,
    isGenerating, isUpdating, onGenerate, onSave, onExportPdf, onExportDocx,
}) => (
    <Paper
        elevation={0}
        sx={{
            px: 3, py: 1.5,
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: 'white',
            zIndex: 5,
            flexShrink: 0,
        }}
    >
        {/* Left: Title + version */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: '#1E293B' }}>
                {activeSrs?.title || 'SRS Document'}
            </Typography>
            <Chip label={`v${activeSrs?.versionNumber}`} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
            {activeSrs?.generatedByAi && (
                <Chip label="AI" size="small" sx={{ bgcolor: '#F3E8FF', color: '#9333EA', fontWeight: 700, fontSize: '0.65rem' }} />
            )}
            {versions.length > 1 && latestSrs && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                        value={selectedVersionId}
                        onChange={(e) => setSelectedVersionId(e.target.value as number | '')}
                        displayEmpty
                        sx={{ bgcolor: 'white', borderRadius: 1.5, fontSize: '0.8rem', height: 32 }}
                    >
                        <MenuItem value="">Mới nhất (v{latestSrs.versionNumber})</MenuItem>
                        {versions.filter(v => v.id !== latestSrs.id).map(v => (
                            <MenuItem key={v.id} value={v.id}>Version {v.versionNumber}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>

        {/* Right: Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            {!readOnly && isLatest && (
                <>
                    {/* Supplement form toggle */}
                    <Tooltip title="Thông tin bổ sung cho AI" arrow>
                        <IconButton
                            size="small"
                            onClick={() => setShowSupplement(!showSupplement)}
                            sx={{
                                border: '1px solid #E2E8F0', borderRadius: 1.5,
                                color: showSupplement ? '#7C3AED' : '#64748B',
                                bgcolor: showSupplement ? '#F5F3FF' : 'transparent',
                            }}
                        >
                            <ExpandMoreIcon sx={{ fontSize: 18, transform: showSupplement ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={isGenerating ? <CircularProgress size={14} /> : <AutoFixHighIcon sx={{ fontSize: 16 }} />}
                        onClick={onGenerate}
                        disabled={isGenerating || isUpdating}
                        sx={{
                            textTransform: 'none', borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem',
                            borderColor: '#DDD6FE', color: '#7C3AED',
                            '&:hover': { borderColor: '#A78BFA', bgcolor: '#F5F3FF' }
                        }}
                    >
                        {isGenerating ? 'Đang tạo...' : 'Tạo AI'}
                    </Button>
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                </>
            )}
            <Button
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfIcon sx={{ color: '#EF4444', fontSize: 16 }} />}
                onClick={onExportPdf}
                sx={{
                    textTransform: 'none', borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem',
                    borderColor: '#E2E8F0', color: '#1E293B',
                    '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                }}
            >
                PDF
            </Button>
            <Button
                variant="outlined"
                size="small"
                startIcon={<DescriptionOutlinedIcon sx={{ color: '#2563EB', fontSize: 16 }} />}
                onClick={onExportDocx}
                sx={{
                    textTransform: 'none', borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem',
                    borderColor: '#E2E8F0', color: '#1E293B',
                    '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                }}
            >
                DOCX
            </Button>
            {!readOnly && isLatest && (
                <Button
                    variant="contained"
                    size="small"
                    startIcon={isUpdating ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
                    onClick={onSave}
                    disabled={isUpdating || isGenerating}
                    sx={{
                        textTransform: 'none', borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem', px: 2.5,
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        '&:hover': { background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }
                    }}
                >
                    {isUpdating ? 'Đang lưu...' : 'Lưu'}
                </Button>
            )}
        </Box>
    </Paper>
);

export default SrsHeaderBar;
