import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap node: AiActionButton
 * Renders an inline AI action button inside the editor.
 * Hidden in export mode via CSS class `.srs-ai-action`.
 *
 * Attributes:
 * - actionType: 'usecase' | 'screenflow' | 'db_schema' | 'mockup'
 * - label: display label
 * - done: true when image has been uploaded (button hidden via CSS)
 */
export const AiActionButton = Node.create({
    name: 'aiActionButton',
    group: 'block',
    atom: true, // not editable
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            actionType: { default: 'usecase' },
            label: { default: '📷 Upload' },
            done: { default: false },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-ai-action]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-ai-action': HTMLAttributes.actionType,
                'data-done': HTMLAttributes.done ? 'true' : 'false',
                'class': 'srs-ai-action',
                'contenteditable': 'false',
            }),
            ['button', {
                'class': 'srs-ai-action-btn',
                'data-action-type': HTMLAttributes.actionType,
            }, HTMLAttributes.label],
        ];
    },
});

export default AiActionButton;
