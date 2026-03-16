import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import srsService from '../../../api/services/srsService';
import { srsDataToTiptapContent } from '../../../utils/srsDataToTiptap';
import type { SrsData } from '../components/editor/SrsTemplate';
import type { SrsDocumentResponse } from '../../../types/srs.types';
import type { SrsA4EditorHandle } from '../components/editor/SrsA4Editor';

export function useSrsData() {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const queryClient = useQueryClient();
    const editorRef = useRef<SrsA4EditorHandle>(null);

    // string = HTML content (saved), Record<string,any> = TipTap JSONContent (fresh from AI)
    const [content, setContent] = useState<string | Record<string, any>>('');
    const [selectedVersionId, setSelectedVersionId] = useState<number | ''>('');
    const [generateError, setGenerateError] = useState<string | null>(null);

    // Supplement form state
    const [supplementInfo, setSupplementInfo] = useState('');

    // ─── QUERIES ───────────────────────────────────────────────────────────────
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

    // ─── SYNC CONTENT ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeSrs || !activeSrs.content) {
            setContent('');
            return;
        }
        try {
            let cleanedContent = activeSrs.content.trim();
            cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();

            if (cleanedContent.startsWith('{') || cleanedContent.startsWith('[')) {
                const jsonData = JSON.parse(cleanedContent) as SrsData;
                setContent(srsDataToTiptapContent(jsonData));
            } else {
                setContent(activeSrs.content);
            }
        } catch (e) {
            console.error("Lỗi parse data: ", e);
            setContent(activeSrs.content);
        }
    }, [activeSrs]);

    // ─── MUTATIONS ─────────────────────────────────────────────────────────────
    const generateMutation = useMutation({
        mutationFn: () => srsService.generateSrs(pid, {
            additionalInfo: supplementInfo.trim() || undefined,
        }),
        onSuccess: (response) => {
            setGenerateError(null);
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
                console.error('[SRS Generate] Failed to parse/render AI response:', e);
                // Fallback: show raw content (this causes raw JSON display issue)
                setContent(newSrs.content);
            }
            toast.success('Đã tạo SRS bằng AI thành công!');
            queryClient.invalidateQueries({ queryKey: ['srs', 'latest', pid] });
            queryClient.invalidateQueries({ queryKey: ['srs', 'versions', pid] });
            setSelectedVersionId('');
        },
        onError: (err: any) => {
            const raw: string = err.response?.data?.message || '';
            const match = raw.match(/RuntimeException\s*[\u2014-]\s*(.+)/);
            const userMsg = match
                ? match[1].trim()
                : raw || 'Không thể tạo SRS bằng AI. Vui lòng thử lại sau.';
            setGenerateError(userMsg);
            toast.error(userMsg, { autoClose: 8000 });
        }
    });

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
        const html = editorRef.current?.getHTML() ?? '';
        if (!html.trim() || html === '<p></p>') {
            toast.warning('Nội dung không được để trống');
            return;
        }
        updateMutation.mutate({ content: html });
    };

    return {
        pid,
        editorRef,
        content,
        latestSrs,
        latestLoading,
        versions,
        activeSrs,
        isLatest,
        selectedVersionId,
        setSelectedVersionId,
        generateError,
        setGenerateError,
        generateMutation,
        updateMutation,
        handleGenerate,
        handleSave,
        // Supplement form
        supplementInfo,
        setSupplementInfo,
    };
}
