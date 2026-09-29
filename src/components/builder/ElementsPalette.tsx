import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
    Type,
    AlignLeft,
    List,
    Box,
    Layout,
    MousePointerClick,
    Image as ImageIcon,
    MoveVertical,
    Minus,
    GripVertical,
} from 'lucide-react'

interface PaletteElement {
    id: string
    label: string
    icon: React.ReactNode
    description: string
    category: 'content' | 'layout'
}

const elements: PaletteElement[] = [
    // Content
    { id: 'palette-heading', label: 'Heading', icon: <Type className="w-5 h-5" strokeWidth={1.75} />, description: 'Large title text', category: 'content' },
    { id: 'palette-paragraph', label: 'Paragraph', icon: <AlignLeft className="w-5 h-5" strokeWidth={1.75} />, description: 'Regular text block', category: 'content' },
    { id: 'palette-list', label: 'List', icon: <List className="w-5 h-5" strokeWidth={1.75} />, description: 'Bullet or numbered', category: 'content' },
    { id: 'palette-image', label: 'Image', icon: <ImageIcon className="w-5 h-5" strokeWidth={1.75} />, description: 'Upload or URL', category: 'content' },
    { id: 'palette-button', label: 'Button', icon: <MousePointerClick className="w-5 h-5" strokeWidth={1.75} />, description: 'Call to action', category: 'content' },

    // Layout
    { id: 'palette-columns', label: 'Columns', icon: <Layout className="w-5 h-5" strokeWidth={1.75} />, description: 'Multi-column row', category: 'layout' },
    { id: 'palette-div', label: 'Container', icon: <Box className="w-5 h-5" strokeWidth={1.75} />, description: 'Group elements', category: 'layout' },
    { id: 'palette-divider', label: 'Divider', icon: <Minus className="w-5 h-5" strokeWidth={1.75} />, description: 'Separator line', category: 'layout' },
    { id: 'palette-spacer', label: 'Spacer', icon: <MoveVertical className="w-5 h-5" strokeWidth={1.75} />, description: 'Empty space', category: 'layout' },
]

function DraggableElement({ element }: { element: PaletteElement }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: element.id,
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={[
                'group relative flex items-center gap-3 p-3 rounded-md cursor-grab active:cursor-grabbing',
                'bg-surface border border-line transition-all duration-200',
                'hover:border-line-strong hover:shadow-[0_2px_8px_-4px_rgba(20,20,20,0.08)]',
                isDragging ? 'opacity-50 ring-2 ring-accent scale-95' : 'opacity-100',
            ].join(' ')}
        >
            <div className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center transition-colors bg-surface-sunken border border-line text-ink-muted group-hover:bg-accent-soft/60 group-hover:border-accent/25 group-hover:text-accent">
                {element.icon}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-ink truncate">
                    {element.label}
                </div>
                <div className="text-[10.5px] text-ink-muted truncate">
                    {element.description}
                </div>
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-ink-subtle">
                <GripVertical className="w-4 h-4" strokeWidth={1.75} />
            </div>
        </div>
    )
}

export default function ElementsPalette() {
    const contentElements = elements.filter((el) => el.category === 'content')
    const layoutElements = elements.filter((el) => el.category === 'layout')

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-3 px-1">
                    Content blocks
                </h4>
                <div className="grid grid-cols-1 gap-2">
                    {contentElements.map((element) => (
                        <DraggableElement key={element.id} element={element} />
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-3 px-1">
                    Layout structure
                </h4>
                <div className="grid grid-cols-1 gap-2">
                    {layoutElements.map((element) => (
                        <DraggableElement key={element.id} element={element} />
                    ))}
                </div>
            </div>
        </div>
    )
}
