import React from 'react';
import type { Editor } from '@tiptap/core';

// ── Context Menu Item ──────────────────────────────────────────────────────────

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

// ── Context Menu ───────────────────────────────────────────────────────────────

interface SrsEditorContextMenuProps {
    x: number;
    y: number;
    editor: Editor;
    onClose: () => void;
    onImageInsert: () => void;
    onLinkInsert: () => void;
}

const SrsEditorContextMenu: React.FC<SrsEditorContextMenuProps> = ({ x, y, editor, onClose, onImageInsert, onLinkInsert }) => {
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

export default SrsEditorContextMenu;
