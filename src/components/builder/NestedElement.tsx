import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmailElement } from './DragDropBuilder';
import ColumnsElement from './ColumnsElement';
import ContainerElement from './ContainerElement';
import ElementControls from './ElementControls';

interface NestedElementProps {
    element: EmailElement;
    isSelected: boolean;
    selectedElementId?: string | null;
    onSelect: (e?: React.MouseEvent) => void;
    onUpdate: (updates: Partial<EmailElement>) => void;
    onDelete: () => void;
    onAddElement: (element: EmailElement) => void;
    onSelectElement?: (id: string | null) => void;
    parentPath: string;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

export default function NestedElement({
    element,
    isSelected,
    selectedElementId,
    onSelect,
    onUpdate,
    onDelete,
    onAddElement,
    onSelectElement,
    parentPath,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
}: NestedElementProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: element.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const renderElement = () => {
        const elementStyle = {
            ...element.styles,
            position: 'relative' as const,
            outline: isSelected ? '2px solid #D14A2E' : 'none',
            outlineOffset: '2px',
        };

        switch (element.type) {
            case 'heading':
                const HeadingTag = `h${element.level || 1}` as keyof JSX.IntrinsicElements;
                const headingContent = element.content || 'Heading';
                if (element.linkUrl) {
                    return (
                        <HeadingTag style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                            <a
                                href={element.linkUrl}
                                target={element.linkTarget || '_self'}
                                rel={element.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {headingContent}
                            </a>
                        </HeadingTag>
                    );
                }
                return (
                    <HeadingTag style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                        {headingContent}
                    </HeadingTag>
                );
            case 'paragraph':
                const paragraphContent = element.content || 'Paragraph';
                if (element.linkUrl) {
                    return (
                        <p style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                            <a
                                href={element.linkUrl}
                                target={element.linkTarget || '_self'}
                                rel={element.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {paragraphContent}
                            </a>
                        </p>
                    );
                }
                return (
                    <p style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                        {paragraphContent}
                    </p>
                );
            case 'list':
                const listStyle = element.listStyle || 'unordered';
                if (listStyle === 'ordered') {
                    return (
                        <ol style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                            {(element.items || []).map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ol>
                    );
                }
                return (
                    <ul style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                        {(element.items || []).map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                );
            case 'button':
                const buttonContent = element.content || 'Button';
                const buttonStyle = {
                    backgroundColor: element.styles?.backgroundColor || '#D14A2E',
                    color: element.styles?.color || '#ffffff',
                    padding: element.styles?.padding || '12px 24px',
                    borderRadius: element.styles?.borderRadius || '8px',
                    fontSize: element.styles?.fontSize || '16px',
                    fontWeight: element.styles?.fontWeight || '600',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block',
                };

                if (element.url) {
                    return (
                        <div style={{ ...elementStyle, textAlign: element.styles?.textAlign || 'center' }} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                            <a
                                href={element.url}
                                target={element.linkTarget || '_blank'}
                                rel={element.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
                                style={buttonStyle}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {buttonContent}
                            </a>
                        </div>
                    );
                }

                return (
                    <div style={{ ...elementStyle, textAlign: element.styles?.textAlign || 'center' }} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                        <button style={buttonStyle}>
                            {buttonContent}
                        </button>
                    </div>
                );
            case 'image':
                const imageStyle = element.imageStyle || 'default';
                const imgStyle = {
                    ...elementStyle,
                    ...(imageStyle === 'circle' || imageStyle === 'avatar' ? {
                        borderRadius: '50%',
                        width: element.styles?.width || '100px',
                        height: element.styles?.height || '100px',
                        objectFit: 'cover' as const,
                    } : imageStyle === 'rounded' ? {
                        borderRadius: element.styles?.borderRadius || '8px',
                    } : {}),
                };
                return (
                    <img
                        src={element.content || 'https://via.placeholder.com/600x300'}
                        alt="Email image"
                        style={imgStyle}
                        onClick={(e) => { e.stopPropagation(); onSelect(e); }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300';
                        }}
                    />
                );
            case 'spacer':
                return <div style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }} />;
            case 'divider':
                return <hr style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }} />;
            case 'div':
                // Render div with children using ContainerElement
                return (
                    <ContainerElement
                        element={element}
                        isSelected={isSelected}
                        selectedElementId={selectedElementId || null}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onSelectElement={onSelectElement || ((id) => {
                            if (id === null) {
                                onSelect();
                            }
                        })}
                        onUpdateElement={(id, updates) => {
                            if (element.children) {
                                const newChildren = element.children.map(c => c.id === id ? { ...c, ...updates } : c);
                                onUpdate({ children: newChildren });
                            }
                        }}
                        onDeleteElement={(id) => {
                            if (element.children) {
                                const newChildren = element.children.filter(c => c.id !== id);
                                onUpdate({ children: newChildren });
                            }
                        }}
                        onAddElement={onAddElement}
                        onAddElementToColumn={(colIdx, newEl) => {
                            // Handle columns inside divs
                            if (element.children) {
                                const columnsChild = element.children.find(c => c.type === 'columns' && c.id);
                                if (columnsChild && columnsChild.columns) {
                                    const newColumns = [...columnsChild.columns];
                                    newColumns[colIdx] = [...newColumns[colIdx], newEl];
                                    const newChildren = element.children.map(c =>
                                        c.id === columnsChild.id ? { ...c, columns: newColumns } : c
                                    );
                                    onUpdate({ children: newChildren });
                                }
                            }
                        }}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                    />
                );
            case 'columns':
                // Render columns using ColumnsElement
                return (
                    <ColumnsElement
                        element={element}
                        isSelected={isSelected}
                        selectedElementId={selectedElementId || null}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onSelectElement={onSelectElement || ((id) => {
                            if (id === null) {
                                onSelect();
                            }
                        })}
                        onUpdateElement={(id, updates) => {
                            // This will be handled inside ColumnsElement
                        }}
                        onDeleteElement={(id) => {
                            // This will be handled inside ColumnsElement
                        }}
                        onAddElementToColumn={(colIdx, newEl) => {
                            if (element.columns) {
                                const newColumns = [...element.columns];
                                newColumns[colIdx] = [...newColumns[colIdx], newEl];
                                onUpdate({ columns: newColumns });
                            }
                        }}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                    />
                );
            default:
                return (
                    <div style={elementStyle} onClick={(e) => { e.stopPropagation(); onSelect(e); }}>
                        {element.content || element.type}
                    </div>
                );
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group"
            {...attributes}
            {...listeners}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(e);
            }}
        >
            <div className="relative">
                {renderElement()}
                {isSelected && (
                    <ElementControls
                        elementType={element.type}
                        onDelete={onDelete}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                    />
                )}
            </div>
        </div>
    );
}

