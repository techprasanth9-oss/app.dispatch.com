import { useState, useEffect } from 'react'
import { Type, PaintBucket, Pipette } from 'lucide-react'
import StylingSection from './StylingSection'

interface ColorControlsProps {
    styles: any
    onUpdate: (key: string, value: string) => void
    elementType: string
}

// Editorial neutrals first, then a broad user-facing palette. This is a
// picker for the user's design — not the app palette — so we keep bright
// hues available.
const defaultColors = [
    '#F7F3EC', '#FFFFFF', '#EFEAE0', '#E5DED2', '#6B6560', '#141414', '#000000',
    '#D14A2E', '#B23A1E', '#C08A2E', '#5A7A3E',
    '#EF4444', '#F87171', '#F59E0B', '#FBBF24',
    '#10B981', '#34D399', '#3B82F6', '#60A5FA',
    '#6366F1', '#818CF8', '#8B5CF6', '#A78BFA',
    '#EC4899', '#F472B6',
]

export default function ColorControls({ styles, onUpdate, elementType }: ColorControlsProps) {
    const [activeTab, setActiveTab] = useState<'text' | 'background'>('text')
    const hasText = ['heading', 'paragraph', 'button', 'list'].includes(elementType)

    useEffect(() => {
        if (!hasText) setActiveTab('background')
    }, [hasText])

    const handleColorChange = (color: string) => {
        onUpdate(activeTab === 'text' ? 'color' : 'backgroundColor', color)
    }

    const currentColor =
        activeTab === 'text'
            ? styles?.color || '#000000'
            : styles?.backgroundColor || 'transparent'

    return (
        <StylingSection title="Colors" defaultOpen>
            {hasText && (
                <div className="flex bg-surface-sunken/60 p-0.5 rounded-md border border-line mb-4">
                    <button
                        onClick={() => setActiveTab('text')}
                        className={[
                            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded transition-colors',
                            activeTab === 'text'
                                ? 'bg-surface text-ink shadow-sm border border-line'
                                : 'text-ink-muted hover:text-ink border border-transparent',
                        ].join(' ')}
                    >
                        <Type className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Text
                    </button>
                    <button
                        onClick={() => setActiveTab('background')}
                        className={[
                            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded transition-colors',
                            activeTab === 'background'
                                ? 'bg-surface text-ink shadow-sm border border-line'
                                : 'text-ink-muted hover:text-ink border border-transparent',
                        ].join(' ')}
                    >
                        <PaintBucket className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Background
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {/* Color picker + hex input */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div
                            className="w-10 h-10 rounded-md border-2 border-surface ring-1 ring-line cursor-pointer overflow-hidden hover:ring-line-strong transition-all"
                            style={{ backgroundColor: currentColor }}
                        >
                            <input
                                type="color"
                                value={currentColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface rounded-full border border-line flex items-center justify-center pointer-events-none">
                            <Pipette className="w-2 h-2 text-ink-muted" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center h-10 border border-line rounded-md bg-surface px-3 focus-within:ring-2 focus-within:ring-accent/15 focus-within:border-accent hover:border-line-strong transition-colors">
                            <span className="text-ink-subtle text-[13px] font-mono select-none mr-1">
                                #
                            </span>
                            <input
                                type="text"
                                value={currentColor.replace('#', '')}
                                onChange={(e) => handleColorChange(`#${e.target.value}`)}
                                className="w-full text-[13px] font-mono text-ink bg-transparent focus:outline-none uppercase tracking-wide"
                                placeholder="FFFFFF"
                                maxLength={6}
                            />
                        </div>
                    </div>
                </div>

                {/* Presets */}
                <div>
                    <label className="text-[10px] uppercase font-semibold text-ink-subtle tracking-[0.12em] mb-2 block">
                        Presets
                    </label>
                    <div className="grid grid-cols-8 gap-1.5">
                        {defaultColors.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                className={[
                                    'w-full aspect-square rounded border transition-all',
                                    currentColor.toLowerCase() === color.toLowerCase()
                                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface border-accent z-10 scale-110'
                                        : 'border-line hover:border-line-strong hover:scale-105',
                                ].join(' ')}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>

                {activeTab === 'background' && (
                    <div className="pt-3 border-t border-line mt-2">
                        <label className="text-[10px] uppercase font-semibold text-ink-subtle tracking-[0.12em] mb-2 block">
                            Background image
                        </label>
                        <input
                            type="text"
                            value={(styles?.backgroundImage || '').replace(
                                /^url\(["']?(.*)["']?\)$/,
                                '$1',
                            )}
                            onChange={(e) =>
                                onUpdate(
                                    'backgroundImage',
                                    e.target.value ? `url(${e.target.value})` : '',
                                )
                            }
                            className="w-full h-9 px-3 text-[13px] border border-line rounded-md bg-surface text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors placeholder:text-ink-subtle"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                )}
            </div>
        </StylingSection>
    )
}
