import { ArrowRight, Star } from 'lucide-react'

interface TemplateLike {
  id?: string
  title: string
  category?: string
  description?: string
  thumbnail?: string
  rating?: number
}

export default function TemplateCard({
  template,
  onOpen,
  actionLabel,
}: {
  template: TemplateLike
  onOpen: (t: TemplateLike) => void
  actionLabel?: string
}) {
  return (
    <div className="group bg-surface border border-line rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,20,20,0.03)] hover:shadow-[0_8px_24px_-8px_rgba(20,20,20,0.12)] hover:border-line-strong transition-all duration-200">
      <div className="h-44 bg-surface-sunken overflow-hidden relative">
        <img
          src={
            template.thumbnail ||
            'https://placehold.co/480x240/EFEAE0/6B6560?text=Template'
          }
          alt={template.title}
          className="object-cover h-full w-full group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-ink truncate">
              {template.title}
            </h3>
            {template.category && (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-accent-soft/60 text-accent border border-accent/25 text-[10.5px] font-semibold uppercase tracking-wide rounded">
                {template.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-ink-muted flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" strokeWidth={1.5} />
            <span className="font-medium">{template.rating ?? 4.8}</span>
          </div>
        </div>

        {template.description && (
          <p className="mt-2.5 text-[12.5px] text-ink-muted line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        )}

        <button
          onClick={() => onOpen(template)}
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-ink hover:bg-ink/90 text-paper rounded-md text-[13px] font-medium transition-colors"
        >
          {actionLabel || 'Use template'}
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
