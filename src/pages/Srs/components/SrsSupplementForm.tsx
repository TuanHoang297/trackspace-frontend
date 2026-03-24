import React from 'react';
import { Box, TextField, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SrsSupplementFormProps {
    show: boolean;
    onClose: () => void;
    supplementInfo: string;
    setSupplementInfo: (v: string) => void;
    /** 'empty' = vertical layout (empty state), 'inline' = dialog (header) */
    variant?: 'empty' | 'inline';
}

const SrsSupplementForm: React.FC<SrsSupplementFormProps> = ({
    show, onClose, supplementInfo, setSupplementInfo, variant = 'empty'
}) => {
    if (variant === 'inline') {
        return (
            <Dialog
                open={show}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ py: 1.5, px: 3, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
                    Thông tin bổ sung
                    <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <Box sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 1.5 }}>
                        Nhập thông tin bổ sung để AI tạo SRS chính xác hơn. VD: business rules, non-screen functions, constraints...
                    </Box>
                    <TextField
                        placeholder="Nhập thông tin bổ sung..."
                        multiline rows={5}
                        value={supplementInfo}
                        onChange={(e) => setSupplementInfo(e.target.value)}
                        size="small" fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 1.5 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #F1F5F9' }}>
                    <Button onClick={onClose} size="small" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: 1.5, px: 3 }} variant="contained">
                        Xong
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Collapse in={show}>
            <Box sx={{ mb: 3 }}>
                <Box sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 1 }}>
                    Nhập thông tin bổ sung để AI tạo SRS chính xác hơn (tùy chọn)
                </Box>
                <TextField
                    placeholder="Nhập thông tin bổ sung..."
                    multiline rows={3}
                    value={supplementInfo}
                    onChange={(e) => setSupplementInfo(e.target.value)}
                    size="small" fullWidth
                    sx={{ bgcolor: 'white' }}
                />
            </Box>
        </Collapse>
    );
};

export default SrsSupplementForm;
