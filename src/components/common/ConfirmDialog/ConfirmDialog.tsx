import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Alert,
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: 'error' | 'warning' | 'info';
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    severity = 'warning',
    loading = false,
    onConfirm,
    onCancel,
}) => {
    const confirmColor = severity === 'error' ? 'error' : 'primary';

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                {typeof message === 'string' ? (
                    <Typography>{message}</Typography>
                ) : (
                    message
                )}
                {severity !== 'info' && (
                    <Alert severity={severity} sx={{ mt: 2, borderRadius: 2 }}>
                        Hành động này không thể hoàn tác.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                    {cancelLabel}
                </Button>
                <Button
                    variant="contained"
                    color={confirmColor}
                    onClick={onConfirm}
                    disabled={loading}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                    {loading ? 'Đang xử lý...' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
