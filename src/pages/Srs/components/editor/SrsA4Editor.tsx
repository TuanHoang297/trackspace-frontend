import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontSizeExtension from './FontSizeExtension';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { ResizableImage } from './ResizableImageExtension';
import { AiActionButton } from './AiActionButtonExtension';
import SrsEditorToolbar from './SrsEditorToolbar';
import SrsEditorContextMenu from './SrsEditorContextMenu';
import './SrsA4Styles.css';

const EMPTY_CELL_HTML = '<td><p></p></td>';

const buildEmptyTableHTML = (headers: string[]): string => (
    `<table><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr><tr>${headers.map(() => EMPTY_CELL_HTML).join('')}</tr></table>`
);

const isImageNode = (node: any): boolean => (
    node?.type?.name === 'image' || node?.type?.name === 'resizableImage'
);

const hasImageAfterButton = (doc: any, startPos: number): boolean => {
    let offset = 0;
    for (let index = 0; index < doc.childCount; index++) {
        const node = doc.child(index);
        const nodeStart = offset;
        offset += node.nodeSize;

        if (nodeStart < startPos) continue;
        if (isImageNode(node)) return true;
        if (node.type.name === 'paragraph' && !node.textContent.trim()) continue;
        return false;
    }

    return false;
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface SrsA4EditorProps {
    value: string | Record<string, any>;
    onChange?: (content: string) => void;
    readOnly?: boolean;
    onImageUpload?: (file: File) => Promise<string>;
    onImageInserted?: () => void;
    onAiAction?: (actionType: string, insertPos: number) => void;
}

export interface SrsA4EditorHandle {
    getHTML: () => string;
    lockUndoRedoUntilEdit: () => void;
    insertImageAfterPos: (pos: number, imageSrc: string) => void;
    fillNthTableAfterPos: (pos: number, n: number, tableHTML: string) => void;
    insertHTMLAfterPos: (pos: number, html: string) => void;
    insertHTMLAfterHeading: (headingText: string, html: string) => void;
    replaceFirstBulletListAfterPos: (pos: number, html: string) => void;
    removeEmptyBulletLists: () => void;
    hideAiButtonNearPos: (pos: number) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
const SrsA4Editor = forwardRef<SrsA4EditorHandle, SrsA4EditorProps>(({ value, onChange, readOnly = false, onImageUpload, onImageInserted, onAiAction }, ref) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onAiActionRef = useRef(onAiAction);
    onAiActionRef.current = onAiAction;
    const skipRestoreRef = useRef(false);
    const [ctxMenu, setCtxMenu] = React.useState<{ x: number; y: number } | null>(null);
    const [historyLocked, setHistoryLocked] = React.useState(false);

    // A key to detect real value changes (avoid re-setting same content)
    const contentKeyRef = useRef('');
    const getContentKey = (v: string | Record<string, any>): string => {
        if (!v) return '';
        if (typeof v === 'string') return v.slice(0, 200);
        try { return JSON.stringify(v).slice(0, 200); } catch { return 'obj'; }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            FontSizeExtension,
            FontFamily,
            Color,
            Highlight.configure({ multicolor: true }),
            ResizableImage.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            AiActionButton,
        ],
        content: '',
        editable: !readOnly,
        onUpdate: ({ editor: ed }) => {
            if (historyLocked) {
                setHistoryLocked(false);
            }

            const html = ed.getHTML();
            // Update contentKeyRef so the content sync effect doesn't
            // re-run setContent() when parent state updates from this edit.
            // Without this, user edit → onChange → parent updates value →
            // content sync runs setContent() → wipes redo stack.
            contentKeyRef.current = getContentKey(html);
            setTimeout(() => {
                onChangeRef.current?.(html);
            }, 0);

            if (skipRestoreRef.current) return;

            // Detect if an AI-uploaded image was deleted → restore button + clear table
            const doc = ed.state.doc;
            const buttonsToRestore: { pos: number; node: any }[] = [];
            doc.descendants((node, pos) => {
                if (node.type.name === 'aiActionButton' && node.attrs.done) {
                    const nextPos = pos + node.nodeSize;
                    if (nextPos < doc.content.size) {
                        if (!hasImageAfterButton(doc, nextPos)) buttonsToRestore.push({ pos, node });
                    } else {
                        buttonsToRestore.push({ pos, node });
                    }
                }
            });

            if (buttonsToRestore.length > 0) {
                setTimeout(() => {
                    let tr = ed.state.tr;
                    for (const { pos, node } of buttonsToRestore.reverse()) {
                        tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, done: false });
                    }
                    tr.setMeta('addToHistory', false);
                    ed.view.dispatch(tr);

                    for (const { pos, node } of buttonsToRestore) {
                        const actionType = node.attrs.actionType;
                        const emptyTables: Record<string, string[]> = {
                            usecase: [buildEmptyTableHTML(['ID', 'Feature', 'Use Case', 'Use Case Description'])],
                            screenflow: [
                                buildEmptyTableHTML(['#', 'Feature', 'Screen', 'Description']),
                                buildEmptyTableHTML(['Screen', 'ADMIN', 'LECTURER', 'STUDENT']),
                            ],
                            db_schema: [buildEmptyTableHTML(['No', 'Table', 'Description'])],
                        };
                        const tables = emptyTables[actionType] || [];
                        tables.forEach((tableHTML, idx) => {
                            setTimeout(() => {
                                const doc2 = ed.state.doc;
                                let tableIdx = 0;
                                let tStart = -1, tEnd = -1;
                                doc2.nodesBetween(pos, doc2.content.size, (n, nPos) => {
                                    if (tStart === -1 && n.type.name === 'table' && nPos > pos) {
                                        if (tableIdx === idx) {
                                            tStart = nPos;
                                            tEnd = nPos + n.nodeSize;
                                            return false;
                                        }
                                        tableIdx++;
                                    }
                                });
                                if (tStart !== -1) {
                                    ed.chain()
                                        .deleteRange({ from: tStart, to: tEnd })
                                        .insertContentAt(tStart, tableHTML)
                                        .run();
                                }
                            }, 50 * (idx + 1));
                        });
                    }
                }, 0);
            }
        },
    });

    // ── Expose imperative methods ──────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
        getHTML: () => editor?.getHTML() ?? '',

        lockUndoRedoUntilEdit: () => {
            if (!editor) return;
            // Re-apply current document to reset history stacks after save.
            editor.commands.setContent(editor.getHTML(), { emitUpdate: false });
            setHistoryLocked(true);
        },

        insertImageAfterPos: (pos: number, imageSrc: string) => {
            if (!editor) return;
            const maxPos = editor.state.doc.content.size;
            const safePos = Math.min(pos, maxPos);
            try {
                const anchorNode = editor.state.doc.nodeAt(safePos);
                const insertAt = anchorNode?.type.name === 'aiActionButton'
                    ? Math.min(safePos + anchorNode.nodeSize, maxPos)
                    : safePos;
                editor.chain().focus().insertContentAt(insertAt, {
                    type: 'image', attrs: { src: imageSrc },
                }).run();
            } catch {
                editor.chain().focus().insertContentAt(maxPos, {
                    type: 'image', attrs: { src: imageSrc },
                }).run();
            }
        },

        fillNthTableAfterPos: (pos: number, n: number, tableHTML: string) => {
            if (!editor) return;
            skipRestoreRef.current = true;
            setTimeout(() => { skipRestoreRef.current = false; }, 500);
            const doc = editor.state.doc;
            const maxPos = doc.content.size;
            let tableIdx = 0, tableStart = -1, tableEnd = -1;
            doc.nodesBetween(Math.min(pos, maxPos), maxPos, (node, nodePos) => {
                if (tableStart === -1 && node.type.name === 'table' && nodePos >= pos) {
                    if (tableIdx === n) { tableStart = nodePos; tableEnd = nodePos + node.nodeSize; return false; }
                    tableIdx++;
                }
            });
            if (tableStart !== -1) {
                editor.chain().focus().deleteRange({ from: tableStart, to: tableEnd }).insertContentAt(tableStart, tableHTML).run();
            }
        },

        insertHTMLAfterPos: (pos: number, html: string) => {
            if (!editor) return;
            skipRestoreRef.current = true;
            setTimeout(() => { skipRestoreRef.current = false; }, 500);
            const maxPos = editor.state.doc.content.size;
            const safePos = Math.min(pos, maxPos);
            try {
                const $pos = editor.state.doc.resolve(safePos);
                const insertAt = Math.min($pos.after(Math.max(1, $pos.depth)), maxPos);
                editor.chain().focus().insertContentAt(insertAt, html).run();
            } catch {
                editor.chain().focus().insertContentAt(maxPos, html).run();
            }
        },

        insertHTMLAfterHeading: (headingText: string, html: string) => {
            if (!editor) return;
            skipRestoreRef.current = true;
            setTimeout(() => { skipRestoreRef.current = false; }, 500);
            const doc = editor.state.doc;
            let insertAt = -1;
            doc.descendants((node, nodePos) => {
                if (insertAt !== -1) return false;
                if (node.type.name === 'heading' && node.textContent.includes(headingText)) {
                    // Insert after the heading + the next sibling node (placeholder paragraph)
                    const afterHeading = nodePos + node.nodeSize;
                    const nextNode = doc.nodeAt(afterHeading);
                    if (nextNode) {
                        insertAt = afterHeading + nextNode.nodeSize;
                    } else {
                        insertAt = afterHeading;
                    }
                    return false;
                }
            });
            if (insertAt !== -1) {
                editor.chain().focus().insertContentAt(insertAt, html).run();
            } else {
                // Fallback: append at end
                editor.chain().focus().insertContentAt(doc.content.size, html).run();
            }
        },

        replaceFirstBulletListAfterPos: (pos: number, html: string) => {
            if (!editor) return;
            skipRestoreRef.current = true;
            setTimeout(() => { skipRestoreRef.current = false; }, 500);
            const doc = editor.state.doc;
            const maxPos = doc.content.size;
            let listStart = -1;
            let listEnd = -1;

            doc.nodesBetween(Math.min(pos, maxPos), maxPos, (node, nodePos) => {
                if (listStart !== -1) return false;
                if (node.type.name === 'bulletList' && nodePos >= pos) {
                    listStart = nodePos;
                    listEnd = nodePos + node.nodeSize;
                    return false;
                }
            });

            if (listStart !== -1 && listEnd !== -1) {
                editor.chain().focus().deleteRange({ from: listStart, to: listEnd }).insertContentAt(listStart, html).run();
            } else {
                editor.chain().focus().insertContentAt(maxPos, html).run();
            }
        },

        removeEmptyBulletLists: () => {
            if (!editor) return;
            const doc = editor.state.doc;
            const ranges: Array<{ from: number; to: number }> = [];

            doc.descendants((node, nodePos) => {
                if (node.type.name === 'bulletList' && !node.textContent.trim()) {
                    ranges.push({ from: nodePos, to: nodePos + node.nodeSize });
                }
            });

            if (ranges.length === 0) return;

            let tr = editor.state.tr;
            ranges.reverse().forEach((r) => {
                tr = tr.delete(r.from, r.to);
            });
            editor.view.dispatch(tr);
        },

        hideAiButtonNearPos: (pos: number) => {
            if (!editor) return;
            const doc = editor.state.doc;
            let closestPos = -1, closestNode: any = null, closestDist = Infinity;
            doc.descendants((node, nodePos) => {
                if (node.type.name === 'aiActionButton' && !node.attrs.done) {
                    const dist = Math.abs(nodePos - pos);
                    if (dist < closestDist) { closestDist = dist; closestPos = nodePos; closestNode = node; }
                }
            });
            if (closestPos !== -1 && closestNode) {
                skipRestoreRef.current = true;
                const tr = editor.state.tr.setNodeMarkup(closestPos, undefined, { ...closestNode.attrs, done: true });
                editor.view.dispatch(tr);
                setTimeout(() => { skipRestoreRef.current = false; }, 500);
            }
        },
    }), [editor]);

    // ── Sync readOnly ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!editor) return;
        setTimeout(() => {
            editor.setEditable(!readOnly);
        }, 0);
    }, [editor, readOnly]);

    // ── Content sync ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!editor || !value || value === '') return;
        const key = getContentKey(value);
        if (key === contentKeyRef.current) return;
        contentKeyRef.current = key;
        setTimeout(() => {
            if (typeof value === 'object' && value !== null) {
                editor.commands.setContent(value, { emitUpdate: false });
            } else if (typeof value === 'string') {
                editor.commands.setContent(value, { emitUpdate: false });
            }
        }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);


    // ── Context menu close ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!ctxMenu) return;
        const close = () => setCtxMenu(null);
        document.addEventListener('mousedown', close);
        document.addEventListener('scroll', close, true);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('scroll', close, true);
        };
    }, [ctxMenu]);

    // ── AI action button click delegation ──────────────────────────────────────
    useEffect(() => {
        if (!editor) return;
        const editorEl = editor.view.dom;
        const handleClick = (e: Event) => {
            const btn = (e.target as HTMLElement).closest('.srs-ai-action-btn') as HTMLElement | null;
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const actionType = btn.getAttribute('data-action-type');
            if (!actionType) return;
            const wrapper = btn.closest('.srs-ai-action') as HTMLElement | null;
            if (!wrapper) return;
            const pos = editor.view.posAtDOM(wrapper, 0);
            onAiActionRef.current?.(actionType, pos);
        };
        editorEl.addEventListener('click', handleClick);
        return () => editorEl.removeEventListener('click', handleClick);
    }, [editor]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (readOnly) return;
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    }, [readOnly]);

    const handleKeyDownCapture = useCallback((e: React.KeyboardEvent) => {
        if (!historyLocked) return;

        const key = e.key.toLowerCase();
        const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && key === 'z';
        const isRedo = (e.ctrlKey || e.metaKey) && (key === 'y' || (e.shiftKey && key === 'z'));

        if (isUndo || isRedo) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, [historyLocked]);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        try {
            let src: string;
            if (onImageUpload) {
                src = await onImageUpload(file);
            } else {
                src = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            editor.chain().focus().setImage({ src }).run();
            setTimeout(() => onImageInserted?.(), 0);
        } catch (err) {
            console.error('Image upload failed', err);
        }

        e.target.value = '';
    }, [editor, onImageUpload, onImageInserted]);

    const handleSetLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Nhập URL:', prev ?? 'https://');
        if (url === null) return;
        if (url === '') editor.chain().focus().unsetLink().run();
        else editor.chain().focus().setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="srs-editor-wrapper" onContextMenu={handleContextMenu} onKeyDownCapture={handleKeyDownCapture}>
            {!readOnly && (
                <SrsEditorToolbar
                    editor={editor}
                    historyLocked={historyLocked}
                    onImageInsert={() => imageInputRef.current?.click()}
                    onLinkInsert={handleSetLink}
                />
            )}
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

            <div className="a4-container">
                <div
                    className="a4-pages-viewport"
                    ref={viewportRef}
                    id="srs-pdf-content"
                >
                    {/* ── Actual editor content ── */}
                    <EditorContent editor={editor} className="tiptap-editor" />
                </div>
            </div>

            {ctxMenu && (
                <SrsEditorContextMenu
                    x={ctxMenu.x} y={ctxMenu.y}
                    editor={editor}
                    historyLocked={historyLocked}
                    onClose={() => setCtxMenu(null)}
                    onImageInsert={() => { setCtxMenu(null); imageInputRef.current?.click(); }}
                    onLinkInsert={() => { setCtxMenu(null); handleSetLink(); }}
                />
            )}
        </div>
    );
});

SrsA4Editor.displayName = 'SrsA4Editor';

export default SrsA4Editor;
