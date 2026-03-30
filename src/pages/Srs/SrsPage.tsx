import React, { useState } from 'react';
import { Box, Skeleton, Alert } from '@mui/material';
import { toast } from 'react-toastify';

import axiosClient from '../../api/axiosClient';
import { useRole } from '../../hooks/useRole';
import { useSrsData } from './hooks/useSrsData';
import { useSrsAiProgress } from './hooks/useSrsAiProgress';
import { getUser } from '../../utils/auth';
import studentService from '../../api/services/studentService';
import { useQuery } from '@tanstack/react-query';
import {
    buildUseCaseTable, buildScreenDetailsTable, buildAuthorizationTable,
    buildDbSchemaTable, uploadFileAndGetUrl, buildFunctionalRequirementsHTML, normalizeFunctionalRequirements
} from './utils/srsTableBuilders';
import SrsEmptyState from './components/SrsEmptyState';
import SrsHeaderBar from './components/SrsHeaderBar';
import { SrsAiProgressInline } from './components/SrsAiProgressBar';
import SrsSupplementForm from './components/SrsSupplementForm';

import SrsA4Editor from './components/editor/SrsA4Editor';
import type { SrsVisionRequest } from '../../types/srs.types';
import srsService from '../../api/services/srsService';

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const escWithBreaks = (s: any) => esc(s).replace(/\r?\n/g, '<br/>');

const formatDetailsWithNumberedBreaks = (s: any) => {
    const text = String(s ?? '').replace(/\r\n/g, '\n');
    // Put numbered points on new lines for readability: ... 1. ... 2. ...
    const normalized = text.replace(/([^\n])\s+(\d+\.\s)/g, '$1\n$2');
    return escWithBreaks(normalized);
};

const normalizeSrsBaseTitle = (title: string, versionNumber: number): string => {
    const normalized = String(title ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/^\s*SRS\s*[-_:|]*\s*/i, '')
        .replace(new RegExp(`(?:\s*[-_:|()]?\s*)v${versionNumber}\s*$`, 'i'), '')
        .replace(/(?:\s*[-_:|()]?\s*)v\d+\s*$/i, '')
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    return normalized || 'Document';
};

const buildSrsExportFileName = (title: string, versionNumber: number, extension: 'pdf' | 'doc'): string => {
    const baseTitle = normalizeSrsBaseTitle(title, versionNumber);
    return `SRS_${baseTitle}_v${versionNumber}.${extension}`;
};

const tryParseJson = (raw: string): any => {
    const text = String(raw ?? '').trim();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        const cleaned = text
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/, '');
        return JSON.parse(cleaned);
    }
};

const buildFuncReqsFromScreenDetails = (details: any[]): any[] => {
    const groups = new Map<string, { name: string; functions: { name: string }[] }>();
    details.forEach((d: any) => {
        const featureName = String(d?.feature || 'General').trim() || 'General';
        const screenName = String(d?.screen || d?.name || d?.title || '').trim();
        if (!screenName) return;
        if (!groups.has(featureName)) {
            groups.set(featureName, { name: featureName, functions: [] });
        }
        groups.get(featureName)!.functions.push({ name: screenName });
    });
    return Array.from(groups.values());
};

const extractMockupFields = (raw: string): { trigger: string; description: string; details: string } => {
    const text = String(raw ?? '').trim();
    let parsed: any = {};
    try {
        parsed = tryParseJson(text);
    } catch {
        parsed = {};
    }

    const trigger =
        parsed?.trigger ||
        parsed?.function_trigger ||
        parsed?.functionTrigger ||
        parsed?.function?.trigger ||
        parsed?.function?.functionTrigger ||
        '';

    const description =
        parsed?.description ||
        parsed?.function_description ||
        parsed?.functionDescription ||
        parsed?.function?.description ||
        parsed?.function?.functionDescription ||
        '';

    const details =
        parsed?.details ||
        parsed?.function_details ||
        parsed?.functionDetails ||
        parsed?.function?.details ||
        parsed?.function?.functionDetails ||
        '';

    if (trigger || description || details) {
        return {
            trigger: String(trigger || ''),
            description: String(description || ''),
            details: String(details || ''),
        };
    }

    // Fallback: flatten any JSON string values when keys are unexpected.
    const collectStrings = (value: any): string[] => {
        if (value == null) return [];
        if (typeof value === 'string') {
            const s = value.trim();
            return s ? [s] : [];
        }
        if (Array.isArray(value)) {
            return value.flatMap(collectStrings);
        }
        if (typeof value === 'object') {
            return Object.values(value).flatMap(collectStrings);
        }
        return [];
    };

    const collected = collectStrings(parsed);
    if (collected.length > 0) {
        return {
            trigger: collected[0] || '',
            description: collected[1] || collected[0] || '',
            details: collected.slice(2).join(' ').trim() || collected[1] || collected[0] || '',
        };
    }

    // Fallback: parse plain text output from Gemini
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const pick = (regex: RegExp) => {
        const line = lines.find((l) => regex.test(l));
        return line ? line.replace(regex, '').trim() : '';
    };

    const t = pick(/^[-*\d.)\s]*function\s*trigger\s*:\s*/i);
    const d = pick(/^[-*\d.)\s]*function\s*description\s*:\s*/i);
    const de = pick(/^[-*\d.)\s]*function\s*details?\s*:\s*/i);

    const finalTrigger = t || '';
    const finalDescription = d || '';
    const finalDetails = de || text || '';

    return {
        trigger: finalTrigger || '[AI chưa nhận diện được trigger rõ ràng từ ảnh] ',
        description: finalDescription || '[AI chưa nhận diện được mô tả rõ ràng từ ảnh] ',
        details: finalDetails || '[AI chưa trích xuất được chi tiết chức năng từ ảnh] ',
    };
};

const SrsPage: React.FC = () => {
    const { isLecturer } = useRole();
    const [showSupplement, setShowSupplement] = useState(false);

    const srsData = useSrsData();
    const { aiProgress, aiStage, aiElapsed } = useSrsAiProgress(srsData.generateMutation.isPending);

    const currentUser = getUser();
    const isStudent = currentUser?.role === 'STUDENT';

    const { data: workspaces } = useQuery({
        queryKey: ['student', 'workspaces'],
        queryFn: async () => {
            const res = await studentService.getMyWorkspaces();
            return res.data.data;
        },
        enabled: isStudent,
    });

    const isLeader = isStudent && workspaces?.find(w => w.projectId === srsData.pid)?.isLeader === true;
    const isMember = isStudent && !isLeader;
    const readOnly = isLecturer() || isMember;

    const uploadImageToCloudinary = async (file: File): Promise<string> => {
        const uploadRes = await srsService.uploadImage(file);
        const imageUrl = uploadRes.data.data?.url;
        if (!imageUrl) {
            throw new Error('Upload ảnh không trả về URL');
        }
        return imageUrl;
    };

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
                const imageUrl = await uploadFileAndGetUrl(file, uploadImageToCloudinary);
                const pos = insertPos ?? 0;
                const editor = srsData.editorRef.current;
                if (!editor) return;

                // Step 1: Insert image + hide button immediately
                editor.insertImageAfterPos(pos, imageUrl);
                editor.hideAiButtonNearPos(pos);

                // Step 2: Show loading toast
                loadingToastId = toast.loading('Đang xử lý ảnh...', { autoClose: false });

                // Step 3: Call AI Vision API
                const res = await srsService.describeImage(srsData.pid, {
                    image: imageUrl,
                    type: imageType,
                });
                const raw: string = res.data.data;
                toast.dismiss(loadingToastId);

                // Step 3: Parse & fill tables based on type
                if (imageType === 'usecase') {
                    const parsed = JSON.parse(raw);
                    const tableHTML = buildUseCaseTable(Array.isArray(parsed) ? parsed : []);
                    editor.fillNthTableAfterPos(pos, 0, tableHTML);
                    setTimeout(() => srsData.persistDraftNow(), 0);
                    toast.success('Đã chèn ảnh Use Case và điền bảng mô tả!', { autoClose: 4000 });

                } else if (imageType === 'screenflow') {
                    const parsed = tryParseJson(raw);
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
                    let funcReqs = normalizeFunctionalRequirements(parsed);
                    if (funcReqs.length === 0 && Array.isArray(details) && details.length > 0) {
                        funcReqs = buildFuncReqsFromScreenDetails(details);
                    }
                    console.log('[Screen Flow] functionalRequirements from AI:', funcReqs);
                    if (funcReqs.length > 0) {
                        const sectionHTML = buildFunctionalRequirementsHTML(funcReqs);
                        setTimeout(() => {
                            editor.insertHTMLAfterHeading('III. Functional Requirements', sectionHTML);
                        }, 300);
                    } else {
                        toast.warning('Ảnh đã phân tích nhưng chưa suy ra được Functional Requirements. Bạn thử ảnh Screen Flow rõ hơn nhé.');
                    }

                    setTimeout(() => srsData.persistDraftNow(), 350);

                    toast.success('Đã chèn ảnh và điền bảng Screen Details + User Authorization + Functional Requirements!', { autoClose: 4000 });

                } else if (imageType === 'db_schema') {
                    const parsed = JSON.parse(raw);
                    const tableHTML = buildDbSchemaTable(Array.isArray(parsed) ? parsed : []);
                    editor.fillNthTableAfterPos(pos, 0, tableHTML);
                    setTimeout(() => srsData.persistDraftNow(), 0);
                    toast.success('Đã điền bảng Table Descriptions!', { autoClose: 4000 });

                } else if (imageType === 'mockup') {
                    const extracted = extractMockupFields(raw);
                    const funcHTML = `
                        <div>
                            <p><strong>Function trigger:</strong> ${escWithBreaks(extracted.trigger)}</p>
                            <p><strong>Function description:</strong> ${escWithBreaks(extracted.description)}</p>
                            <p><strong>Function Details:</strong> ${formatDetailsWithNumberedBreaks(extracted.details)}</p>
                        </div>
                    `;
                    editor.replaceFirstBulletListAfterPos(pos, funcHTML);
                    // Remove orphan bullet markers left by old placeholder list blocks.
                    setTimeout(() => editor.removeEmptyBulletLists(), 0);
                    setTimeout(() => srsData.persistDraftNow(), 0);
                    toast.success('Đã chèn ảnh Mockup và điền mô tả chức năng!', { autoClose: 4000 });
                }

            } catch (err: any) {
                if (loadingToastId) toast.dismiss(loadingToastId);
                console.error('[AI Vision] Error:', err);
                if (err.response?.status === 401) {
                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để dùng AI Vision.', { autoClose: 6000 });
                    return;
                }
                const msg = err.response?.data?.message || 'Lỗi khi phân tích ảnh';
                toast.error(msg, { autoClose: 6000 });
            }
        };
        input.click();
    };

    // ─── Export handler ──────────────────────────────────────────────────────────
    const handleExport = async () => {
        if (!srsData.activeSrs) return;

        {
            toast.info('Đang tạo file Doc...');
            try {
                let editorHtml = srsData.editorRef.current?.getHTML() ?? '';
                const fileName = buildSrsExportFileName(srsData.activeSrs.title, srsData.activeSrs.versionNumber, 'doc');

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

                const response = await axiosClient.post('/srs/export-doc', {
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
                toast.success('Tải file Doc thành công!');
            } catch (err: any) {
                console.error('[DOCX Export]', err);
                toast.error('Lỗi khi tạo file Doc');
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
                supplementInfo={srsData.supplementInfo}
                setSupplementInfo={srsData.setSupplementInfo}
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
                onExportDocx={() => handleExport()}
            />

            {/* Supplement Form */}
            {!readOnly && srsData.isLatest && (
                <SrsSupplementForm
                    show={showSupplement}
                    onClose={() => setShowSupplement(false)}
                    supplementInfo={srsData.supplementInfo}
                    setSupplementInfo={srsData.setSupplementInfo}
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
                    readOnly={readOnly}
                    onImageUpload={uploadImageToCloudinary}
                    onImageInserted={() => srsData.persistDraftNow()}
                    onAiAction={(actionType, insertPos) => handleDescribeImage(actionType as any, insertPos)}
                />
            </Box>


        </Box>
    );
};

export default SrsPage;
