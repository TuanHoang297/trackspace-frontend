import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Paper, Button, Skeleton, Chip, MenuItem, Select, FormControl, CircularProgress, Alert, LinearProgress
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import SrsA4Editor from '../../components/srs/SrsA4Editor';
import { srsDataToTiptapContent } from '../../utils/srsDataToTiptap';
import type { SrsData } from '../../components/srs/SrsTemplate';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';
import srsService from '../../api/services/srsService';
import { useRole } from '../../hooks/useRole';
import type { SrsDocumentResponse } from '../../types/srs.types';

const SrsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const queryClient = useQueryClient();
    const { isLecturer } = useRole();
    const readOnly = isLecturer();

    // string = HTML content (saved), Record<string,any> = TipTap JSONContent (fresh from AI)
    const [content, setContent] = useState<string | Record<string, any>>('');
    const [selectedVersionId, setSelectedVersionId] = useState<number | ''>('');
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [aiProgress, setAiProgress] = useState(0);        // 0-100
    const [aiStage, setAiStage] = useState('');              // current stage label
    const [aiElapsed, setAiElapsed] = useState(0);          // seconds elapsed

    const AI_STAGES = [
        { at: 0,  label: 'Đang phân tích dữ liệu project và Jira...' },
        { at: 6,  label: 'AI đang nghiên cứu yêu cầu nghiệp vụ...' },
        { at: 12, label: 'Đang xây dựng cấu trúc SRS...' },
        { at: 18, label: 'Đang sinh nội dung Use Cases & Functions...' },
        { at: 22, label: 'Đang hoàn thiện tài liệu...' },
        { at: 26, label: 'Sắp xong rồi, đang kiểm tra nội dung...' },
    ];
    // Dùng 30s làm mốc "expected" — progress sẽ tới 95% tại 30s,
    // sau đó dừng chờ response thật (trường hợp chậm 35-40s vẫn ổn)
    const ESTIMATED_SECONDS = 35;

    // Queries
    const { data: latestSrs, isLoading: latestLoading } = useQuery({
        queryKey: ['srs', 'latest', pid],
        queryFn: async () => {
            try {
                const res = await srsService.getLatestSrs(pid);
                return res.data.data as SrsDocumentResponse;
            } catch (err: any) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
        enabled: !!pid,
    });

    const { data: versionsData } = useQuery({
        queryKey: ['srs', 'versions', pid],
        queryFn: async () => {
            try {
                const res = await srsService.getAllSrsVersions(pid);
                return res.data.data as SrsDocumentResponse[];
            } catch {
                return [];
            }
        },
        enabled: !!pid && !!latestSrs,
    });

    const versions = versionsData || [];
    const activeSrs = selectedVersionId ? versions.find(v => v.id === selectedVersionId) : latestSrs;
    const isLatest = !selectedVersionId || selectedVersionId === latestSrs?.id;

    // Sync content when active SRS changes
    // Sync content when active SRS changes
    useEffect(() => {
        if (!activeSrs || !activeSrs.content) {
            setContent('');
            return;
        }
        try {
            // Loại bỏ các thẻ markdown (như ```json và ```) nếu có do Gemini trả về
            let cleanedContent = activeSrs.content.trim();
            cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();

            if (cleanedContent.startsWith('{') || cleanedContent.startsWith('[')) {
                // AI JSON → convert to TipTap JSONContent directly (tables are fully editable)
                const jsonData = JSON.parse(cleanedContent) as SrsData;
                setContent(srsDataToTiptapContent(jsonData));
            } else {
                // Nếu nó không phải JSON thì là HTML (User đã nhấn lưu bản cũ rồi) => Gán luôn
                setContent(activeSrs.content);
            }
        } catch (e) {
            console.error("Lỗi parse data: ", e);
            // Fallback nếu lỗi
            setContent(activeSrs.content);
        }
    }, [activeSrs]);


    // Mutations
    const generateMutation = useMutation({
        mutationFn: () => srsService.generateSrs(pid),
        onSuccess: (response) => {
            setGenerateError(null);
            // Dùng thẳng data trả về từ mutation — không đợi query refetch
            const newSrs = response.data.data as SrsDocumentResponse;
            try {
                let cleanedContent = newSrs.content.trim();
                cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();
                if (cleanedContent.startsWith('{') || cleanedContent.startsWith('[')) {
                    const jsonData = JSON.parse(cleanedContent) as SrsData;
                    setContent(srsDataToTiptapContent(jsonData));
                } else {
                    setContent(newSrs.content);
                }
            } catch (e) {
                setContent(newSrs.content);
            }
            toast.success('Đã tạo SRS bằng AI thành công!');
            queryClient.invalidateQueries({ queryKey: ['srs', 'latest', pid] });
            queryClient.invalidateQueries({ queryKey: ['srs', 'versions', pid] });
            setSelectedVersionId('');
        },
        onError: (err: any) => {
            const raw: string = err.response?.data?.message || '';
            // Extract the meaningful part after "RuntimeException — " if present
            const match = raw.match(/RuntimeException\s*[\u2014-]\s*(.+)/);
            const userMsg = match
                ? match[1].trim()
                : raw || 'Không thể tạo SRS bằng AI. Vui lòng thử lại sau.';
            setGenerateError(userMsg);
            toast.error(userMsg, { autoClose: 8000 });
        }
    });

    // Progress timer — runs while AI is generating
    useEffect(() => {
        if (!generateMutation.isPending) {
            setAiProgress(0);
            setAiElapsed(0);
            setAiStage('');
            return;
        }
        setAiProgress(0);
        setAiElapsed(0);
        setAiStage(AI_STAGES[0].label);
        const start = Date.now();
        const timer = setInterval(() => {
            const elapsed = (Date.now() - start) / 1000;
            setAiElapsed(Math.floor(elapsed));
            const raw = (elapsed / ESTIMATED_SECONDS) * 97;
            setAiProgress(Math.min(raw, 97));
            const stage = [...AI_STAGES].reverse().find(s => elapsed >= s.at);
            if (stage) setAiStage(stage.label);
        }, 500);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generateMutation.isPending]);

    const updateMutation = useMutation({
        mutationFn: (data: { title?: string, content: string }) => srsService.updateSrs(latestSrs!.id, data),
        onSuccess: () => {
            toast.success('Đã lưu version mới thành công!');
            queryClient.invalidateQueries({ queryKey: ['srs', 'latest', pid] });
            queryClient.invalidateQueries({ queryKey: ['srs', 'versions', pid] });
            setSelectedVersionId('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Lỗi khi lưu SRS');
        }
    });

    const handleGenerate = () => {
        generateMutation.mutate();
    };

    const handleSave = () => {
        const html = typeof content === 'string' ? content : '';
        if (!html.trim()) {
            toast.warning('Nội dung không được để trống');
            return;
        }
        updateMutation.mutate({ content: html });
    };

    const handleExport = async (format: 'pdf' | 'docx') => {
        if (!activeSrs) return;
        
        if (format === 'pdf') {
            toast.info(`Đang tạo file PDF...`);
            
            // 1. Lấy ra khối HTML có chứa ID đã đánh dấu (phần giấy A4 trắng)
            const element = document.getElementById('srs-pdf-content');
            
            if (!element) {
                toast.error("Không tìm thấy nội dung để xuất");
                return;
            }
            // Thêm class export-mode để ẩn Toolbar
            element.classList.add('export-mode');

            // 2. Cấu hình cho thư viện html2pdf
            const fileName = `SRS_${activeSrs.title.replace(/\s+/g, '_')}_v${activeSrs.versionNumber}.pdf`;
            const opt: any = {
                margin:       [25, 0, 25, 0], // 25mm top/bottom on EVERY page; left/right come from .a4-page CSS padding
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true }, 
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['css', 'legacy', 'avoid-all'] } // Tự động tránh cắt ngang bảng, dòng text
            };
            // 3. Tiến hành convert và thêm đánh số trang
            html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf: any) => {
                const totalPages = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 100, 100);
                    // Draw separator line and page number inside the 25mm bottom margin
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(20, 275, 190, 275); // at 275mm (22mm from bottom)
                    const text = `${i} | Page`;
                    pdf.text(text, 190, 281, { align: 'right' }); // at 281mm (16mm from bottom)
                }
                pdf.save(fileName);
                toast.success('Tải file thành công!');
                element.classList.remove('export-mode');
            }).catch((err: any) => {
                console.error(err);
                toast.error('Lỗi khi tải file');
                element.classList.remove('export-mode');
            });
        } 
        else {
            // ----- PHẦN DOCX -----
            // Nếu bạn vẫn muốn duy trì xuất docx, có thể chuyển nốt frontend. 
            // Tuy nhiên DOCX thì hơi phức tạp để giữ style, bạn có thể cân nhắc ẩn nút này đi,
            // chỉ tập trung xuất PDF chuẩn là được vì đa số các môn FPT đều nộp bài theo file PDF.
            toast.warning('Chức năng DOCX đang được tạm khóa để nâng cấp.');
        }
    };


    if (latestLoading) {
        return (
            <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
                <Skeleton width="40%" height={50} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    if (!latestSrs) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC' }} elevation={0}>
                    <DescriptionIcon sx={{ fontSize: 60, color: '#94A3B8', mb: 2 }} />
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: '#1E293B' }}>
                        Tài liệu SRS
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                        Chưa có tài liệu Software Requirements Specification (SRS) nào được tạo cho project này.
                    </Typography>
                    
                    {!readOnly ? (
                        generateMutation.isPending ? (
                            <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto', mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, justifyContent: 'center' }}>
                                    <CircularProgress size={20} sx={{ color: '#8B5CF6' }} />
                                    <Typography fontWeight={600} sx={{ color: '#6D28D9' }}>AI đang tạo SRS...</Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={aiProgress}
                                    sx={{
                                        height: 8, borderRadius: 4, mb: 1.5,
                                        bgcolor: '#EDE9FE',
                                        '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6', borderRadius: 4 }
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">{aiStage}</Typography>
                                    <Typography variant="caption" color="text.secondary">{aiElapsed}s / ~{ESTIMATED_SECONDS}s</Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AutoFixHighIcon />}
                                onClick={handleGenerate}
                                sx={{
                                    textTransform: 'none', px: 4, py: 1.5, borderRadius: 2, fontWeight: 600,
                                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                                    '&:hover': { background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }
                                }}
                            >
                                🪴 Tạo SRS bằng AI
                            </Button>
                        )
                    ) : (
                        <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>
                            Chỉ sinh viên trong nhóm mới có quyền tạo SRS.
                        </Typography>
                    )}
                    {generateError && (
                        <Alert
                            severity="error"
                            sx={{ mt: 3, textAlign: 'left', borderRadius: 2 }}
                            onClose={() => setGenerateError(null)}
                        >
                            <strong>AI không thể tạo SRS</strong><br />
                            {generateError}
                        </Alert>
                    )}
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {generateMutation.isPending && (
                <Paper elevation={0} sx={{ mb: 2, p: 2.5, borderRadius: 2, border: '1px solid #DDD6FE', bgcolor: '#F5F3FF' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <CircularProgress size={18} sx={{ color: '#8B5CF6' }} />
                        <Typography fontWeight={600} sx={{ color: '#6D28D9', fontSize: '0.9rem' }}>AI đang tạo lại SRS...</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{aiElapsed}s / ~{ESTIMATED_SECONDS}s</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={aiProgress}
                        sx={{
                            height: 6, borderRadius: 3, mb: 1,
                            bgcolor: '#EDE9FE',
                            '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6', borderRadius: 3 }
                        }}
                    />
                    <Typography variant="caption" color="text.secondary">{aiStage}</Typography>
                </Paper>
            )}
            {generateError && (
                <Alert
                    severity="error"
                    sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setGenerateError(null)}
                >
                    <strong>AI không thể tạo SRS</strong> — {generateError}
                </Alert>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#1E293B' }}>
                            {activeSrs?.title}
                        </Typography>
                        {activeSrs?.generatedByAi && (
                            <Chip label="AI Generated" size="small" sx={{ bgcolor: '#F3E8FF', color: '#9333EA', fontWeight: 700, fontSize: '0.7rem' }} />
                        )}
                        <Chip label={`v${activeSrs?.versionNumber}`} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Cập nhật lần cuối bởi {activeSrs?.createdByName} lúc {activeSrs?.updatedAt ? new Date(activeSrs.updatedAt).toLocaleString('vi-VN') : ''}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {versions.length > 1 && (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                                value={selectedVersionId}
                                onChange={(e) => setSelectedVersionId(e.target.value as number | '')}
                                displayEmpty
                                sx={{ bgcolor: 'white', borderRadius: 2 }}
                            >
                                <MenuItem value="">Mới nhất (v{latestSrs.versionNumber})</MenuItem>
                                {versions.filter(v => v.id !== latestSrs.id).map(v => (
                                    <MenuItem key={v.id} value={v.id}>Version {v.versionNumber}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdfIcon sx={{ color: '#EF4444' }}/>}
                        onClick={() => handleExport('pdf')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, borderColor: '#E2E8F0', color: '#1E293B', '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' } }}
                    >
                        Xuất PDF
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DescriptionIcon sx={{ color: '#2563EB' }}/>}
                        onClick={() => handleExport('docx')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, borderColor: '#E2E8F0', color: '#1E293B', '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' } }}
                    >
                        Xuất DOCX
                    </Button>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'visible', bgcolor: '#f3f4f6' }}>
                <Box>
                    <SrsA4Editor 
                        value={content} 
                        onChange={(val) => setContent(val)} 
                        readOnly={readOnly || !isLatest} 
                    />
                </Box>

                {!readOnly && isLatest && (
                    <Box sx={{ p: 3, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={generateMutation.isPending ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                            onClick={handleGenerate}
                            disabled={generateMutation.isPending || updateMutation.isPending}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                        >
                            {generateMutation.isPending ? 'Đang tạo...' : 'Tạo lại bằng AI'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={updateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={updateMutation.isPending || generateMutation.isPending}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, px: 4 }}
                        >
                            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu phiên bản mới'}
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default SrsPage;
