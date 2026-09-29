import { Square, Circle } from 'lucide-react'
import StylingSection from './StylingSection'
import StylingRow from './StylingRow'

interface BorderControlsProps {
    styles: any
    onUpdate: (key: string, value: string) => void
}

export default function BorderControls({ styles, onUpdate }: BorderControlsProps) {
    const borderStyle = styles?.borderStyle || 'none'
    const borderWidth = styles?.borderWidth || '0px'
    const borderColor = styles?.borderColor || '#000000'
    const borderRadius = styles?.borderRadius || '0px'

    const updateBorder = (key: string, value: string) => {
        // Auto-seed sensible defaults when enabling a border for the first time
        if (key === 'borderStyle' && value !== 'none' && !styles?.borderWidth) {
            onUpdate('borderWidth', '1px')
            onUpdate('borderColor', '#E5DED2')
        }
        onUpdate(key, value)
    }

    return (
        <StylingSection title="Border & radius" defaultOpen={false}>
            {/* Radius presets */}
            <StylingRow label="Corner radius">
                <div className="grid grid-cols-5 gap-1.5">
                    {[
                        { label: 'None', value: '0px', icon: Square },
                        { label: 'S', value: '4px' },
                        { label: 'M', value: '8px' },
                        { label: 'L', value: '16px' },
                        { label: 'Full', value: '9999px', icon: Circle },
                    ].map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => onUpdate('borderRadius', preset.value)}
                            className={[
                                'h-9 flex items-center justify-center rounded-md border transition-colors',
                                borderRadius === preset.value
                                    ? 'border-accent bg-accent-soft/60 text-accent'
                                    : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                            ].join(' ')}
                            title={preset.label}
                        >
                            {preset.icon ? (
                                <preset.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                            ) : (
                                <span className="text-[11px] font-medium">{preset.label}</span>
                            )}
                        </button>
                    ))}
                </div>
            </StylingRow>

            <div className="h-px bg-line my-3" />

            <StylingRow label="Border style">
                <div className="grid grid-cols-4 gap-1.5">
                    {['none', 'solid', 'dashed', 'dotted'].map((style) => (
                        <button
                            key={style}
                            onClick={() => updateBorder('borderStyle', style)}
                            className={[
                                'h-8 text-[11px] capitalize font-medium rounded-md border transition-colors',
                                borderStyle === style
                                    ? 'border-accent bg-accent-soft/60 text-accent'
                                    : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                            ].join(' ')}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </StylingRow>

            {borderStyle !== 'none' && (
                <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-1">
                    <StylingRow label="Width">
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={parseInt(borderWidth) || 1}
                                onChange={(e) => updateBorder('borderWidth', `${e.target.value}px`)}
                                className="flex-1 h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <span className="text-[12px] w-10 text-right font-mono text-ink-muted">
                                {borderWidth}
                            </span>
                        </div>
                    </StylingRow>

                    <StylingRow label="Color">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded border border-line"
                                style={{ backgroundColor: borderColor }}
                            />
                            <input
                                type="text"
                                value={borderColor}
                                onChange={(e) => updateBorder('borderColor', e.target.value)}
                                className="flex-1 h-8 px-2 text-[12px] border border-line rounded bg-surface text-ink font-mono uppercase focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                            />
                            <input
                                type="color"
                                value={borderColor}
                                onChange={(e) => updateBorder('borderColor', e.target.value)}
                                className="w-7 h-7 p-0 border border-line rounded overflow-hidden cursor-pointer"
                            />
                        </div>
                    </StylingRow>
                </div>
            )}
        </StylingSection>
    )
}
