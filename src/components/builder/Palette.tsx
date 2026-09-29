import PREDEFINED_TEMPLATES from '../../data/predefinedTemplates'
import { ArrowRight, LayoutTemplate, ImageIcon } from 'lucide-react'

type InsertFn = (type: 'header' | 'paragraph' | 'image' | 'list' | 'delimiter') => void

/**
 * Left-panel template gallery for the EditorJS mode. Click a card to load
 * its editor data into the canvas.
 */
export default function Palette({
    loadTemplate,
}: {
    insert?: InsertFn
    loadTemplate: (data: any) => void
}) {
    const templateCount = PREDEFINED_TEMPLATES.length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h4 className="font-serif font-semibold text-ink text-[14px]">
                        Template library
                    </h4>
                    <p className="text-[11.5px] text-ink-muted mt-0.5">
                        Professional layouts for EditorJS
                    </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent px-2 py-0.5 rounded border border-accent/25">
                    {templateCount} available
                </span>
            </div>

            <div className="grid gap-3">
                {PREDEFINED_TEMPLATES.map((t) => (
                    <div
                        key={t.id}
                        className="group relative bg-surface border border-line rounded-lg p-3 hover:border-line-strong hover:shadow-[0_4px_16px_-8px_rgba(20,20,20,0.08)] transition-all cursor-pointer overflow-hidden"
                        onClick={() => loadTemplate(t.data)}
                    >
                        {/* Hover chevron chip */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-sm">
                                <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Thumbnail */}
                            <div className="relative w-full h-24 bg-surface-sunken rounded-md overflow-hidden border border-line">
                                {t.thumbnail ? (
                                    <img
                                        src={t.thumbnail}
                                        alt={t.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-line-strong">
                                        <ImageIcon className="w-7 h-7" strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h5 className="font-serif font-semibold text-ink text-[13.5px] truncate mb-1 group-hover:text-accent transition-colors">
                                    {t.title}
                                </h5>

                                {t.description && (
                                    <p className="text-[12px] text-ink-muted line-clamp-2 leading-relaxed mb-2.5">
                                        {t.description}
                                    </p>
                                )}

                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-sunken/60 border border-line text-[10.5px] font-medium text-ink-muted">
                                    <LayoutTemplate className="w-3 h-3" strokeWidth={1.75} />
                                    {t.data?.blocks?.length || 0} blocks
                                </div>
                            </div>
                        </div>

                        {/* Bottom accent line — animates on hover */}
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </div>
                ))}
            </div>
        </div>
    )
}
