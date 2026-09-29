import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EmailElement } from "./DragDropBuilder";
import AddElementButton from "./AddElementButton";
import NestedElement from "./NestedElement";
import ElementControls from "./ElementControls";

interface ColumnsElementProps {
  element: EmailElement;
  isSelected: boolean;
  selectedElementId: string | null;
  onSelect: () => void;
  onUpdate: (updates: Partial<EmailElement>) => void;
  onDelete: () => void;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<EmailElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddElementToColumn: (columnIndex: number, element: EmailElement) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

function ColumnDropZone({
  column,
  columnIndex,
  elementId,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  columnColor,
  columnPadding,
  onSelectColumns,
  columnsSelected,
  onMoveElementInColumn,
}: {
  column: EmailElement[];
  columnIndex: number;
  elementId: string;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<EmailElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (element: EmailElement) => void;
  columnColor?: string;
  columnPadding?: string;
  onSelectColumns?: () => void;
  columnsSelected?: boolean;
  onMoveElementInColumn?: (elementId: string, direction: "up" | "down") => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${elementId}-${columnIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: columnPadding || "8px",
        minHeight: "60px",
        backgroundColor: columnColor || (isOver ? "rgb(250 230 222 / 0.6)" : "transparent"),
        ...(isOver && !columnColor ? { border: "2px dashed #D14A2E" } : {}),
      }}
      className="relative column-zone"
      onClick={(e) => {
        // Select columns element when clicking on empty column zone
        const target = e.target as HTMLElement;
        if (
          target === e.currentTarget ||
          target.classList.contains("column-zone") ||
          (target.classList.contains("space-y-2") && column.length === 0)
        ) {
          e.stopPropagation();
          onSelectColumns?.();
        }
      }}
    >
      {column.length > 0 ? (
        <SortableContext
          items={column.map((el) => el.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {column.map((colElement, colElIndex) => {
              const canMoveColElUp = colElIndex > 0;
              const canMoveColElDown = colElIndex < column.length - 1;

              return (
                <NestedElement
                  key={colElement.id}
                  element={colElement}
                  isSelected={selectedElementId === colElement.id}
                  selectedElementId={selectedElementId}
                  onSelect={(e) => {
                    e?.stopPropagation();
                    onSelectElement(colElement.id);
                  }}
                  onUpdate={(updates) => {
                    const newColumn = column.map((c) =>
                      c.id === colElement.id ? { ...c, ...updates } : c
                    );
                    onUpdateElement(colElement.id, {
                      ...colElement,
                      ...updates,
                    });
                  }}
                  onDelete={() => onDeleteElement(colElement.id)}
                  onAddElement={onAddElement}
                  onSelectElement={onSelectElement}
                  parentPath={`${elementId}.col${columnIndex}`}
                  onMoveUp={() => {
                    if (colElIndex > 0 && onMoveElementInColumn) {
                      onMoveElementInColumn(colElement.id, "up");
                    }
                  }}
                  onMoveDown={() => {
                    if (
                      colElIndex < column.length - 1 &&
                      onMoveElementInColumn
                    ) {
                      onMoveElementInColumn(colElement.id, "down");
                    }
                  }}
                  canMoveUp={canMoveColElUp}
                  canMoveDown={canMoveColElDown}
                />
              );
            })}
          </div>
        </SortableContext>
      ) : (
        <div className="text-ink-subtle text-[11.5px] py-4 text-center border-2 border-dashed border-line rounded-md bg-surface-sunken/30">
          Empty column
        </div>
      )}
      <AddElementButton
        onAddElement={onAddElement}
        position="bottom"
        showOnHover={true}
        parentSelected={columnsSelected || false}
      />
    </div>
  );
}

export default function ColumnsElement({
  element,
  isSelected,
  selectedElementId,
  onSelect,
  onUpdate,
  onDelete,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddElementToColumn,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ColumnsElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
  });

  const { setNodeRef: columnsDropRef, isOver: columnsIsOver } = useDroppable({
    id: `columns-${element.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const elementStyle = {
    ...element.styles,
    position: "relative" as const,
    outline: isSelected ? "2px solid #D14A2E" : "none",
    outlineOffset: "2px",
    minHeight: "60px",
  };



  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="relative">
        <div
          ref={columnsDropRef}
          style={elementStyle as React.CSSProperties}
          onClick={(e) => {
            const target = e.target as HTMLElement;

            if (
              target === e.currentTarget ||
              target.classList.contains("columns-container") ||
              target.closest(".custom-columns-tool")
            ) {
              e.stopPropagation();
              onSelect();
            }
          }}
          className={`relative columns-container ${columnsIsOver ? "bg-accent-soft/60 border-2 border-accent border-dashed" : ""}`}
        >
          <style>
            {`
              /* Responsive styles for editor preview */
              .mobile-view-active .custom-columns-tool,
              .mobile-view-active .custom-columns-tool tbody,
              .mobile-view-active .custom-columns-tool tr,
              .mobile-view-active .custom-columns-tool td {
                display: block !important;
                width: 100% !important;
              }

              .mobile-view-active .custom-columns-tool td {
                box-sizing: border-box !important;
                padding-right: 0 !important;
                /* Use margin-bottom for gap in stack mode, except last one */
                margin-bottom: ${element.columnGap || "16px"} !important;
              }

              .mobile-view-active .custom-columns-tool td:last-child {
                margin-bottom: 0 !important;
              }
            `}
          </style>
          <table
            className="custom-columns-tool"
            cellPadding="0"
            cellSpacing="0"
            style={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "collapse",
              borderSpacing: 0,
            }}
          >
            <tbody>
              <tr>
                {element.columns?.map((column, colIdx) => {
                  const columnColor = element.columnColors?.[colIdx];
                  const columnPadding =
                    element.columnPadding?.[colIdx] || "8px";
                  const numColumns = element.columns?.length || 1;
                  const isLast = colIdx === numColumns - 1;
                  const gap = element.columnGap || "16px";

                  // Calculate width percentage
                  const widthPercent = 100 / numColumns;

                  return (
                    <td
                      key={colIdx}
                      className="custom-column"
                      style={{
                        width: `${widthPercent}%`,
                        verticalAlign:
                          element.columnAlign === "center"
                            ? "middle"
                            : element.columnAlign === "end"
                              ? "bottom"
                              : "top",
                        paddingRight: isLast ? 0 : gap,
                        boxSizing: "border-box",
                      }}
                    >
                      <ColumnDropZone
                        column={column}
                        columnIndex={colIdx}
                        elementId={element.id}
                        selectedElementId={selectedElementId}
                        onSelectElement={(id) => {
                          if (!id) {
                            onSelect();
                          } else {
                            onSelectElement(id);
                          }
                        }}
                        onUpdateElement={(id, updates) => {
                          const newColumns = [...(element.columns || [])];
                          newColumns[colIdx] = newColumns[colIdx].map((c) =>
                            c.id === id ? { ...c, ...updates } : c
                          );
                          onUpdate({ columns: newColumns });
                        }}
                        onDeleteElement={(id) => {
                          const newColumns = [...(element.columns || [])];
                          newColumns[colIdx] = newColumns[colIdx].filter(
                            (c) => c.id !== id
                          );
                          onUpdate({ columns: newColumns });
                        }}
                        onAddElement={(newEl) => {
                          const newColumns = [...(element.columns || [])];
                          newColumns[colIdx] = [
                            ...newColumns[colIdx],
                            newEl,
                          ];
                          onUpdate({ columns: newColumns });
                        }}
                        columnColor={columnColor}
                        columnPadding={columnPadding}
                        onSelectColumns={() => onSelect()}
                        columnsSelected={isSelected}
                        onMoveElementInColumn={(elementId, direction) => {
                          const newColumns = [...(element.columns || [])];
                          const col = newColumns[colIdx];
                          const elementIndex = col.findIndex(
                            (el) => el.id === elementId
                          );
                          if (elementIndex >= 0) {
                            if (direction === "up" && elementIndex > 0) {
                              const temp = col[elementIndex];
                              col[elementIndex] = col[elementIndex - 1];
                              col[elementIndex - 1] = temp;
                              newColumns[colIdx] = [...col];
                              onUpdate({ columns: newColumns });
                            } else if (
                              direction === "down" &&
                              elementIndex < col.length - 1
                            ) {
                              const temp = col[elementIndex];
                              col[elementIndex] = col[elementIndex + 1];
                              col[elementIndex + 1] = temp;
                              newColumns[colIdx] = [...col];
                              onUpdate({ columns: newColumns });
                            }
                          }
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {/* Bottom Toolbar Removed - functionality moved to Properties Panel */}
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
                    ${isSelected ? "opacity-100" : ""}
                `}
      >
        <div className="w-1 h-full bg-line hover:bg-accent rounded-full transition-colors" />
      </div>
    </div>
  );
}
