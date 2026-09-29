import { EmailElement } from './DragDropBuilder'
import StylingSection from './styling-panel/StylingSection'
import StylingRow from './styling-panel/StylingRow'
import TypographyControls from './styling-panel/TypographyControls'
import ColorControls from './styling-panel/ColorControls'
import SpacingControls from './styling-panel/SpacingControls'
import BorderControls from './styling-panel/BorderControls'
import ImageControls from './styling-panel/ImageControls'
import { ArrowUp, ArrowDown, MousePointer2, Layout, Trash2, Link2 } from 'lucide-react'

interface UserFriendlyStylingPanelProps {
    element: EmailElement
    onUpdate: (updates: Partial<EmailElement>) => void
    onDelete: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    canMoveUp?: boolean
    canMoveDown?: boolean
}

/**
 * Right-side inspector for the currently-selected element in Visual mode.
 * Delegates most controls to the styling-panel/ sub-modules.
 */
export default function UserFriendlyStylingPanel({
    element,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
}: UserFriendlyStylingPanelProps) {
    const updateStyle = (key: string, value: string | number) => {
        onUpdate({
            styles: { ...element.styles, [key]: value },
        })
    }

    const updateListStyle = (style: 'unordered' | 'ordered' | 'nested') => {
        onUpdate({ listStyle: style })
    }

    const updateListItems = (items: string[]) => {
        onUpdate({ items })
    }

    const updateColumnLayout = (columns: number) => {
        const currentColumns = element.columns || []
        let newColumns = [...currentColumns]

        if (newColumns.length === 0) {
            newColumns = Array(columns).fill([])
        } else if (columns > newColumns.length) {
            for (let i = 0; i < columns - newColumns.length; i++) newColumns.push([])
        } else if (columns < newColumns.length) {
            newColumns = newColumns.slice(0, columns)
        }

        onUpdate({ columns: newColumns })
    }

    const hasText = ['heading', 'paragraph', 'button', 'list'].includes(element.type)
    const isImage = element.type === 'image'
    const isColumns = element.type === 'columns'
    const isButton = element.type === 'button'

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* ── Element actions bar ────────────────────────────── */}
            <div className="p-3 border-b border-line flex items-center justify-between bg-surface-sunken/40 flex-shrink-0">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.12em] flex items-center gap-1.5">
                    <MousePointer2 className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
                    {element.type}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onMoveUp}
                        disabled={!canMoveUp}
                        className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-30 disabled:hover:text-ink-muted disabled:hover:bg-transparent rounded transition-colors"
                        title="Move up"
                    >
                        <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={!canMoveDown}
                        className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-30 disabled:hover:text-ink-muted disabled:hover:bg-transparent rounded transition-colors"
                        title="Move down"
                    >
                        <ArrowDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <div className="w-px h-4 bg-line mx-1" />
                    <button
                        onClick={onDelete}
                        className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-error hover:bg-error/5 rounded transition-colors"
                        title="Delete element"
                    >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {/* ── Content ────────────────────────────────────── */}
                {(hasText || isButton) && (
                    <StylingSection title="Content" defaultOpen>
                        <StylingRow label="Text">
                            <textarea
                                value={element.content || ''}
                                onChange={(e) => onUpdate({ content: e.target.value })}
                                className="w-full px-3 py-2 text-[13px] text-ink bg-surface border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors min-h-[80px] placeholder:text-ink-subtle"
                                placeholder="Enter text here…"
                            />
                        </StylingRow>

                        {/* List controls */}
                        {element.type === 'list' && (
                            <>
                                <StylingRow label="List type">
                                    <div className="flex bg-surface-sunken/60 p-0.5 rounded-md border border-line">
                                        {['unordered', 'ordered'].map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => updateListStyle(style as any)}
                                                className={[
                                                    'flex-1 py-1.5 text-[12px] font-medium rounded capitalize transition-colors',
                                                    (element.listStyle || 'unordered') === style
                                                        ? 'bg-surface text-ink shadow-sm border border-line'
                                                        : 'text-ink-muted hover:text-ink border border-transparent',
                                                ].join(' ')}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </StylingRow>
                                <StylingRow label="List items">
                                    <textarea
                                        value={(element.items || []).join('\n')}
                                        onChange={(e) =>
                                            updateListItems(e.target.value.split('\n'))
                                        }
                                        className="w-full px-3 py-2 text-[13px] text-ink bg-surface border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors min-h-[120px] placeholder:text-ink-subtle"
                                        placeholder="Item 1&#10;Item 2&#10;Item 3"
                                    />
                                </StylingRow>
                            </>
                        )}

                        {/* Link URL — for buttons + text linkable elements */}
                        {(isButton || ['heading', 'paragraph'].includes(element.type)) && (
                            <StylingRow label="Link URL" description="Where should this link go?">
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={element.url || element.linkUrl || ''}
                                        onChange={(e) =>
                                            onUpdate({
                                                [isButton ? 'url' : 'linkUrl']: e.target.value,
                                            })
                                        }
                                        className="w-full pl-9 pr-3 py-2 text-[13px] text-ink bg-surface border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors placeholder:text-ink-subtle"
                                        placeholder="https://"
                                    />
                                    <Link2
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle"
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div className="mt-2 flex items-center gap-4">
                                    <label className="flex items-center gap-1.5 text-[12px] text-ink-muted cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={element.linkTarget !== '_blank'}
                                            onChange={() => onUpdate({ linkTarget: '_self' })}
                                            className="accent-accent"
                                        />
                                        Same tab
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[12px] text-ink-muted cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={element.linkTarget === '_blank'}
                                            onChange={() => onUpdate({ linkTarget: '_blank' })}
                                            className="accent-accent"
                                        />
                                        New tab
                                    </label>
                                </div>
                            </StylingRow>
                        )}
                    </StylingSection>
                )}

                {/* ── Heading level ──────────────────────────────── */}
                {element.type === 'heading' && (
                    <StylingSection title="Heading settings" defaultOpen>
                        <StylingRow label="Level">
                            <div className="flex bg-surface-sunken/60 p-0.5 rounded-md border border-line">
                                {[1, 2, 3, 4, 5, 6].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => onUpdate({ level })}
                                        className={[
                                            'flex-1 py-1.5 text-[12px] font-semibold rounded transition-colors',
                                            (element.level || 1) === level
                                                ? 'bg-surface text-ink shadow-sm border border-line'
                                                : 'text-ink-muted hover:text-ink border border-transparent',
                                        ].join(' ')}
                                    >
                                        H{level}
                                    </button>
                                ))}
                            </div>
                        </StylingRow>
                    </StylingSection>
                )}

                {/* ── Column layout ──────────────────────────────── */}
                {isColumns && (
                    <StylingSection title="Column layout" defaultOpen>
                        <StylingRow label="Columns">
                            <div className="flex bg-surface-sunken/60 rounded-md p-1 gap-1 border border-line">
                                {[1, 2, 3, 4].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => updateColumnLayout(count)}
                                        className={[
                                            'flex-1 py-2 text-[11px] font-medium rounded transition-colors flex flex-col items-center gap-1',
                                            (element.columns?.length || 2) === count
                                                ? 'bg-surface text-ink shadow-sm border border-line'
                                                : 'text-ink-muted hover:text-ink border border-transparent',
                                        ].join(' ')}
                                    >
                                        <Layout className="w-4 h-4" strokeWidth={1.75} />
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </StylingRow>

                        <StylingRow label="Column gap">
                            <select
                                value={element.columnGap || '16px'}
                                onChange={(e) => onUpdate({ columnGap: e.target.value })}
                                className="w-full h-9 px-3 text-[13px] border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong bg-surface text-ink transition-colors"
                            >
                                <option value="0px">None (0px)</option>
                                <option value="8px">Small (8px)</option>
                                <option value="16px">Medium (16px)</option>
                                <option value="24px">Large (24px)</option>
                                <option value="32px">X-Large (32px)</option>
                            </select>
                        </StylingRow>

                        <StylingRow label="Vertical align">
                            <div className="flex bg-surface-sunken/60 rounded-md p-0.5 border border-line">
                                {[
                                    { value: 'start', label: 'Top' },
                                    { value: 'center', label: 'Middle' },
                                    { value: 'end', label: 'Bottom' },
                                    { value: 'stretch', label: 'Stretch' },
                                ].map((align) => (
                                    <button
                                        key={align.value}
                                        onClick={() =>
                                            onUpdate({ columnAlign: align.value as any })
                                        }
                                        className={[
                                            'flex-1 py-1.5 text-[10.5px] font-medium rounded transition-colors',
                                            (element.columnAlign || 'stretch') === align.value
                                                ? 'bg-surface text-ink shadow-sm border border-line'
                                                : 'text-ink-muted hover:text-ink border border-transparent',
                                        ].join(' ')}
                                    >
                                        {align.label}
                                    </button>
                                ))}
                            </div>
                        </StylingRow>
                    </StylingSection>
                )}

                {/* ── Delegated controls ─────────────────────────── */}
                {hasText && (
                    <TypographyControls styles={element.styles} onUpdate={updateStyle} />
                )}

                <ColorControls
                    styles={element.styles}
                    onUpdate={updateStyle}
                    elementType={element.type}
                />

                {isImage && <ImageControls element={element} onUpdate={onUpdate} />}

                <SpacingControls styles={element.styles} onUpdate={updateStyle} />

                <BorderControls styles={element.styles} onUpdate={updateStyle} />
            </div>
        </div>
    )
}
