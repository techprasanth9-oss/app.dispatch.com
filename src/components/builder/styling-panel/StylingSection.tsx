import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface StylingSectionProps {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
    className?: string
}

/**
 * Collapsible section used to group related styling controls (Content,
 * Typography, Colors, Spacing, Borders…). Editorial palette — same
 * behaviour as before.
 */
export default function StylingSection({
    title,
    children,
    defaultOpen = true,
    className = '',
}: StylingSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={`border-b border-line last:border-0 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={[
                    'w-full flex items-center justify-between py-2 px-3 rounded-md my-1 transition-colors group',
                    isOpen
                        ? 'bg-surface-sunken/50'
                        : 'hover:bg-surface-sunken/40',
                ].join(' ')}
            >
                <span
                    className={[
                        'text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
                        isOpen ? 'text-ink' : 'text-ink-muted group-hover:text-ink',
                    ].join(' ')}
                >
                    {title}
                </span>
                {isOpen ? (
                    <ChevronDown
                        className="w-3.5 h-3.5 text-ink-subtle group-hover:text-ink-muted"
                        strokeWidth={1.75}
                    />
                ) : (
                    <ChevronRight
                        className="w-3.5 h-3.5 text-ink-subtle group-hover:text-ink-muted"
                        strokeWidth={1.75}
                    />
                )}
            </button>
            {isOpen && (
                <div className="pb-4 px-1 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    )
}
