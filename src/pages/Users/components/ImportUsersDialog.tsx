import React, { useState, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Alert, LinearProgress,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import adminService from '../../../api/services/adminService';

interface ImportError {
    row: number;
    email: string;
    reason: string;
}

interface SuccessEntry {
    row: number;
    email: string;
    fullName: string;
    role: string;
}

interface ImportResultData {
    totalRows: number;
    successCount: number;
    failedCount: number;
    successes: SuccessEntry[];
    errors: ImportError[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ImportUsersDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResultData | null>(null);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setFile(null); setResult(null); setError(''); setDragOver(false);
    };

    const handleClose = () => {
        if (result && result.successCount > 0) onSuccess();
        reset();
        onClose();
    };

    const handleFile = (f: File) => {
        if (!f.name.toLowerCase().endsWith('.xlsx')) {
            setError('Chỉ chấp nhận file Excel (.xlsx)');
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError('File quá lớn. Tối đa 5MB');
            return;
        }
        setError('');
        setFile(f);
        setResult(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await adminService.importUsers(file);
            setResult(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Import thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await adminService.downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'import_users_template.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            setError('Không thể tải file mẫu');
        }
    };

    const ROLE_LABELS: Record<string, string> = { LECTURER: 'Giảng viên', STUDENT: 'Sinh viên' };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                Import tài khoản từ Excel
            </DialogTitle>

            <DialogContent>
                {/* Download template */}
                <Button
                    size="small" startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                    sx={{ textTransform: 'none', mb: 2, borderRadius: 2 }}
                >
                    Tải file mẫu (.xlsx)
                </Button>

                {!result && (
                    <>
                        {/* Drop zone */}
                        <Box
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            sx={{
                                border: '2px dashed',
                                borderColor: dragOver ? 'primary.main' : 'divider',
                                borderRadius: 3,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                bgcolor: dragOver ? 'rgba(59,130,246,0.04)' : 'transparent',
                                transition: 'all 0.2s ease',
                                '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(59,130,246,0.04)' },
                            }}
                        >
                            <input
                                ref={inputRef} type="file" hidden
                                accept=".xlsx"
                                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                            />
                            {file ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <InsertDriveFileIcon sx={{ color: '#10B981', fontSize: 28 }} />
                                    <Typography fontWeight={600}>{file.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({(file.size / 1024).toFixed(0)} KB)
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography fontWeight={600}>
                                        Kéo thả hoặc click để chọn file
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Chỉ chấp nhận file .xlsx, tối đa 5MB
                                    </Typography>
                                </>
                            )}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                            Cột bắt buộc: <b>email</b>, <b>fullName</b>, <b>role</b> (LECTURER/STUDENT).
                            Cột tùy chọn: <b>studentCode</b>. Mật khẩu mặc định: <b>password123</b>
                        </Typography>
                    </>
                )}

                {loading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

                {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

                {/* Result */}
                {result && (
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Chip
                                icon={<CheckCircleIcon />}
                                label={`${result.successCount} thành công`}
                                color="success" variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                            {result.failedCount > 0 && (
                                <Chip
                                    icon={<ErrorIcon />}
                                    label={`${result.failedCount} thất bại`}
                                    color="error" variant="outlined"
                                    sx={{ fontWeight: 600 }}
                                />
                            )}
                            <Chip
                                label={`Tổng: ${result.totalRows} dòng`}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>

                        {/* Success table */}
                        {result.successes && result.successes.length > 0 && (
                            <>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#16A34A', fontWeight: 700 }}>
                                    ✅ Danh sách thành công
                                </Typography>
                                <TableContainer component={Paper} variant="outlined"
                                    sx={{ borderRadius: 2, maxHeight: 200, mb: 2, borderColor: '#BBF7D0' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Dòng</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Họ tên</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Vai trò</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {result.successes.map((s, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{s.row}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.email}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.fullName}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>
                                                        <Chip label={ROLE_LABELS[s.role] || s.role} size="small"
                                                            sx={{ fontSize: '0.7rem', height: 20 }} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}

                        {/* Error table */}
                        {result.errors.length > 0 && (
                            <>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#DC2626', fontWeight: 700 }}>
                                    ❌ Danh sách thất bại
                                </Typography>
                                <TableContainer component={Paper} variant="outlined"
                                    sx={{ borderRadius: 2, maxHeight: 200, borderColor: '#FECACA' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Dòng</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Lỗi</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {result.errors.map((err, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{err.row}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{err.email || '—'}</TableCell>
                                                    <TableCell sx={{ color: 'error.main', fontSize: '0.8rem' }}>
                                                        {err.reason}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={handleClose} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    {result ? 'Đóng' : 'Hủy'}
                </Button>
                {!result && (
                    <Button
                        variant="contained"
                        onClick={handleImport}
                        disabled={!file || loading}
                        startIcon={<CloudUploadIcon />}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        {loading ? 'Đang import...' : 'Import'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ImportUsersDialog;
