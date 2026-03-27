import React from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { Box, IconButton, Tooltip, Divider, Select, MenuItem, type SelectChangeEvent } from '@mui/material';

// ── MUI Icons ──────────────────────────────────────────────────────────────────
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import RedoRoundedIcon from '@mui/icons-material/RedoRounded';
import FormatBoldRoundedIcon from '@mui/icons-material/FormatBoldRounded';
import FormatItalicRoundedIcon from '@mui/icons-material/FormatItalicRounded';
import FormatUnderlinedRoundedIcon from '@mui/icons-material/FormatUnderlinedRounded';
import StrikethroughSRoundedIcon from '@mui/icons-material/StrikethroughSRounded';
import FormatAlignLeftRoundedIcon from '@mui/icons-material/FormatAlignLeftRounded';
import FormatAlignCenterRoundedIcon from '@mui/icons-material/FormatAlignCenterRounded';
import FormatAlignRightRoundedIcon from '@mui/icons-material/FormatAlignRightRounded';
import FormatAlignJustifyRoundedIcon from '@mui/icons-material/FormatAlignJustifyRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InsertLinkRoundedIcon from '@mui/icons-material/InsertLinkRounded';
import InsertPageBreakOutlinedIcon from '@mui/icons-material/InsertPageBreakOutlined';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import BorderColorIcon from '@mui/icons-material/BorderColor';

// ── Tiny icon-button with active state ─────────────────────────────────────────

const TBtn: React.FC<{
    tip: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ tip, active, disabled, onClick, children }) => (
    <Tooltip title={tip} arrow>
        <span>
            <IconButton
                size="small"
                onClick={onClick}
                disabled={disabled}
                sx={{
                    width: 30, height: 30, borderRadius: '6px',
                    color: active ? '#2563eb' : '#4b5563',
                    bgcolor: active ? '#dbeafe' : 'transparent',
                    '&:hover': { bgcolor: active ? '#bfdbfe' : '#f3f4f6' },
                    '&.Mui-disabled': { opacity: 0.35 },
                    transition: 'all 0.15s',
                }}
            >
                {children}
            </IconButton>
        </span>
    </Tooltip>
);

const Sep = () => <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: '#e5e7eb' }} />;
const iconSx = { fontSize: 18 };

// ── Font families ──────────────────────────────────────────────────────────────

const FONTS = [
    { label: 'Calibri', value: 'Calibri, Segoe UI, Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
];

const HEADINGS = [
    { label: 'Paragraph', value: 0 },
    { label: 'Heading 1', value: 1 },
    { label: 'Heading 2', value: 2 },
    { label: 'Heading 3', value: 3 },
    { label: 'Heading 4', value: 4 },
    { label: 'Heading 5', value: 5 },
];

const miniSelectSx = {
    height: 28,
    fontSize: '0.78rem',
    fontWeight: 500,
    borderRadius: '6px',
    bgcolor: '#fff',
    '.MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93c5fd' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 1.5 },
};

const DEFAULT_FONT_SIZE_PT = 11;
const MIN_FONT_SIZE_PT = 8;
const MAX_FONT_SIZE_PT = 72;
const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const parseFontSizePt = (raw?: string): number => {
    if (!raw) return DEFAULT_FONT_SIZE_PT;
    const match = raw.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (!match) return DEFAULT_FONT_SIZE_PT;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.round(value) : DEFAULT_FONT_SIZE_PT;
};

const pxToPt = (px: number): number => Math.round((px * 72) / 96);

const getCurrentFontSizePt = (ed: Editor): number => {
    const inlineFontSize = ed.getAttributes('textStyle').fontSize as string | undefined;
    if (inlineFontSize) {
        return parseFontSizePt(inlineFontSize);
    }

    const { from } = ed.state.selection;
    const domAtPos = ed.view.domAtPos(from);
    const baseNode = domAtPos.node;
    const element = (baseNode instanceof HTMLElement
        ? baseNode
        : baseNode.parentElement) as HTMLElement | null;

    if (!element) return DEFAULT_FONT_SIZE_PT;

    const computedPx = Number.parseFloat(window.getComputedStyle(element).fontSize);
    if (!Number.isFinite(computedPx)) return DEFAULT_FONT_SIZE_PT;

    return pxToPt(computedPx);
};

// ── Toolbar ────────────────────────────────────────────────────────────────────

interface SrsEditorToolbarProps {
    editor: Editor;
    historyLocked?: boolean;
    onImageInsert: () => void;
    onLinkInsert: () => void;
}

const SrsEditorToolbar: React.FC<SrsEditorToolbarProps> = ({ editor, historyLocked = false, onImageInsert, onLinkInsert }) => {
    const editorState = useEditorState({
        editor,
        selector: ({ editor: ed }) => {
            if (!ed) {
                return {
                    canUndo: false,
                    canRedo: false,
                    currentHeading: 0,
                    currentFontSize: DEFAULT_FONT_SIZE_PT,
                    isBold: false,
                    isItalic: false,
                    isUnderline: false,
                    isStrike: false,
                    alignLeft: false,
                    alignCenter: false,
                    alignRight: false,
                    alignJustify: false,
                    isBulletList: false,
                    isOrderedList: false,
                    textColor: '#000',
                };
            }

            const inTable = ed.isActive('table');

            const isLeft = ed.isActive({ textAlign: 'left' });
            const isCenter = ed.isActive({ textAlign: 'center' });
            const isRight = ed.isActive({ textAlign: 'right' });
            const isJustify = ed.isActive({ textAlign: 'justify' });
            const hasExplicitAlign = isLeft || isCenter || isRight || isJustify;

            // In table cells, default visual state is Left unless user has explicitly chosen another alignment.
            const alignLeft = inTable ? (!hasExplicitAlign || isLeft) : isLeft;
            const alignCenter = isCenter;
            const alignRight = isRight;
            const alignJustify = isJustify;

            return {
                canUndo: ed.can().undo(),
                canRedo: ed.can().redo(),
                currentHeading: [1, 2, 3, 4, 5].find((l) => ed.isActive('heading', { level: l })) ?? 0,
                currentFontSize: getCurrentFontSizePt(ed),
                isBold: ed.isActive('bold'),
                isItalic: ed.isActive('italic'),
                isUnderline: ed.isActive('underline'),
                isStrike: ed.isActive('strike'),
                alignLeft,
                alignCenter,
                alignRight,
                alignJustify,
                isBulletList: ed.isActive('bulletList'),
                isOrderedList: ed.isActive('orderedList'),
                textColor: ed.getAttributes('textStyle').color || '#000',
            };
        },
    });

    const currentHeading = editorState.currentHeading;

    const fontSizeOptions = React.useMemo(() => {
        const set = new Set(FONT_SIZE_PRESETS);
        set.add(editorState.currentFontSize);
        return Array.from(set).sort((a, b) => a - b);
    }, [editorState.currentFontSize]);

    const applyFontSize = (sizePt: number) => {
        const next = Math.max(MIN_FONT_SIZE_PT, Math.min(MAX_FONT_SIZE_PT, Math.round(sizePt)));
        const applied = editor.chain().focus().setMark('textStyle', { fontSize: `${next}pt` }).run();
        if (!applied) {
            editor.commands.setMark('textStyle', { fontSize: `${next}pt` });
        }
    };

    return (
        <Box className="srs-custom-toolbar">
            {/* ── Undo / Redo ── */}
            <TBtn tip="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={historyLocked || !editorState.canUndo}>
                <UndoRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={historyLocked || !editorState.canRedo}>
                <RedoRoundedIcon sx={iconSx} />
            </TBtn>
            <Sep />

            {/* ── Heading select ── */}
            <Select
                size="small"
                value={currentHeading}
                onChange={(e: SelectChangeEvent<number>) => {
                    const v = Number(e.target.value);
                    if (v === 0) editor.chain().focus().setParagraph().run();
                    else editor.chain().focus().setHeading({ level: v as 1 | 2 | 3 | 4 | 5 }).run();
                }}
                sx={{ ...miniSelectSx, minWidth: 110 }}
            >
                {HEADINGS.map(h => <MenuItem key={h.value} value={h.value} sx={{ fontSize: '0.78rem' }}>{h.label}</MenuItem>)}
            </Select>

            {/* ── Font select ── */}
            <Select
                size="small"
                value=""
                displayEmpty
                onChange={(e: SelectChangeEvent<string>) => editor.chain().focus().setFontFamily(e.target.value).run()}
                sx={{ ...miniSelectSx, minWidth: 100 }}
                renderValue={(v) => v ? FONTS.find(f => f.value === v)?.label ?? 'Font' : 'Font'}
            >
                {FONTS.map(f => <MenuItem key={f.value} value={f.value} sx={{ fontSize: '0.78rem', fontFamily: f.value }}>{f.label}</MenuItem>)}
            </Select>
            <Select
                size="small"
                value={editorState.currentFontSize}
                onChange={(e: SelectChangeEvent<number>) => applyFontSize(Number(e.target.value))}
                sx={{ ...miniSelectSx, minWidth: 62 }}
            >
                {fontSizeOptions.map((size) => (
                    <MenuItem key={size} value={size} sx={{ fontSize: '0.78rem' }}>
                        {size}
                    </MenuItem>
                ))}
            </Select>
            <Sep />

            {/* ── Text format ── */}
            <TBtn tip="Bold (Ctrl+B)" active={editorState.isBold} onClick={() => editor.chain().focus().toggleBold().run()}>
                <FormatBoldRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Italic (Ctrl+I)" active={editorState.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <FormatItalicRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Underline (Ctrl+U)" active={editorState.isUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <FormatUnderlinedRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Strikethrough" active={editorState.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <StrikethroughSRoundedIcon sx={iconSx} />
            </TBtn>
            <Sep />

            {/* ── Color pickers ── */}
            <Tooltip title="Text color" arrow>
                <label style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex' }}>
                    <IconButton size="small" component="span" sx={{ width: 30, height: 30, borderRadius: '6px', color: '#4b5563', '&:hover': { bgcolor: '#f3f4f6' } }}>
                        <FormatColorTextIcon sx={iconSx} />
                    </IconButton>
                    <input
                        type="color"
                        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, border: 'none', padding: 0, cursor: 'pointer', opacity: 0 }}
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    />
                    <span style={{
                        position: 'absolute', bottom: 2, left: 6, right: 6, height: 3,
                        background: editorState.textColor,
                        borderRadius: 1,
                    }} />
                </label>
            </Tooltip>
            <Tooltip title="Highlight" arrow>
                <label style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex' }}>
                    <IconButton size="small" component="span" sx={{ width: 30, height: 30, borderRadius: '6px', color: '#4b5563', '&:hover': { bgcolor: '#f3f4f6' } }}>
                        <BorderColorIcon sx={iconSx} />
                    </IconButton>
                    <input
                        type="color"
                        defaultValue="#fef08a"
                        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, border: 'none', padding: 0, cursor: 'pointer', opacity: 0 }}
                        onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
                    />
                    <span style={{
                        position: 'absolute', bottom: 2, left: 6, right: 6, height: 3,
                        background: '#fef08a',
                        borderRadius: 1,
                    }} />
                </label>
            </Tooltip>
            <Sep />

            {/* ── Alignment ── */}
            <TBtn tip="Align Left" active={editorState.alignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <FormatAlignLeftRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Align Center" active={editorState.alignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <FormatAlignCenterRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Align Right" active={editorState.alignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <FormatAlignRightRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Justify" active={editorState.alignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                <FormatAlignJustifyRoundedIcon sx={iconSx} />
            </TBtn>
            <Sep />

            {/* ── Lists ── */}
            <TBtn tip="Bullet list" active={editorState.isBulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <FormatListBulletedRoundedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Numbered list" active={editorState.isOrderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <FormatListNumberedRoundedIcon sx={iconSx} />
            </TBtn>
            <Sep />

            {/* ── Table ── */}
            <TBtn tip="Insert table 3×3" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                <TableChartOutlinedIcon sx={iconSx} />
            </TBtn>
            <Tooltip title="Add row" arrow>
                <span>
                    <IconButton size="small" onClick={() => editor.chain().focus().addRowAfter().run()}
                        sx={{ width: 26, height: 26, borderRadius: '6px', color: '#059669', '&:hover': { bgcolor: '#ecfdf5' } }}>
                        <AddRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Remove row" arrow>
                <span>
                    <IconButton size="small" onClick={() => editor.chain().focus().deleteRow().run()}
                        sx={{ width: 26, height: 26, borderRadius: '6px', color: '#dc2626', '&:hover': { bgcolor: '#fef2f2' } }}>
                        <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Delete table" arrow>
                <span>
                    <IconButton size="small" onClick={() => editor.chain().focus().deleteTable().run()}
                        sx={{ width: 26, height: 26, borderRadius: '6px', color: '#dc2626', '&:hover': { bgcolor: '#fef2f2' } }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </span>
            </Tooltip>
            <Sep />

            {/* ── Image / Link ── */}
            <TBtn tip="Insert image" onClick={onImageInsert}>
                <ImageOutlinedIcon sx={iconSx} />
            </TBtn>
            <TBtn tip="Insert / edit link" active={editor.isActive('link')} onClick={onLinkInsert}>
                <InsertLinkRoundedIcon sx={iconSx} />
            </TBtn>
            <Sep />

            {/* ── Page break ── */}
            <TBtn tip="Page break" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <InsertPageBreakOutlinedIcon sx={iconSx} />
            </TBtn>
        </Box>
    );
};

export default SrsEditorToolbar;
