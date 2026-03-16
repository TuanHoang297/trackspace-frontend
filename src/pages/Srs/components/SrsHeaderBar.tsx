import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button, Chip, MenuItem, Select, FormControl,
    CircularProgress, Tooltip, IconButton, Menu, ListItemIcon, ListItemText
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
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
}) => {
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    return (
        <Paper
            elevation={0}
            sx={{
                px: 3, py: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
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
                                    border: '1px solid',
                                    borderColor: showSupplement ? '#7C3AED' : '#E2E8F0',
                                    borderRadius: 1.5,
                                    color: showSupplement ? '#7C3AED' : '#64748B',
                                    bgcolor: showSupplement ? '#F5F3FF' : 'transparent',
                                    '&:hover': { bgcolor: '#F5F3FF', borderColor: '#A78BFA' },
                                }}
                            >
                                <EditNoteIcon sx={{ fontSize: 18 }} />
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
                            {isGenerating ? 'Đang tạo...' : 'Generate'}
                        </Button>
                    </>
                )}

                {/* Export dropdown */}
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
                    sx={{
                        textTransform: 'none', borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem',
                        borderColor: '#E2E8F0', color: '#1E293B',
                        '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                    }}
                >
                    Export
                </Button>
                <Menu
                    anchorEl={exportAnchor}
                    open={Boolean(exportAnchor)}
                    onClose={() => setExportAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { minWidth: 160, mt: 0.5, borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } } }}
                >
                    <MenuItem onClick={() => { onExportPdf(); setExportAnchor(null); }}>
                        <ListItemIcon><PictureAsPdfIcon sx={{ color: '#EF4444', fontSize: 18 }} /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}>PDF</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { onExportDocx(); setExportAnchor(null); }}>
                        <ListItemIcon><DescriptionOutlinedIcon sx={{ color: '#2563EB', fontSize: 18 }} /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}>DOCX</ListItemText>
                    </MenuItem>
                </Menu>

                {/* Save button */}
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
};

export default SrsHeaderBar;
