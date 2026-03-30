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
import * as XLSX from 'xlsx';
import classService from '../../../api/services/classService';
import { UserResponse } from '../../../api/types/types';

interface ImportError {
    row: number;
    email: string;
    studentCode?: string;
    fullName?: string;
    reason: string;
}

interface SuccessEntry {
    row: number;
    email: string;
    fullName: string;
    studentCode: string;
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
    targetClassId: number;
    allUsers: UserResponse[];
    enrolledIds: Set<number>;
    sameSubjectEnrolledIds: Set<number>;
}

const ImportStudentsExcelDialog: React.FC<Props> = ({ open, onClose, onSuccess, targetClassId, allUsers, enrolledIds, sameSubjectEnrolledIds }) => {
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
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json<any>(ws);

                    const successes: SuccessEntry[] = [];
                    const errors: ImportError[] = [];
                    
                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        const email = (row.Email || row.email || '').toString().trim().toLowerCase();
                        const rawStudentCode = (row.MSSV || row['Mssv'] || row.studentCode || '').toString().trim();
                        const rawFullName = (row['Họ tên'] || row['họ tên'] || row.fullName || '').toString().trim();

                        const matchedUser = allUsers.find(u => u.email.toLowerCase() === email);
                        
                        const displayMssv = matchedUser?.studentCode || rawStudentCode;
                        const displayName = matchedUser?.fullName || rawFullName;
                        
                        if (!email) {
                            errors.push({ row: i + 2, email: 'Trống', studentCode: displayMssv, fullName: displayName, reason: 'Không có cột Email hoặc email trống' });
                            continue;
                        }

                        if (!matchedUser) {
                            errors.push({ row: i + 2, email, studentCode: displayMssv, fullName: displayName, reason: 'Không tìm thấy tài khoản hệ thống' });
                            continue;
                        }

                        if (matchedUser.role !== 'STUDENT') {
                            errors.push({ row: i + 2, email, studentCode: displayMssv, fullName: displayName, reason: 'Tài khoản không phải sinh viên' });
                            continue;
                        }

                        if (enrolledIds.has(matchedUser.userId)) {
                            errors.push({ row: i + 2, email, studentCode: displayMssv, fullName: displayName, reason: 'Sinh viên đã vào lớp' });
                            continue;
                        }

                        if (sameSubjectEnrolledIds.has(matchedUser.userId)) {
                            errors.push({ row: i + 2, email, studentCode: displayMssv, fullName: displayName, reason: 'Đã học lớp khác cùng môn' });
                            continue;
                        }

                        if (successes.some(s => s.email === email)) {
                            errors.push({ row: i + 2, email, studentCode: displayMssv, fullName: displayName, reason: 'Trùng lặp dòng excel' });
                            continue;
                        }

                        try {
                            await classService.addStudent(targetClassId, matchedUser.userId);
                            successes.push({
                                row: i + 2,
                                email: matchedUser.email,
                                fullName: matchedUser.fullName,
                                studentCode: matchedUser.studentCode || ''
                            });
                        } catch (apiErr: any) {
                            const msg = apiErr.response?.data?.message || 'Lỗi hệ thống';
                            errors.push({ row: i + 2, email, studentCode: displayMssv, fullName: displayName, reason: msg });
                        }
                    }

                    setResult({
                        totalRows: data.length,
                        successCount: successes.length,
                        failedCount: errors.length,
                        successes,
                        errors
                    });
                } catch (err) {
                    setError('File Excel không đúng định dạng!');
                } finally {
                    setLoading(false);
                }
            };
            reader.onerror = () => {
                setError('Không thể đọc file');
                setLoading(false);
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            setError('Có lỗi xảy ra trong quá trình xử lý');
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const data = [
            { 'STT': 1, 'Email': 'student01@fpt.edu.vn', 'Họ tên': 'Nguyen Van A', 'MSSV': 'SE123456', 'Ghi chú': 'Bắt buộc điền đúng Email đang có trong hệ thống' }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'import_students_template.xlsx');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                Thêm sinh viên hàng loạt từ Excel
            </DialogTitle>

            <DialogContent>
                <Button
                    size="small" startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                    sx={{ textTransform: 'none', mb: 2, borderRadius: 2 }}
                >
                    Tải file mẫu (.xlsx)
                </Button>

                {!result && (
                    <>
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
                                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
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
                                        Chỉ chấp nhận file .xlsx, hệ thống sẽ tự động đối chiếu theo Email
                                    </Typography>
                                </>
                            )}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                            Cột bắt buộc cần có trong file Excel là <b>Email</b> hoặc <b>email</b>. Các sinh viên không tìm thấy, chưa vào hệ thống, hoặc chia sẻ lớp học không hợp lệ sẽ được báo cáo chi tiết sau khi upload xong.
                        </Typography>
                    </>
                )}

                {loading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

                {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

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
                                    ✅ Sinh viên được thêm thành công
                                </Typography>
                                <TableContainer component={Paper} variant="outlined"
                                    sx={{ borderRadius: 2, maxHeight: 200, mb: 2, borderColor: '#BBF7D0' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Dòng</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>MSSV</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Họ tên</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#F0FDF4' }}>Email</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {result.successes.map((s, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{s.row}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.studentCode || '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.fullName}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.email}</TableCell>
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
                                    ❌ Danh sách thất bại bị bỏ qua
                                </Typography>
                                <TableContainer component={Paper} variant="outlined"
                                    sx={{ borderRadius: 2, maxHeight: 200, borderColor: '#FECACA' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Dòng</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>MSSV</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Họ tên</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#FEF2F2' }}>Lý do lỗi</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {result.errors.map((err, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{err.row}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{err.studentCode || '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{err.fullName || '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{err.email}</TableCell>
                                                    <TableCell sx={{ color: 'error.main', fontSize: '0.8rem' }}>{err.reason}</TableCell>
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
                        {loading ? 'Đang xử lý...' : 'Thêm sinh viên'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ImportStudentsExcelDialog;
