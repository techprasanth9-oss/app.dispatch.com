import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react'

interface ElementControlsProps {
    onMoveUp?: () => void
    onMoveDown?: () => void
    onDelete?: () => void
    canMoveUp?: boolean
    canMoveDown?: boolean
    elementType?: string
}

/**
 * Floating chip above a selected canvas element. Ink-black on paper for
 * high contrast on any background the user's design happens to use.
 */
export default function ElementControls({
    onMoveUp,
    onMoveDown,
    onDelete,
    canMoveUp = false,
    canMoveDown = false,
    elementType,
}: ElementControlsProps) {
    return (
        <div className="absolute -top-8 left-0 flex items-center gap-0.5 bg-ink text-paper px-1 py-0.5 rounded-md text-[11px] z-20 shadow-[0_4px_16px_-4px_rgba(20,20,20,0.35)]">
            {elementType && (
                <span className="px-1.5 uppercase tracking-wide font-semibold opacity-70">
                    {elementType}
                </span>
            )}
            {(onMoveUp || onMoveDown || onDelete) && elementType && (
                <span className="w-px h-3 bg-paper/20 mx-0.5" />
            )}
            {onMoveUp && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onMoveUp()
                    }}
                    disabled={!canMoveUp}
                    className={[
                        'w-5 h-5 flex items-center justify-center rounded transition-colors',
                        canMoveUp ? 'hover:bg-paper/15' : 'opacity-40 cursor-not-allowed',
                    ].join(' ')}
                    title="Move up"
                >
                    <ArrowUp className="w-3 h-3" strokeWidth={2} />
                </button>
            )}
            {onMoveDown && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onMoveDown()
                    }}
                    disabled={!canMoveDown}
                    className={[
                        'w-5 h-5 flex items-center justify-center rounded transition-colors',
                        canMoveDown ? 'hover:bg-paper/15' : 'opacity-40 cursor-not-allowed',
                    ].join(' ')}
                    title="Move down"
                >
                    <ArrowDown className="w-3 h-3" strokeWidth={2} />
                </button>
            )}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-error/80 transition-colors ml-0.5"
                    title="Delete"
                >
                    <Trash2 className="w-3 h-3" strokeWidth={2} />
                </button>
            )}
        </div>
    )
}
