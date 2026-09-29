interface StylingRowProps {
    label: string
    children: React.ReactNode
    description?: string
    className?: string
}

/**
 * Labelled row inside a StylingSection. Label above, control below, optional
 * one-line description underneath.
 */
export default function StylingRow({
    label,
    children,
    description,
    className = '',
}: StylingRowProps) {
    return (
        <div className={`mb-3 ${className}`}>
            <div className="flex items-center justify-between mb-1.5">
                <label
                    className="text-[11.5px] font-medium text-ink-muted truncate mr-2"
                    title={label}
                >
                    {label}
                </label>
            </div>
            {children}
            {description && (
                <p className="mt-1 text-[10.5px] text-ink-subtle leading-tight">
                    {description}
                </p>
            )}
        </div>
    )
}
