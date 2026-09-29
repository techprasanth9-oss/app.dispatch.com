import { Maximize2, MoveHorizontal } from 'lucide-react'
import StylingSection from './StylingSection'

interface SpacingControlsProps {
    styles: any
    onUpdate: (key: string, value: string) => void
}

const spacingPresets = [
    { label: '0', value: '0' },
    { label: 'XS', value: '4px' },
    { label: 'S', value: '8px' },
    { label: 'M', value: '16px' },
    { label: 'L', value: '24px' },
    { label: 'XL', value: '32px' },
]

export default function SpacingControls({ styles, onUpdate }: SpacingControlsProps) {
    const renderSpacingInput = (type: 'padding' | 'margin') => {
        const currentValue = styles?.[type]

        return (
            <div className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-semibold text-ink-subtle tracking-[0.12em] flex items-center gap-1.5">
                        {type === 'padding' ? (
                            <Maximize2 className="w-3 h-3 text-accent" strokeWidth={1.75} />
                        ) : (
                            <MoveHorizontal className="w-3 h-3 text-ink-muted" strokeWidth={1.75} />
                        )}
                        {type}
                    </label>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-6 gap-1 mb-2 bg-surface-sunken/60 p-1 rounded-md border border-line">
                    {spacingPresets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => onUpdate(type, preset.value)}
                            className={[
                                'py-1 text-[11px] font-medium rounded transition-colors',
                                currentValue === preset.value
                                    ? 'bg-surface text-ink shadow-sm border border-line'
                                    : 'text-ink-muted hover:text-ink border border-transparent',
                            ].join(' ')}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Custom CSS input */}
                <div className="relative">
                    <input
                        type="text"
                        value={currentValue || ''}
                        onChange={(e) => onUpdate(type, e.target.value)}
                        className="w-full h-9 pl-3 pr-10 text-[12px] border border-line rounded-md text-ink bg-surface focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong font-medium transition-colors"
                        placeholder="e.g. 10px 20px"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-subtle font-mono pointer-events-none">
                        CSS
                    </div>
                </div>
            </div>
        )
    }

    return (
        <StylingSection title="Spacing" defaultOpen={false}>
            {renderSpacingInput('padding')}
            <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent my-4" />
            {renderSpacingInput('margin')}
        </StylingSection>
    )
}
