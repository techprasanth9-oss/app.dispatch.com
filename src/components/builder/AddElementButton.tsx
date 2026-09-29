import { useState } from 'react'
import {
    Plus,
    Type,
    AlignLeft,
    MousePointerClick,
    Image as ImageIcon,
    List,
    Columns as ColumnsIcon,
    Minus,
    MoveVertical,
} from 'lucide-react'
import { EmailElement } from './DragDropBuilder'

interface AddElementButtonProps {
    onAddElement: (element: EmailElement) => void
    position?: 'top' | 'bottom' | 'inline'
    showOnHover?: boolean
    parentSelected?: boolean
}

const ELEMENT_TYPES: { type: EmailElement['type']; label: string; icon: typeof Type }[] = [
    { type: 'heading', label: 'Heading', icon: Type },
    { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
    { type: 'button', label: 'Button', icon: MousePointerClick },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'list', label: 'List', icon: List },
    { type: 'columns', label: 'Columns', icon: ColumnsIcon },
    { type: 'divider', label: 'Divider', icon: Minus },
    { type: 'spacer', label: 'Spacer', icon: MoveVertical },
]

/**
 * Floating "+" button that opens a menu of element types. Used inside
 * containers and column drop zones. Vermillion FAB — the one place we
 * lean on brand color heavily inside the canvas, because it's the only
 * canvas-level UI users interact with.
 */
export default function AddElementButton({
    onAddElement,
    position = 'inline',
    showOnHover = true,
    parentSelected = false,
}: AddElementButtonProps) {
    const [showMenu, setShowMenu] = useState(false)

    const createElement = (type: EmailElement['type']): EmailElement => {
        const baseId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        switch (type) {
            case 'heading':
                return {
                    id: baseId,
                    type: 'heading',
                    content: 'New Heading',
                    level: 1,
                    styles: {
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#141414',
                        margin: '16px 0',
                    },
                }
            case 'paragraph':
                return {
                    id: baseId,
                    type: 'paragraph',
                    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                    styles: {
                        fontSize: '16px',
                        color: '#141414',
                        margin: '12px 0',
                        lineHeight: '1.6',
                    },
                }
            case 'list':
                return {
                    id: baseId,
                    type: 'list',
                    items: ['Item 1', 'Item 2', 'Item 3'],
                    styles: {
                        margin: '12px 0',
                        padding: '0 0 0 20px',
                    },
                }
            case 'button':
                return {
                    id: baseId,
                    type: 'button',
                    content: 'Click me',
                    styles: {
                        backgroundColor: '#D14A2E',
                        color: '#ffffff',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '15px',
                        fontWeight: '600',
                        margin: '16px 0',
                        display: 'inline-block',
                    },
                }
            case 'image':
                return {
                    id: baseId,
                    type: 'image',
                    content: 'https://via.placeholder.com/600x300',
                    styles: {
                        width: '100%',
                        margin: '16px 0',
                        borderRadius: '6px',
                    },
                }
            case 'divider':
                return {
                    id: baseId,
                    type: 'divider',
                    styles: {
                        height: '1px',
                        backgroundColor: '#E5DED2',
                        margin: '24px 0',
                        border: 'none',
                    },
                }
            case 'spacer':
                return {
                    id: baseId,
                    type: 'spacer',
                    styles: { height: '32px', margin: '0' },
                }
            case 'columns':
                return {
                    id: baseId,
                    type: 'columns',
                    columns: [
                        [{ id: `${baseId}-col1-1`, type: 'paragraph', content: 'Column 1 content' }],
                        [{ id: `${baseId}-col2-1`, type: 'paragraph', content: 'Column 2 content' }],
                    ],
                    styles: { margin: '16px 0' },
                    columnGap: '16px',
                    columnAlign: 'stretch',
                }
            default:
                return { id: baseId, type: 'paragraph', content: 'New element' }
        }
    }

    const handleAdd = (type: EmailElement['type']) => {
        onAddElement(createElement(type))
        setShowMenu(false)
    }

    const positionClass =
        position === 'top'
            ? 'absolute -top-4 left-1/2 -translate-x-1/2'
            : position === 'bottom'
                ? 'absolute -bottom-4 left-1/2 -translate-x-1/2'
                : 'mx-auto my-2'

    const shouldShow = !showOnHover || parentSelected

    return (
        <div
            className={[
                'relative',
                positionClass,
                shouldShow
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                'transition-opacity',
            ].join(' ')}
        >
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center w-8 h-8 bg-accent hover:bg-accent-hover text-white rounded-full transition-colors shadow-[0_4px_12px_-4px_rgba(209,74,46,0.45)] z-10"
                title="Add element"
            >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-surface rounded-lg shadow-[0_16px_40px_-12px_rgba(20,20,20,0.2)] border border-line z-30 min-w-[220px] overflow-hidden">
                        <div className="px-3 py-2 border-b border-line">
                            <p className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em]">
                                Add element
                            </p>
                        </div>
                        <div className="p-1">
                            {ELEMENT_TYPES.map(({ type, label, icon: Icon }) => (
                                <button
                                    key={type}
                                    onClick={() => handleAdd(type)}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-ink hover:bg-surface-sunken/60 rounded transition-colors text-left"
                                >
                                    <div className="w-6 h-6 rounded bg-surface-sunken border border-line flex items-center justify-center text-ink-muted">
                                        <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    </div>
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
