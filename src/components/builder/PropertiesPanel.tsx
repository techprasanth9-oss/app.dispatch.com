import React, { useState, useEffect } from 'react'
import {
    ChevronDown,
    Pipette,
    Maximize2,
    Layout,
    Type,
    Image as ImageIcon,
    Grid3X3,
} from 'lucide-react'

/* ─── Collapsible section ────────────────────────────────────────────────── */

function AnimatedSection({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
    delay = 0,
}: {
    title: string
    icon: React.ElementType
    children: React.ReactNode
    defaultOpen?: boolean
    delay?: number
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setIsLoaded(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    return (
        <div
            className={[
                'border-b border-line last:border-b-0 transition-all duration-400 ease-out',
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
            ].join(' ')}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-sunken/50 transition-colors group"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-surface-sunken border border-line flex items-center justify-center group-hover:border-line-strong transition-colors">
                        <Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                    </div>
                    <span className="text-[13px] font-semibold text-ink">{title}</span>
                </div>
                <ChevronDown
                    className={[
                        'w-4 h-4 text-ink-subtle transition-transform duration-300',
                        isOpen ? 'rotate-180' : 'rotate-0',
                    ].join(' ')}
                    strokeWidth={1.75}
                />
            </button>

            <div
                className={[
                    'overflow-hidden transition-all duration-300 ease-out',
                    isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
                ].join(' ')}
            >
                <div className="px-4 pb-5">{children}</div>
            </div>
        </div>
    )
}

/* ─── Text/number input with optional prefix/suffix ──────────────────────── */

function InputField({
    label,
    value,
    onChange,
    suffix,
    prefix,
    type = 'text',
    min,
    max,
    placeholder,
}: {
    label?: string
    value: string | number
    onChange: (val: string) => void
    suffix?: string
    prefix?: string
    type?: string
    min?: number
    max?: number
    placeholder?: string
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.12em]">
                    {label}
                </label>
            )}
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-subtle font-medium">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    className={[
                        'w-full h-9 text-[13px] text-ink bg-surface border border-line rounded-md',
                        'placeholder:text-ink-subtle',
                        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                        'hover:border-line-strong transition-colors',
                        prefix ? 'pl-7' : 'pl-3',
                        suffix ? 'pr-9' : 'pr-3',
                    ].join(' ')}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-subtle font-medium">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    )
}

/* ─── Color swatch button ────────────────────────────────────────────────── */

function ColorSwatch({
    color,
    isSelected,
    onClick,
}: {
    color: string
    isSelected: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={[
                'relative w-full aspect-square rounded-md border transition-all cursor-pointer',
                isSelected
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110 z-10 border-accent'
                    : 'border-line hover:scale-105 hover:border-line-strong',
            ].join(' ')}
            style={{ backgroundColor: color }}
            title={color}
        >
            {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-paper rounded-full shadow-sm border border-ink/20" />
                </div>
            )}
        </button>
    )
}

/* ─── Range slider + inline number input ─────────────────────────────────── */

function RangeSlider({
    value,
    min,
    max,
    onChange,
    suffix,
}: {
    value: number
    min: number
    max: number
    onChange: (val: number) => void
    suffix?: string
}) {
    const percentage = ((value - min) / (max - min)) * 100
    // Vermillion fill on the left of the thumb, warm line color on the right
    const accentColor = 'rgb(209 74 46)'
    const trackColor = 'rgb(229 222 210)'

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={[
                        'w-full h-1.5 rounded-full appearance-none cursor-pointer',
                        '[&::-webkit-slider-thumb]:appearance-none',
                        '[&::-webkit-slider-thumb]:w-4',
                        '[&::-webkit-slider-thumb]:h-4',
                        '[&::-webkit-slider-thumb]:bg-accent',
                        '[&::-webkit-slider-thumb]:rounded-full',
                        '[&::-webkit-slider-thumb]:shadow-[0_1px_2px_rgba(20,20,20,0.15)]',
                        '[&::-webkit-slider-thumb]:border-2',
                        '[&::-webkit-slider-thumb]:border-paper',
                        '[&::-webkit-slider-thumb]:transition-transform',
                        '[&::-webkit-slider-thumb]:duration-150',
                        '[&::-webkit-slider-thumb]:hover:scale-110',
                        '[&::-webkit-slider-thumb]:active:scale-95',
                    ].join(' ')}
                    style={{
                        background: `linear-gradient(to right, ${accentColor} ${percentage}%, ${trackColor} ${percentage}%)`,
                    }}
                />
            </div>
            <div className="w-16">
                <InputField
                    value={value}
                    onChange={(v) => onChange(Number(v))}
                    suffix={suffix}
                    type="number"
                />
            </div>
        </div>
    )
}

/* ─── Reusable label ─────────────────────────────────────────────────────── */

function FieldLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <label className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.12em] flex items-center gap-1.5">
            {icon}
            {children}
        </label>
    )
}

/* ─── Padding side input (T/B/L/R) ───────────────────────────────────────── */

function PaddingSide({
    side,
    value,
    onChange,
}: {
    side: 'T' | 'B' | 'L' | 'R'
    value: number
    onChange: (v: number) => void
}) {
    return (
        <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-surface-sunken border border-line flex items-center justify-center">
                <span className="text-[9.5px] font-bold text-ink-muted">{side}</span>
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full pl-10 pr-8 h-9 text-[13px] text-right text-ink bg-surface border border-line rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-subtle">
                px
            </span>
        </div>
    )
}

/* ─── Main panel ─────────────────────────────────────────────────────────── */

export default function PropertiesPanel({
    pageLayouts,
    onUpdatePageLayout,
    professionalOptions,
    onUpdateProfessionalOptions,
}: {
    pageLayouts: any
    onUpdatePageLayout: (partial: any) => void
    professionalOptions: { fontFamily: string; baseColor: string }
    onUpdateProfessionalOptions: (partial: any) => void
}) {
    const layout = pageLayouts?.[0] || {
        background: '#ffffff',
        backgroundImage: '',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        margins: { top: 40, right: 0, bottom: 0, left: 0 },
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        width: 900,
        maxWidth: 900,
        borderRadius: 8,
    }

    // Color palette shown as swatches. Kept intentionally broad so the user
    // has real color choices — this isn't the app palette, it's a picker.
    // First row is the editorial neutrals so users can pick "paper" easily.
    const defaultColors = [
        '#F7F3EC', '#FFFFFF', '#EFEAE0', '#E5DED2', '#6B6560', '#141414',
        '#D14A2E', '#B8412A', '#5A7A3E', '#C08A2E', '#B23A1E',
        '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444',
        '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316',
        '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308',
        '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e',
        '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6',
        '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7',
    ]

    const paddingPresets = [
        { label: 'None', value: 0 },
        { label: 'S', value: 16 },
        { label: 'M', value: 32 },
        { label: 'L', value: 48 },
        { label: 'XL', value: 64 },
    ]

    const fontOptions = [
        { value: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto", label: 'Inter' },
        { value: "Fraunces, Georgia, serif", label: 'Fraunces (serif)' },
        { value: "Arial, Helvetica, sans-serif", label: 'Arial' },
        { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
        { value: "'Courier New', Courier, monospace", label: 'Monospace' },
        { value: "'Times New Roman', Times, serif", label: 'Times' },
        { value: "Helvetica, Arial, sans-serif", label: 'Helvetica' },
    ]

    const applyPaddingPreset = (value: number) => {
        onUpdatePageLayout({
            padding: { top: value, right: value, bottom: value, left: value },
        })
    }

    return (
        <div className="flex flex-col h-full bg-surface custom-scrollbar overflow-y-auto -mx-5 -my-5">
            <div className="flex-1 pb-6">
                {/* ── Canvas layout ─────────────────────────────────── */}
                <AnimatedSection
                    title="Canvas layout"
                    icon={Maximize2}
                    defaultOpen
                    delay={80}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <InputField
                                label="Width"
                                value={layout.width || 900}
                                onChange={(v) => onUpdatePageLayout({ width: Number(v) || 900 })}
                                suffix="px"
                                type="number"
                            />
                            <InputField
                                label="Max width"
                                value={layout.maxWidth || 900}
                                onChange={(v) =>
                                    onUpdatePageLayout({ maxWidth: Number(v) || 900 })
                                }
                                suffix="px"
                                type="number"
                            />
                        </div>

                        <div className="space-y-2">
                            <FieldLabel>Border radius</FieldLabel>
                            <RangeSlider
                                value={layout.borderRadius || 0}
                                min={0}
                                max={32}
                                onChange={(v) => onUpdatePageLayout({ borderRadius: v })}
                                suffix="px"
                            />
                        </div>
                    </div>
                </AnimatedSection>

                {/* ── Background ────────────────────────────────────── */}
                <AnimatedSection title="Background" icon={Layout} defaultOpen delay={120}>
                    <div className="space-y-4">
                        {/* Color picker */}
                        <div className="space-y-3">
                            <FieldLabel>Background color</FieldLabel>

                            <div className="flex items-center gap-3">
                                {/* Color preview + native picker */}
                                <div className="relative">
                                    <button
                                        className="w-11 h-11 rounded-md border-2 border-surface ring-1 ring-line overflow-hidden hover:ring-line-strong transition-all"
                                        style={{ backgroundColor: layout.background || '#ffffff' }}
                                        onClick={() =>
                                            document.getElementById('bg-color-picker')?.click()
                                        }
                                    >
                                        <input
                                            id="bg-color-picker"
                                            type="color"
                                            value={layout.background || '#ffffff'}
                                            onChange={(e) =>
                                                onUpdatePageLayout({ background: e.target.value })
                                            }
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </button>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface rounded-full border border-line flex items-center justify-center">
                                        <Pipette className="w-2 h-2 text-ink-muted" strokeWidth={1.75} />
                                    </div>
                                </div>

                                {/* Hex input */}
                                <div className="flex-1">
                                    <div className="flex items-center h-11 border border-line rounded-md bg-surface px-3 focus-within:ring-2 focus-within:ring-accent/15 focus-within:border-accent hover:border-line-strong transition-colors">
                                        <span className="text-ink-subtle text-[13px] font-mono select-none mr-1">
                                            #
                                        </span>
                                        <input
                                            type="text"
                                            value={(layout.background || '').replace('#', '')}
                                            onChange={(e) =>
                                                onUpdatePageLayout({
                                                    background: `#${e.target.value}`,
                                                })
                                            }
                                            className="w-full text-[13px] font-mono text-ink bg-transparent focus:outline-none uppercase tracking-wide"
                                            placeholder="FFFFFF"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color grid */}
                            <div className="grid grid-cols-7 gap-2 pt-1">
                                {defaultColors.map((color) => (
                                    <ColorSwatch
                                        key={color}
                                        color={color}
                                        isSelected={
                                            (layout.background || '').toLowerCase() ===
                                            color.toLowerCase()
                                        }
                                        onClick={() => onUpdatePageLayout({ background: color })}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Background image */}
                        <div className="pt-3 border-t border-line space-y-3">
                            <FieldLabel icon={<ImageIcon className="w-3 h-3" strokeWidth={1.75} />}>
                                Background image
                            </FieldLabel>

                            <input
                                type="text"
                                value={layout.backgroundImage || ''}
                                onChange={(e) =>
                                    onUpdatePageLayout({ backgroundImage: e.target.value })
                                }
                                className="w-full h-9 px-3 text-[12px] bg-surface-sunken/50 border border-line rounded-md text-ink placeholder:text-ink-subtle font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
                                placeholder="https://example.com/image.jpg"
                            />

                            {layout.backgroundImage && (
                                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                    <SelectField
                                        value={layout.backgroundSize || 'cover'}
                                        onChange={(v) =>
                                            onUpdatePageLayout({ backgroundSize: v })
                                        }
                                        options={[
                                            { value: 'cover', label: 'Cover' },
                                            { value: 'contain', label: 'Contain' },
                                            { value: 'auto', label: 'Auto' },
                                        ]}
                                    />
                                    <SelectField
                                        value={layout.backgroundRepeat || 'no-repeat'}
                                        onChange={(v) =>
                                            onUpdatePageLayout({ backgroundRepeat: v })
                                        }
                                        options={[
                                            { value: 'no-repeat', label: 'No repeat' },
                                            { value: 'repeat', label: 'Repeat' },
                                            { value: 'repeat-x', label: 'Repeat X' },
                                            { value: 'repeat-y', label: 'Repeat Y' },
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </AnimatedSection>

                {/* ── Padding ───────────────────────────────────────── */}
                <AnimatedSection title="Canvas padding" icon={Grid3X3} defaultOpen delay={160}>
                    <div className="space-y-4">
                        {/* Quick presets */}
                        <div className="space-y-2">
                            <FieldLabel>Quick presets</FieldLabel>
                            <div className="flex gap-1 p-1 bg-surface-sunken/60 border border-line rounded-md">
                                {paddingPresets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => applyPaddingPreset(preset.value)}
                                        className="flex-1 h-8 text-[11.5px] font-medium rounded transition-colors text-ink-muted hover:text-ink hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Individual sides */}
                        <div className="space-y-2">
                            <FieldLabel>Custom values</FieldLabel>
                            <div className="grid grid-cols-2 gap-3">
                                <PaddingSide
                                    side="T"
                                    value={layout.padding?.top || 0}
                                    onChange={(v) =>
                                        onUpdatePageLayout({
                                            padding: { ...(layout.padding || {}), top: v },
                                        })
                                    }
                                />
                                <PaddingSide
                                    side="B"
                                    value={layout.padding?.bottom || 0}
                                    onChange={(v) =>
                                        onUpdatePageLayout({
                                            padding: { ...(layout.padding || {}), bottom: v },
                                        })
                                    }
                                />
                                <PaddingSide
                                    side="L"
                                    value={layout.padding?.left || 0}
                                    onChange={(v) =>
                                        onUpdatePageLayout({
                                            padding: { ...(layout.padding || {}), left: v },
                                        })
                                    }
                                />
                                <PaddingSide
                                    side="R"
                                    value={layout.padding?.right || 0}
                                    onChange={(v) =>
                                        onUpdatePageLayout({
                                            padding: { ...(layout.padding || {}), right: v },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* ── Global styles ─────────────────────────────────── */}
                <AnimatedSection title="Global styles" icon={Type} defaultOpen delay={200}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <FieldLabel>Base font family</FieldLabel>
                            <SelectField
                                value={professionalOptions.fontFamily}
                                onChange={(v) =>
                                    onUpdateProfessionalOptions({ fontFamily: v })
                                }
                                options={fontOptions}
                            />
                        </div>

                        <div className="space-y-2">
                            <FieldLabel>Base text color</FieldLabel>
                            <div className="flex items-center gap-3">
                                <button
                                    className="relative w-10 h-10 rounded-md border-2 border-surface ring-1 ring-line overflow-hidden hover:ring-line-strong transition-all"
                                    style={{
                                        backgroundColor: professionalOptions.baseColor || '#000000',
                                    }}
                                    onClick={() =>
                                        document.getElementById('text-color-picker')?.click()
                                    }
                                >
                                    <input
                                        id="text-color-picker"
                                        type="color"
                                        value={professionalOptions.baseColor || '#000000'}
                                        onChange={(e) =>
                                            onUpdateProfessionalOptions({
                                                baseColor: e.target.value,
                                            })
                                        }
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </button>
                                <div className="flex-1">
                                    <div className="flex items-center h-10 border border-line rounded-md bg-surface px-3 focus-within:ring-2 focus-within:ring-accent/15 focus-within:border-accent hover:border-line-strong transition-colors">
                                        <span className="text-ink-subtle text-[13px] font-mono select-none mr-1">
                                            #
                                        </span>
                                        <input
                                            type="text"
                                            value={(professionalOptions.baseColor || '').replace(
                                                '#',
                                                '',
                                            )}
                                            onChange={(e) =>
                                                onUpdateProfessionalOptions({
                                                    baseColor: `#${e.target.value}`,
                                                })
                                            }
                                            className="w-full text-[13px] font-mono text-ink bg-transparent focus:outline-none uppercase"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>
            </div>

            {/* Warm-neutral scrollbars + one-shot fade for revealed sub-controls */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(var(--color-line-strong) / 0.5);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(var(--color-line-strong) / 0.9);
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgb(var(--color-line-strong) / 0.5) transparent;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    )
}

/* ─── Select field (used for background size/repeat + fonts) ─────────────── */

function SelectField({
    value,
    onChange,
    options,
}: {
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-9 pl-3 pr-9 text-[13px] bg-surface border border-line rounded-md text-ink appearance-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors cursor-pointer"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none"
                strokeWidth={1.75}
            />
        </div>
    )
}
