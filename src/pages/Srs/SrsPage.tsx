import React, { useState } from 'react';
import { Box, Skeleton, Alert } from '@mui/material';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';
import axiosClient from '../../api/axiosClient';
import { useRole } from '../../hooks/useRole';
import { useSrsData } from './hooks/useSrsData';
import { useSrsAiProgress } from './hooks/useSrsAiProgress';
import {
    buildUseCaseTable, buildScreenDetailsTable, buildAuthorizationTable,
    buildDbSchemaTable, fileToBase64, buildFunctionalRequirementsHTML
} from './utils/srsTableBuilders';
import SrsEmptyState from './components/SrsEmptyState';
import SrsHeaderBar from './components/SrsHeaderBar';
import { SrsAiProgressInline } from './components/SrsAiProgressBar';
import SrsSupplementForm from './components/SrsSupplementForm';

import SrsA4Editor from './components/editor/SrsA4Editor';
import type { SrsVisionRequest } from '../../types/srs.types';
import srsService from '../../api/services/srsService';

const esc = (s: any) => String(s ?? '');

const SrsPage: React.FC = () => {
    const { isLecturer } = useRole();
    const readOnly = isLecturer();
    const [showSupplement, setShowSupplement] = useState(false);


    const srsData = useSrsData();
    const { aiProgress, aiStage, aiElapsed } = useSrsAiProgress(srsData.generateMutation.isPending);

    // ─── AI Vision handler ──────────────────────────────────────────────────────
    const handleDescribeImage = async (imageType: SrsVisionRequest['type'], insertPos?: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;


            let loadingToastId: any = null;
            try {
                const base64 = await fileToBase64(file);
                const pos = insertPos ?? 0;
                const editor = srsData.editorRef.current;
                if (!editor) return;

                // Step 1: Insert image + hide button immediately
                editor.insertImageAfterPos(pos, base64);
                editor.hideAiButtonNearPos(pos);

                // Step 2: Show loading toast
                loadingToastId = toast.loading('Đang xử lý ảnh...', { autoClose: false });

                // Step 3: Call AI Vision API
                const res = await srsService.describeImage(srsData.pid, {
                    image: base64,
                    type: imageType,
                });
                const raw: string = res.data.data;
                toast.dismiss(loadingToastId);

                // Step 3: Parse & fill tables based on type
                if (imageType === 'usecase') {
                    const parsed = JSON.parse(raw);
                    const tableHTML = buildUseCaseTable(Array.isArray(parsed) ? parsed : []);
                    editor.fillNthTableAfterPos(pos, 0, tableHTML);
                    toast.success('Đã chèn ảnh Use Case và điền bảng mô tả!', { autoClose: 4000 });

                } else if (imageType === 'screenflow') {
                    const parsed = JSON.parse(raw);
                    const details = parsed.screenDetails || parsed.screen_details || [];
                    const auths = parsed.authorizations || parsed.user_authorization || [];

                    const detailsHTML = buildScreenDetailsTable(details);
                    editor.fillNthTableAfterPos(pos, 0, detailsHTML);

                    if (auths.length > 0) {
                        const authHTML = buildAuthorizationTable(auths);
                        setTimeout(() => {
                            editor.fillNthTableAfterPos(pos, 1, authHTML);
                        }, 100);
                    }

                    // Generate Section III skeleton from functionalRequirements
                    const funcReqs = parsed.functionalRequirements || [];
                    console.log('[Screen Flow] functionalRequirements from AI:', funcReqs);
                    if (funcReqs.length > 0) {
                        const sectionHTML = buildFunctionalRequirementsHTML(funcReqs);
                        setTimeout(() => {
                            editor.insertHTMLAfterHeading('III. Functional Requirements', sectionHTML);
                        }, 300);
                    }

                    toast.success('Đã chèn ảnh và điền bảng Screen Details + User Authorization + Functional Requirements!', { autoClose: 4000 });

                } else if (imageType === 'db_schema') {
                    const parsed = JSON.parse(raw);
                    const tableHTML = buildDbSchemaTable(Array.isArray(parsed) ? parsed : []);
                    editor.fillNthTableAfterPos(pos, 0, tableHTML);
                    toast.success('Đã điền bảng Table Descriptions!', { autoClose: 4000 });

                } else if (imageType === 'mockup') {
                    const parsed = JSON.parse(raw);
                    const funcHTML = `
                        <ul>
                            <li><strong>Function trigger:</strong> ${esc(parsed.trigger)}</li>
                            <li><strong>Function description:</strong> ${esc(parsed.description)}</li>
                        </ul>
                        <p><strong>Function Details:</strong> ${esc(parsed.details)}</p>
                    `;
                    editor.insertHTMLAfterPos(pos, funcHTML);
                    toast.success('Đã chèn ảnh Mockup và điền mô tả chức năng!', { autoClose: 4000 });
                }

            } catch (err: any) {
                if (loadingToastId) toast.dismiss(loadingToastId);
                console.error('[AI Vision] Error:', err);
                const msg = err.response?.data?.message || 'Lỗi khi phân tích ảnh';
                toast.error(msg, { autoClose: 6000 });
            }
        };
        input.click();
    };

    // ─── Export handler ──────────────────────────────────────────────────────────
    const handleExport = async (format: 'pdf' | 'docx') => {
        if (!srsData.activeSrs) return;

        if (format === 'pdf') {
            toast.info(`Đang tạo file PDF...`);
            const element = document.getElementById('srs-pdf-content');
            if (!element) {
                toast.error("Không tìm thấy nội dung để xuất");
                return;
            }
            element.classList.add('export-mode');

            const fileName = `SRS_${srsData.activeSrs.title.replace(/\s+/g, '_')}_v${srsData.activeSrs.versionNumber}.pdf`;
            const opt: any = {
                margin:       [25, 0, 25, 0],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['css', 'legacy', 'avoid-all'] }
            };
            html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf: any) => {
                const totalPages = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 100, 100);
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(20, 275, 190, 275);
                    const text = `${i} | Page`;
                    pdf.text(text, 190, 281, { align: 'right' });
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
            toast.info('Đang tạo file DOCX...');
            try {
                let editorHtml = srsData.editorRef.current?.getHTML() ?? '';
                const fileName = `SRS_${srsData.activeSrs.title.replace(/\s+/g, '_')}_v${srsData.activeSrs.versionNumber}.doc`;

                // Convert URL images to base64 for Word compatibility
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = editorHtml;
                const images = tempDiv.querySelectorAll('img');

                for (const img of images) {
                    const src = img.getAttribute('src') || '';
                    // Convert URL images to base64
                    if (src && !src.startsWith('data:')) {
                        try {
                            const response = await fetch(src);
                            const blob = await response.blob();
                            const base64 = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                            });
                            img.setAttribute('src', base64);
                        } catch (e) {
                            console.warn('Could not convert image to base64:', src);
                        }
                    }
                    // Extract width from style and set as HTML attribute (Word ignores CSS style on img)
                    // Cap width at 580px (A4 content area width)
                    const MAX_IMG_WIDTH = 580;
                    const style = img.getAttribute('style') || '';
                    const widthMatch = style.match(/width:\s*([\d.]+)px/);
                    if (widthMatch) {
                        const w = Math.min(parseFloat(widthMatch[1]), MAX_IMG_WIDTH);
                        img.setAttribute('width', String(Math.round(w)));
                    } else {
                        // No explicit width — set max width so images aren't oversized in Word
                        img.setAttribute('width', String(MAX_IMG_WIDTH));
                    }
                }
                // Word-compatible: wrap centered elements in <center> (Word supports this tag)
                tempDiv.querySelectorAll('[data-align="center"]').forEach((el) => {
                    const wrapper = document.createElement('center');
                    el.removeAttribute('data-align');
                    if (el.parentNode) {
                        el.parentNode.insertBefore(wrapper, el);
                        wrapper.appendChild(el);
                    }
                });

                // Convert text-align:center CSS to align="center" attribute (Word ignores CSS)
                tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach((el) => {
                    const style = el.getAttribute('style') || '';
                    if (style.includes('text-align: center') || style.includes('text-align:center')) {
                        el.setAttribute('align', 'center');
                    }
                });

                editorHtml = tempDiv.innerHTML;

                const response = await axiosClient.post('/srs/export-docx', {
                    htmlContent: editorHtml,
                    title: srsData.activeSrs.title,
                    fileName: fileName,
                }, { responseType: 'blob' });

                const url = URL.createObjectURL(response.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Tải file DOCX thành công!');
            } catch (err: any) {
                console.error('[DOCX Export]', err);
                toast.error('Lỗi khi tạo file DOCX');
            }
        }
    };

    // ─── LOADING STATE ──────────────────────────────────────────────────────────
    if (srsData.latestLoading) {
        return (
            <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
                <Skeleton width="40%" height={50} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    // ─── EMPTY STATE ────────────────────────────────────────────────────────────
    if (!srsData.latestSrs) {
        return (
            <SrsEmptyState
                readOnly={readOnly}
                isPending={srsData.generateMutation.isPending}
                aiProgress={aiProgress}
                aiStage={aiStage}
                aiElapsed={aiElapsed}
                showSupplement={showSupplement}
                setShowSupplement={setShowSupplement}
                businessRules={srsData.businessRules}
                setBusinessRules={srsData.setBusinessRules}
                nonScreenFunctions={srsData.nonScreenFunctions}
                setNonScreenFunctions={srsData.setNonScreenFunctions}
                onGenerate={srsData.handleGenerate}
                generateError={srsData.generateError}
                setGenerateError={srsData.setGenerateError}
            />
        );
    }

    // ─── MAIN VIEW ──────────────────────────────────────────────────────────────
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <SrsHeaderBar
                activeSrs={srsData.activeSrs}
                latestSrs={srsData.latestSrs}
                versions={srsData.versions}
                selectedVersionId={srsData.selectedVersionId}
                setSelectedVersionId={srsData.setSelectedVersionId}
                isLatest={srsData.isLatest}
                readOnly={readOnly}
                showSupplement={showSupplement}
                setShowSupplement={setShowSupplement}
                isGenerating={srsData.generateMutation.isPending}
                isUpdating={srsData.updateMutation.isPending}
                onGenerate={srsData.handleGenerate}
                onSave={srsData.handleSave}
                onExportPdf={() => handleExport('pdf')}
                onExportDocx={() => handleExport('docx')}
            />

            {/* Supplement Form */}
            {!readOnly && srsData.isLatest && (
                <SrsSupplementForm
                    show={showSupplement}
                    businessRules={srsData.businessRules}
                    setBusinessRules={srsData.setBusinessRules}
                    nonScreenFunctions={srsData.nonScreenFunctions}
                    setNonScreenFunctions={srsData.setNonScreenFunctions}
                    variant="inline"
                />
            )}

            {/* AI Progress Bar */}
            {srsData.generateMutation.isPending && (
                <SrsAiProgressInline aiProgress={aiProgress} aiStage={aiStage} aiElapsed={aiElapsed} />
            )}

            {/* Error Alert */}
            {srsData.generateError && (
                <Alert severity="error" sx={{ mx: 3, mt: 1, borderRadius: 2, flexShrink: 0 }} onClose={() => srsData.setGenerateError(null)}>
                    <strong>AI không thể tạo SRS</strong> — {srsData.generateError}
                </Alert>
            )}

            {/* Editor */}
            <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: '#f1f3f5' }}>
                <SrsA4Editor
                    ref={srsData.editorRef}
                    value={srsData.content}
                    readOnly={readOnly || !srsData.isLatest}
                    onAiAction={(actionType, insertPos) => handleDescribeImage(actionType as any, insertPos)}
                />
            </Box>


        </Box>
    );
};

export default SrsPage;
