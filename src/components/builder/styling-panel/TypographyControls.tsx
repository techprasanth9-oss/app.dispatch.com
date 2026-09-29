import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Type } from 'lucide-react'
import StylingSection from './StylingSection'
import StylingRow from './StylingRow'

interface TypographyControlsProps {
    styles: any
    onUpdate: (key: string, value: string | number) => void
}

export default function TypographyControls({ styles, onUpdate }: TypographyControlsProps) {
    const currentAlign = styles?.textAlign || 'left'
    const currentWeight = styles?.fontWeight || '400'
    const currentSize = styles?.fontSize || '16px'

    const parsePx = (value: string | undefined): number => {
        if (!value) return 16
        const match = String(value).match(/(\d+)/)
        return match ? parseInt(match[1]) : 16
    }

    return (
        <StylingSection title="Typography" defaultOpen>
            {/* Font size */}
            <StylingRow label="Font size">
                <div className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-ink-subtle" strokeWidth={1.75} />
                    <div className="flex-1 relative h-6 flex items-center">
                        <input
                            type="range"
                            min="10"
                            max="72"
                            value={parsePx(currentSize)}
                            onChange={(e) => onUpdate('fontSize', `${e.target.value}px`)}
                            className="w-full h-1 bg-line rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
                        />
                    </div>
                    <div className="w-16 h-8 relative">
                        <div className="absolute inset-0 border border-line rounded-md bg-surface flex items-center px-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 transition-colors">
                            <input
                                type="text"
                                value={currentSize}
                                onChange={(e) => onUpdate('fontSize', e.target.value)}
                                className="w-full h-full text-[12px] text-right focus:outline-none bg-transparent font-medium text-ink"
                            />
                        </div>
                    </div>
                </div>
            </StylingRow>

            <div className="space-y-4">
                {/* Align + weight row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-semibold text-ink-subtle tracking-[0.12em]">
                            Align
                        </label>
                        <div className="flex bg-surface-sunken/60 p-0.5 rounded-md border border-line">
                            {[
                                { value: 'left', icon: AlignLeft },
                                { value: 'center', icon: AlignCenter },
                                { value: 'right', icon: AlignRight },
                                { value: 'justify', icon: AlignJustify },
                            ].map((align) => (
                                <button
                                    key={align.value}
                                    onClick={() => onUpdate('textAlign', align.value)}
                                    className={[
                                        'flex-1 py-1.5 flex items-center justify-center rounded transition-colors',
                                        currentAlign === align.value
                                            ? 'bg-surface text-ink shadow-sm border border-line'
                                            : 'text-ink-muted hover:text-ink border border-transparent',
                                    ].join(' ')}
                                    title={`Align ${align.value}`}
                                >
                                    <align.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-semibold text-ink-subtle tracking-[0.12em]">
                            Weight
                        </label>
                        <div className="flex bg-surface-sunken/60 p-0.5 rounded-md border border-line">
                            {[
                                { label: 'R', value: '400', title: 'Regular' },
                                { label: 'M', value: '500', title: 'Medium' },
                                { label: 'B', value: '700', title: 'Bold' },
                            ].map((w) => (
                                <button
                                    key={w.value}
                                    onClick={() => onUpdate('fontWeight', w.value)}
                                    className={[
                                        'flex-1 py-1.5 text-[12px] rounded transition-colors',
                                        currentWeight === w.value
                                            ? 'bg-surface text-ink shadow-sm border border-line font-semibold'
                                            : 'text-ink-muted hover:text-ink border border-transparent',
                                        w.value === '700' ? 'font-bold' : w.value === '500' ? 'font-medium' : 'font-normal',
                                    ].join(' ')}
                                    title={w.title}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Line height */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold text-ink-subtle tracking-[0.12em]">
                        Line height
                    </label>
                    <div className="flex bg-surface-sunken/60 rounded-md p-0.5 border border-line">
                        {['1', '1.2', '1.5', '1.8', '2'].map((lh) => (
                            <button
                                key={lh}
                                onClick={() => onUpdate('lineHeight', lh)}
                                className={[
                                    'flex-1 py-1.5 text-[11px] font-medium rounded transition-colors',
                                    styles?.lineHeight === lh
                                        ? 'bg-surface text-ink shadow-sm border border-line'
                                        : 'text-ink-muted hover:text-ink border border-transparent',
                                ].join(' ')}
                            >
                                {lh}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </StylingSection>
    )
}
