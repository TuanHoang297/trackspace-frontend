import React, { useRef } from 'react';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';

/** Resizable image view — drag the blue handle at the bottom-right to resize */
const ResizableImageView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
    const imgRef = useRef<HTMLImageElement>(null);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = imgRef.current?.offsetWidth ?? 300;

        const onMouseMove = (ev: MouseEvent) => {
            const newWidth = Math.max(40, startWidth + ev.clientX - startX);
            updateAttributes({ width: `${newWidth}px` });
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <NodeViewWrapper style={{ display: 'inline-block', position: 'relative', lineHeight: 0 }}>
            <img
                ref={imgRef}
                src={node.attrs.src}
                alt={node.attrs.alt ?? ''}
                title={node.attrs.title ?? ''}
                style={{
                    width: node.attrs.width ?? '100%',
                    maxWidth: '100%',
                    display: 'block',
                    cursor: 'default',
                    outline: selected ? '2px solid #3b82f6' : 'none',
                    outlineOffset: '2px',
                }}
            />
            {selected && (
                <div
                    onMouseDown={onMouseDown}
                    title="Kéo để thay đổi kích thước"
                    style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 14,
                        height: 14,
                        background: '#3b82f6',
                        border: '2px solid #fff',
                        borderRadius: 3,
                        cursor: 'se-resize',
                        zIndex: 10,
                    }}
                />
            )}
        </NodeViewWrapper>
    );
};

/** TipTap Image extension with resizable width attribute and custom node view */
export const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (el) => el.style.width || el.getAttribute('width') || null,
                renderHTML: (attrs) =>
                    attrs.width ? { style: `width: ${attrs.width}; max-width: 100%;` } : {},
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageView);
    },
});
