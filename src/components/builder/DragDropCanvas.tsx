import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmailElement } from './DragDropBuilder';
import ContainerElement from './ContainerElement';
import ColumnsElement from './ColumnsElement';
import ElementControls from './ElementControls';

interface DragDropCanvasProps {
    elements: EmailElement[];
    selectedElementId: string | null;
    onSelectElement: (id: string | null) => void;
    onUpdateElement: (id: string, updates: Partial<EmailElement>) => void;
    onDeleteElement: (id: string) => void;
    onAddElementToContainer?: (containerId: string, element: EmailElement) => void;
    onAddElementToColumn?: (containerId: string, columnIndex: number, element: EmailElement) => void;
    onMoveElementUp?: (id: string) => void;
    onMoveElementDown?: (id: string) => void;
    canMoveUp?: (id: string) => boolean;
    canMoveDown?: (id: string) => boolean;
    parentPath?: string; // For nested elements
}

function NestedElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onAddElement,
    parentPath = '',
}: {
    element: EmailElement;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<EmailElement>) => void;
    onDelete: () => void;
    onAddElement: (element: EmailElement) => void;
    parentPath: string;
}) {
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
                return (
                    <HeadingTag style={elementStyle} onClick={onSelect}>
                        {element.content || 'Heading'}
                    </HeadingTag>
                );
            case 'paragraph':
                return (
                    <p style={elementStyle} onClick={onSelect}>
                        {element.content || 'Paragraph'}
                    </p>
                );
            case 'list':
                return (
                    <ul style={elementStyle} onClick={onSelect}>
                        {(element.items || []).map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                );
            case 'button':
                return (
                    <div style={{ ...elementStyle, textAlign: element.styles?.textAlign || 'center' }} onClick={onSelect}>
                        <button
                            style={{
                                backgroundColor: element.styles?.backgroundColor || '#D14A2E',
                                color: element.styles?.color || '#ffffff',
                                padding: element.styles?.padding || '12px 24px',
                                borderRadius: element.styles?.borderRadius || '8px',
                                fontSize: element.styles?.fontSize || '16px',
                                fontWeight: element.styles?.fontWeight || '600',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {element.content || 'Button'}
                        </button>
                    </div>
                );
            case 'image':
                return (
                    <img
                        src={element.content || 'https://via.placeholder.com/600x300'}
                        alt="Email image"
                        style={{
                            display: element.styles?.display || 'block',
                            width: element.styles?.width || '100%',
                            maxWidth: element.styles?.maxWidth || '100%',
                            height: element.styles?.height || 'auto',
                            objectFit: element.styles?.objectFit || 'cover',
                            ...elementStyle,
                        }}
                        onClick={onSelect}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300';
                        }}
                    />
                );
            case 'spacer':
                return <div style={elementStyle} onClick={onSelect} />;
            case 'divider':
                return <hr style={elementStyle} onClick={onSelect} />;
            default:
                return (
                    <div style={elementStyle} onClick={onSelect}>
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
        >
            <div className="relative">
                {renderElement()}
                {isSelected && (
                    <div className="absolute -top-8 right-0 flex items-center gap-1 bg-ink text-paper px-2 py-1 rounded-md text-[11px] font-medium uppercase tracking-wide z-10 shadow-[0_4px_16px_-4px_rgba(20,20,20,0.35)]">
                        <span>{element.type}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="ml-1 hover:bg-error/80 rounded px-1"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableElement({
    element,
    isSelected,
    selectedElementId,
    onSelect,
    onUpdate,
    onDelete,
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    onAddElementToContainer,
    onAddElementToColumn,
    onMoveElementUp,
    onMoveElementDown,
    canMoveUp,
    canMoveDown,
    parentPath = '',
}: {
    element: EmailElement;
    isSelected: boolean;
    selectedElementId: string | null;
    onSelect: () => void;
    onUpdate: (updates: Partial<EmailElement>) => void;
    onDelete: () => void;
    onSelectElement: (id: string | null) => void;
    onUpdateElement: (id: string, updates: Partial<EmailElement>) => void;
    onDeleteElement: (id: string) => void;
    onAddElementToContainer?: (containerId: string, element: EmailElement) => void;
    onAddElementToColumn?: (containerId: string, columnIndex: number, element: EmailElement) => void;
    onMoveElementUp?: (id: string) => void;
    onMoveElementDown?: (id: string) => void;
    canMoveUp?: (id: string) => boolean;
    canMoveDown?: (id: string) => boolean;
    parentPath: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: element.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddToContainer = (newElement: EmailElement) => {
        if (onAddElementToContainer) {
            onAddElementToContainer(element.id, newElement);
        }
    };

    const handleAddToColumn = (columnIndex: number, newElement: EmailElement) => {
        if (onAddElementToColumn) {
            onAddElementToColumn(element.id, columnIndex, newElement);
        }
    };

    const renderElement = () => {
        const elementStyle = {
            ...element.styles,
            position: 'relative' as const,
            outline: isSelected ? '2px solid #D14A2E' : 'none',
            outlineOffset: '2px',
            minHeight: element.type === 'div' || element.type === 'columns' ? '60px' : undefined,
        };

        switch (element.type) {
            case 'heading':
                const HeadingTag = `h${element.level || 1}` as keyof JSX.IntrinsicElements;
                const headingContent = element.content || 'Heading';
                if (element.linkUrl) {
                    return (
                        <HeadingTag style={elementStyle} onClick={onSelect}>
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
                    <HeadingTag style={elementStyle} onClick={onSelect}>
                        {headingContent}
                    </HeadingTag>
                );
            case 'paragraph':
                const paragraphContent = element.content || 'Paragraph';
                if (element.linkUrl) {
                    return (
                        <p style={elementStyle} onClick={onSelect}>
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
                    <p style={elementStyle} onClick={onSelect}>
                        {paragraphContent}
                    </p>
                );
            case 'list':
                const listStyleType = element.listStyle || 'unordered';
                if (listStyleType === 'ordered') {
                    return (
                        <ol style={elementStyle} onClick={onSelect}>
                            {(element.items || []).map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ol>
                    );
                }
                return (
                    <ul style={elementStyle} onClick={onSelect}>
                        {(element.items || []).map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                );
            case 'div':
                return (
                    <ContainerElement
                        element={element}
                        isSelected={isSelected}
                        selectedElementId={selectedElementId || null}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onSelectElement={onSelectElement}
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
                        onAddElement={handleAddToContainer}
                        onAddElementToColumn={(colIdx, newEl) => {
                            // Handle columns inside containers
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
                        onMoveUp={onMoveElementUp ? () => onMoveElementUp(element.id) : undefined}
                        onMoveDown={onMoveElementDown ? () => onMoveElementDown(element.id) : undefined}
                        canMoveUp={canMoveUp ? canMoveUp(element.id) : false}
                        canMoveDown={canMoveDown ? canMoveDown(element.id) : false}
                    />
                );
            case 'columns':
                return (
                    <ColumnsElement
                        element={element}
                        isSelected={isSelected}
                        selectedElementId={selectedElementId || null}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onSelectElement={onSelectElement}
                        onUpdateElement={(id, updates) => {
                            // This will be handled inside ColumnsElement
                        }}
                        onDeleteElement={(id) => {
                            // This will be handled inside ColumnsElement
                        }}
                        onAddElementToColumn={handleAddToColumn}
                        onMoveUp={onMoveElementUp ? () => onMoveElementUp(element.id) : undefined}
                        onMoveDown={onMoveElementDown ? () => onMoveElementDown(element.id) : undefined}
                        canMoveUp={canMoveUp ? canMoveUp(element.id) : false}
                        canMoveDown={canMoveDown ? canMoveDown(element.id) : false}
                    />
                );
            case 'button':
                const buttonContent = element.content || 'Button';
                const buttonStyle = {
                    backgroundColor: element.styles?.backgroundColor || '#4f46e5',
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
                        <div style={{ ...elementStyle, textAlign: element.styles?.textAlign || 'center' }} onClick={onSelect}>
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
                    <div style={{ ...elementStyle, textAlign: element.styles?.textAlign || 'center' }} onClick={onSelect}>
                        <button style={buttonStyle}>
                            {buttonContent}
                        </button>
                    </div>
                );
            case 'image':
                return (
                    <img
                        src={element.content || 'https://via.placeholder.com/600x300'}
                        alt="Email image"
                        style={{
                            display: element.styles?.display || 'block',
                            width: element.styles?.width || '100%',
                            maxWidth: element.styles?.maxWidth || '100%',
                            height: element.styles?.height || 'auto',
                            objectFit: element.styles?.objectFit || 'cover',
                            ...elementStyle,
                        }}
                        onClick={onSelect}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300';
                        }}
                    />
                );
            case 'spacer':
                return <div style={elementStyle} onClick={onSelect} />;
            case 'divider':
                return <hr style={elementStyle} onClick={onSelect} />;
            default:
                return (
                    <div style={elementStyle} onClick={onSelect}>
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
        >
            <div className="relative">
                {renderElement()}
                {isSelected && (
                    <ElementControls
                        onMoveUp={onMoveElementUp ? () => onMoveElementUp(element.id) : undefined}
                        onMoveDown={onMoveElementDown ? () => onMoveElementDown(element.id) : undefined}
                        onDelete={onDelete}
                        canMoveUp={canMoveUp ? canMoveUp(element.id) : false}
                        canMoveDown={canMoveDown ? canMoveDown(element.id) : false}
                        elementType={element.type}
                    />
                )}
            </div>
            <div
                {...attributes}
                {...listeners}
                className={`
                    absolute -left-8 top-0 bottom-0 w-6 flex items-center justify-center
                    cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity
                    ${isSelected ? 'opacity-100' : ''}
                `}
            >
                <div className="w-1 h-full bg-line hover:bg-accent rounded-full transition-colors" />
            </div>
        </div>
    );
}

function DroppableCanvas({ children }: { children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-drop-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[600px] transition-colors ${isOver ? 'bg-accent-soft/60 border-2 border-accent border-dashed rounded-md' : ''}`}
        >
            {children}
        </div>
    );
}

export default function DragDropCanvas({
    elements,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    onAddElementToContainer,
    onAddElementToColumn,
    onAddElementToColumnInContainer,
    onMoveElementUp,
    onMoveElementDown,
    canMoveUp,
    canMoveDown,
}: DragDropCanvasProps) {
    if (elements.length === 0) {
        return (
            <DroppableCanvas>
                <div
                    className="flex items-center justify-center min-h-[600px] border-2 border-dashed border-line rounded-md bg-surface-sunken/20"
                    onClick={() => onSelectElement(null)}
                >
                    <div className="text-center">
                        <p className="font-serif text-[18px] font-semibold text-ink mb-1.5">
                            Empty canvas
                        </p>
                        <p className="text-[13px] text-ink-muted">
                            Drag elements from the left panel to start building
                        </p>
                    </div>
                </div>
            </DroppableCanvas>
        );
    }

    return (
        <DroppableCanvas>
            <SortableContext items={elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onSelectElement(null);
                    }
                }}>
                    {elements.map((element) => (
                        <SortableElement
                            key={element.id}
                            element={element}
                            isSelected={selectedElementId === element.id}
                            selectedElementId={selectedElementId}
                            onSelect={() => onSelectElement(element.id)}
                            onUpdate={(updates) => onUpdateElement(element.id, updates)}
                            onDelete={() => onDeleteElement(element.id)}
                            onSelectElement={onSelectElement}
                            onUpdateElement={onUpdateElement}
                            onDeleteElement={onDeleteElement}
                            onAddElementToContainer={onAddElementToContainer}
                            onAddElementToColumn={onAddElementToColumn}
                            onMoveElementUp={onMoveElementUp}
                            onMoveElementDown={onMoveElementDown}
                            canMoveUp={canMoveUp}
                            canMoveDown={canMoveDown}
                            parentPath=""
                        />
                    ))}
                </div>
            </SortableContext>
        </DroppableCanvas>
    );
}
