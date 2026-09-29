import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EmailElement } from './DragDropBuilder';
import AddElementButton from './AddElementButton';
import NestedElement from './NestedElement';
import ColumnsElement from './ColumnsElement';
import ElementControls from './ElementControls';

interface ContainerElementProps {
    element: EmailElement;
    isSelected: boolean;
    selectedElementId: string | null;
    onSelect: () => void;
    onUpdate: (updates: Partial<EmailElement>) => void;
    onDelete: () => void;
    onSelectElement: (id: string | null) => void;
    onUpdateElement: (id: string, updates: Partial<EmailElement>) => void;
    onDeleteElement: (id: string) => void;
    onAddElement: (element: EmailElement) => void;
    onAddElementToColumn?: (columnIndex: number, element: EmailElement) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

export default function ContainerElement({
    element,
    isSelected,
    selectedElementId,
    onSelect,
    onUpdate,
    onDelete,
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    onAddElement,
    onAddElementToColumn,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: ContainerElementProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: element.id,
    });

    const { setNodeRef: dropRef, isOver } = useDroppable({
        id: `container-${element.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const elementStyle = {
        ...element.styles,
        position: 'relative' as const,
        outline: isSelected ? '2px solid #D14A2E' : 'none',
        outlineOffset: '2px',
        minHeight: '60px',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group"
        >
            <div className="relative">
                <div
                    ref={dropRef}
                    style={elementStyle}
                    onClick={(e) => {
                        // Only select container if clicking directly on it, not on children
                        if (e.target === e.currentTarget) {
                            onSelect();
                        }
                    }}
                    className={`relative ${isOver ? 'bg-accent-soft/60 border-2 border-accent border-dashed' : ''}`}
                >
                    {element.children && element.children.length > 0 ? (
                        <SortableContext items={element.children.map(el => el.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {element.children.map((child) => {
                                    // Handle columns element specially
                                    if (child.type === 'columns') {
                                        return (
                                            <ColumnsElement
                                                key={child.id}
                                                element={child}
                                                isSelected={selectedElementId === child.id}
                                                selectedElementId={selectedElementId}
                                                onSelect={() => onSelectElement(child.id)}
                                                onUpdate={(updates) => {
                                                    const newChildren = element.children?.map(c => c.id === child.id ? { ...c, ...updates } : c) || [];
                                                    onUpdate({ children: newChildren });
                                                }}
                                                onDelete={() => {
                                                    const newChildren = element.children?.filter(c => c.id !== child.id) || [];
                                                    onUpdate({ children: newChildren });
                                                }}
                                                onSelectElement={(id) => {
                                                    if (id === null) {
                                                        onSelectElement(child.id);
                                                    } else {
                                                        onSelectElement(id);
                                                    }
                                                }}
                                                onUpdateElement={(id, updates) => {
                                                    if (child.columns) {
                                                        const newColumns = child.columns.map((col, colIdx) => {
                                                            const colIdxToUpdate = child.columns?.findIndex(c => c.some(el => el.id === id));
                                                            if (colIdxToUpdate === colIdx) {
                                                                return col.map(c => c.id === id ? { ...c, ...updates } : c);
                                                            }
                                                            return col;
                                                        });
                                                        const newChildren = element.children?.map(c => c.id === child.id ? { ...c, columns: newColumns } : c) || [];
                                                        onUpdate({ children: newChildren });
                                                    }
                                                }}
                                                onDeleteElement={(id) => {
                                                    if (child.columns) {
                                                        const newColumns = child.columns.map(col => col.filter(c => c.id !== id));
                                                        const newChildren = element.children?.map(c => c.id === child.id ? { ...c, columns: newColumns } : c) || [];
                                                        onUpdate({ children: newChildren });
                                                    }
                                                }}
                                                onAddElementToColumn={(colIdx, newEl) => {
                                                    if (onAddElementToColumn) {
                                                        onAddElementToColumn(colIdx, newEl);
                                                    } else if (child.columns) {
                                                        const newColumns = [...child.columns];
                                                        newColumns[colIdx] = [...newColumns[colIdx], newEl];
                                                        const newChildren = element.children?.map(c => c.id === child.id ? { ...c, columns: newColumns } : c) || [];
                                                        onUpdate({ children: newChildren });
                                                    }
                                                }}
                                                onMoveUp={undefined}
                                                onMoveDown={undefined}
                                                canMoveUp={false}
                                                canMoveDown={false}
                                            />
                                        );
                                    }
                                    const childIndex = element.children?.findIndex(c => c.id === child.id) ?? -1;
                                    const canMoveChildUp = childIndex > 0;
                                    const canMoveChildDown = childIndex >= 0 && childIndex < (element.children?.length ?? 0) - 1;

                                    return (
                                        <NestedElement
                                            key={child.id}
                                            element={child}
                                            isSelected={selectedElementId === child.id}
                                            onSelect={(e) => {
                                                e?.stopPropagation();
                                                onSelectElement(child.id);
                                            }}
                                            onUpdate={(updates) => {
                                                const newChildren = element.children?.map(c => c.id === child.id ? { ...c, ...updates } : c) || [];
                                                onUpdate({ children: newChildren });
                                            }}
                                            onDelete={() => {
                                                const newChildren = element.children?.filter(c => c.id !== child.id) || [];
                                                onUpdate({ children: newChildren });
                                            }}
                                            onAddElement={onAddElement}
                                            parentPath={`${element.id}`}
                                            onMoveUp={() => {
                                                if (childIndex > 0 && element.children) {
                                                    const newChildren = [...element.children];
                                                    const temp = newChildren[childIndex];
                                                    newChildren[childIndex] = newChildren[childIndex - 1];
                                                    newChildren[childIndex - 1] = temp;
                                                    onUpdate({ children: newChildren });
                                                }
                                            }}
                                            onMoveDown={() => {
                                                if (childIndex >= 0 && childIndex < (element.children?.length ?? 0) - 1 && element.children) {
                                                    const newChildren = [...element.children];
                                                    const temp = newChildren[childIndex];
                                                    newChildren[childIndex] = newChildren[childIndex + 1];
                                                    newChildren[childIndex + 1] = temp;
                                                    onUpdate({ children: newChildren });
                                                }
                                            }}
                                            canMoveUp={canMoveChildUp}
                                            canMoveDown={canMoveChildDown}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    ) : (
                        <div className="text-ink-subtle text-[13px] py-8 text-center border-2 border-dashed border-line rounded-md bg-surface-sunken/30">
                            Empty container — add elements here
                        </div>
                    )}
                    <AddElementButton
                        onAddElement={onAddElement}
                        position="bottom"
                        showOnHover={true}
                        parentSelected={isSelected}
                    />
                </div>
                {isSelected && (
                    <ElementControls
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onDelete={onDelete}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
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

