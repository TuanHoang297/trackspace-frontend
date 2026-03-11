import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { ResizableImage } from './ResizableImageExtension';
import './SrsA4Styles.css';

// value can be an HTML string (saved content) or a TipTap JSONContent object (fresh from AI converter)
interface SrsA4EditorProps {
    value: string | Record<string, any>;
    onChange?: (content: string) => void;
    readOnly?: boolean;
}

const FONT_FAMILIES = [
    { label: 'Calibri', value: 'Calibri, Segoe UI, Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
];

const SrsA4Editor: React.FC<SrsA4EditorProps> = ({ value, onChange, readOnly = false }) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const lastValueRef = useRef<string | Record<string, any> | null>(null);
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            FontFamily,
            Color,
            Highlight.configure({ multicolor: true }),
            ResizableImage.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: typeof value === 'object' ? value : (value || ''),
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    // Sync external value into editor when it changes (HTML string or JSONContent object)
    useEffect(() => {
        if (!editor || value === lastValueRef.current) return;
        lastValueRef.current = value;

        if (typeof value === 'object' && value !== null) {
            editor.commands.setContent(value, { emitUpdate: false });
            onChange?.(editor.getHTML());
        } else if (typeof value === 'string') {
            if (value !== editor.getHTML()) {
                editor.commands.setContent(value || '', { emitUpdate: false });
            }
        }
    }, [value, editor, onChange]);

    // Close context menu on outside click / scroll
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

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (readOnly) return;
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    }, [readOnly]);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target?.result as string;
            editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [editor]);

    const handleSetLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Nhập URL:', prev ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="srs-editor-wrapper" onContextMenu={handleContextMenu}>
            {!readOnly && (
                <div className="srs-custom-toolbar">
                    {/* Undo / Redo */}
                    <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>↩</ToolBtn>
                    <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>↪</ToolBtn>
                    <Sep />

                    {/* Heading */}
                    <select
                        title="Heading"
                        style={selectStyle}
                        value={[1,2,3,4,5,6].find(l => editor.isActive('heading', { level: l })) ?? 0}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v === 0) editor.chain().focus().setParagraph().run();
                            else editor.chain().focus().setHeading({ level: v as 1|2|3|4|5|6 }).run();
                        }}
                    >
                        <option value={0}>Paragraph</option>
                        {[1,2,3,4,5,6].map(l => <option key={l} value={l}>Heading {l}</option>)}
                    </select>

                    {/* Font family */}
                    <select
                        title="Font"
                        style={selectStyle}
                        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                        defaultValue=""
                    >
                        <option value="" disabled>Font</option>
                        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <Sep />

                    {/* Format */}
                    <ToolBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolBtn>
                    <ToolBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolBtn>
                    <ToolBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolBtn>
                    <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolBtn>
                    <Sep />

                    {/* Color */}
                    <label title="Text color" style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        A
                        <input type="color" style={{ width: 18, height: 18, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
                            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
                    </label>
                    <label title="Highlight" style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        🖊
                        <input type="color" defaultValue="#fef08a" style={{ width: 18, height: 18, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
                            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()} />
                    </label>
                    <Sep />

                    {/* Alignment */}
                    <ToolBtn title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬅</ToolBtn>
                    <ToolBtn title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</ToolBtn>
                    <ToolBtn title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>➡</ToolBtn>
                    <ToolBtn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>☰</ToolBtn>
                    <Sep />

                    {/* Lists */}
                    <ToolBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolBtn>
                    <ToolBtn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolBtn>
                    <Sep />

                    {/* Table */}
                    <ToolBtn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞ Bảng</ToolBtn>
                    <ToolBtn title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>+Hàng</ToolBtn>
                    <ToolBtn title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>−Hàng</ToolBtn>
                    <ToolBtn title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>+Cột</ToolBtn>
                    <ToolBtn title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>−Cột</ToolBtn>
                    <ToolBtn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>🗑 Bảng</ToolBtn>
                    <Sep />

                    {/* Image */}
                    <ToolBtn title="Insert image" onClick={() => imageInputRef.current?.click()}>🖼 Hình</ToolBtn>
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

                    {/* Link */}
                    <ToolBtn title="Insert/edit link" active={editor.isActive('link')} onClick={handleSetLink}>🔗 Link</ToolBtn>
                    <Sep />

                    {/* Page break */}
                    <ToolBtn title="Page break" onClick={() => editor.chain().focus().setHorizontalRule().run()}>📄 Ngắt trang</ToolBtn>
                </div>
            )}

            <div className="a4-container">
                <div className="a4-page" id="srs-pdf-content">
                    <EditorContent editor={editor} className="tiptap-editor" />
                </div>
            </div>

            {ctxMenu && (
                <CtxMenu
                    x={ctxMenu.x} y={ctxMenu.y}
                    editor={editor}
                    onClose={() => setCtxMenu(null)}
                    onImageInsert={() => { setCtxMenu(null); imageInputRef.current?.click(); }}
                    onLinkInsert={() => { setCtxMenu(null); handleSetLink(); }}
                />
            )}
        </div>
    );
};

// ---- small helper components ----
const btnStyle: React.CSSProperties = {
    padding: '5px 10px', background: '#f8fafc', border: '1px solid #cbd5e1',
    borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', color: '#334155',
    fontSize: '13px', lineHeight: 1.4,
};
const selectStyle: React.CSSProperties = {
    ...btnStyle, padding: '5px 6px',
};

const Sep = () => <div style={{ borderLeft: '1px solid #d1d5db', margin: '0 2px', alignSelf: 'stretch' }} />;

const ToolBtn: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
    <button
        title={title}
        onClick={onClick}
        disabled={disabled}
        style={{
            ...btnStyle,
            background: active ? '#dbeafe' : '#f8fafc',
            borderColor: active ? '#93c5fd' : '#cbd5e1',
            opacity: disabled ? 0.4 : 1,
        }}
    >
        {children}
    </button>
);

// ---- Context menu ----
type CtxMenuProps = {
    x: number; y: number;
    editor: import('@tiptap/core').Editor;
    onClose: () => void;
    onImageInsert: () => void;
    onLinkInsert: () => void;
};

const CtxMenu: React.FC<CtxMenuProps> = ({ x, y, editor, onClose, onImageInsert, onLinkInsert }) => {
    // Keep menu inside viewport
    const style: React.CSSProperties = {
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9999,
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        minWidth: 220,
        padding: '4px 0',
        fontFamily: 'inherit',
        fontSize: 13,
    };

    const hasSel = !editor.state.selection.empty;
    const canPaste = navigator.clipboard !== undefined;

    return (
        <div style={style} onMouseDown={(e) => e.stopPropagation()}>
            <CtxItem disabled={!editor.can().undo()} onClick={() => { editor.chain().focus().undo().run(); onClose(); }}>↩ Hoàn tác</CtxItem>
            <CtxItem disabled={!editor.can().redo()} onClick={() => { editor.chain().focus().redo().run(); onClose(); }}>↪ Làm lại</CtxItem>
            <CtxDiv />
            <CtxItem disabled={!hasSel} onClick={() => { document.execCommand('cut'); onClose(); }}>✂ Cắt</CtxItem>
            <CtxItem disabled={!hasSel} onClick={() => { document.execCommand('copy'); onClose(); }}>⎘ Sao chép</CtxItem>
            <CtxItem disabled={!canPaste} onClick={() => {
                navigator.clipboard.readText().then(text => {
                    editor.chain().focus().insertContent(text).run();
                });
                onClose();
            }}>📋 Dán</CtxItem>
            <CtxDiv />
            <CtxLabel>Định dạng</CtxLabel>
            <CtxItem onClick={() => { editor.chain().focus().toggleBold().run(); onClose(); }}>𝐁 Đậm</CtxItem>
            <CtxItem onClick={() => { editor.chain().focus().toggleItalic().run(); onClose(); }}>𝐼 Nghiêng</CtxItem>
            <CtxItem onClick={() => { editor.chain().focus().toggleUnderline().run(); onClose(); }}>U̲ Gạch chân</CtxItem>
            <CtxItem onClick={() => { editor.chain().focus().clearNodes().unsetAllMarks().run(); onClose(); }}>⌀ Xóa định dạng</CtxItem>
            <CtxDiv />
            <CtxLabel>Chèn</CtxLabel>
            <CtxItem onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); onClose(); }}>⊞ Bảng</CtxItem>
            <CtxItem onClick={onImageInsert}>🖼 Hình ảnh</CtxItem>
            <CtxItem onClick={onLinkInsert}>🔗 Liên kết</CtxItem>
            <CtxItem onClick={() => { editor.chain().focus().setHorizontalRule().run(); onClose(); }}>📄 Ngắt trang</CtxItem>
        </div>
    );
};

const CtxItem: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <button
        disabled={disabled}
        onClick={onClick}
        style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '6px 16px', background: 'transparent', border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            color: disabled ? '#94a3b8' : '#1e293b',
            fontSize: 13, whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
        {children}
    </button>
);

const CtxDiv = () => <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />;

const CtxLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ padding: '4px 16px 2px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </div>
);

export default SrsA4Editor;
