import { PREDEFINED_TEMPLATES } from '@/data/predefinedDragAndDropTemplates'
import { ArrowRight, LayoutTemplate } from 'lucide-react'

interface TemplatesPaletteProps {
    onSelect: (templateId: string) => void
}

/**
 * Left-panel gallery for drag-drop mode. Click a card to load its element
 * tree into the canvas.
 */
export default function TemplatesPalette({ onSelect }: TemplatesPaletteProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-serif font-semibold text-ink text-[14px]">
                        Email templates
                    </h4>
                    <p className="text-[11.5px] text-ink-muted mt-0.5">
                        Start with a pre-designed layout
                    </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent px-2 py-0.5 rounded border border-accent/25">
                    {PREDEFINED_TEMPLATES.length} available
                </span>
            </div>

            <div className="grid gap-3">
                {PREDEFINED_TEMPLATES.map((template) => (
                    <div
                        key={template.id}
                        className="group relative bg-surface border border-line rounded-lg p-4 hover:border-line-strong hover:shadow-[0_4px_16px_-8px_rgba(20,20,20,0.08)] transition-all cursor-pointer overflow-hidden"
                        onClick={() => onSelect(template.id)}
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-sm">
                                <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-11 h-11 bg-accent-soft/40 rounded-md flex items-center justify-center border border-accent/20 group-hover:scale-105 transition-transform">
                                <span className="text-[20px]">{template.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <h5 className="font-serif font-semibold text-ink text-[13.5px] truncate mb-1 group-hover:text-accent transition-colors">
                                    {template.name}
                                </h5>
                                <p className="text-[12px] text-ink-muted line-clamp-2 leading-relaxed mb-2.5">
                                    {template.description}
                                </p>
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-sunken/60 border border-line text-[10.5px] font-medium text-ink-muted">
                                    <LayoutTemplate className="w-3 h-3" strokeWidth={1.75} />
                                    {template.elements.length} blocks
                                </div>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </div>
                ))}
            </div>
        </div>
    )
}
