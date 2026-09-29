import { useEffect, useMemo, useState } from 'react'
import {
    Braces,
    X,
    Plus,
    Trash2,
    Copy,
    Check,
    Sparkles,
    Info,
} from 'lucide-react'
import type { TemplateVariable } from '../../services/templateService'

interface Props {
    isOpen: boolean
    onClose: () => void
    variables: TemplateVariable[]
    /** Fires when the user commits changes — parent should include these in the next save. */
    onChange: (next: TemplateVariable[]) => void
    /** editorData text — used to auto-discover {{var}} usage. */
    editorTextForDetection?: string
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'True/False' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
]

/**
 * Modal for defining merge variables. Two flavours of row:
 *   - Auto-detected — variables found inside `{{...}}` in the editor
 *   - User-defined — manually added rows that may not appear in content yet
 * A local draft state lets the user edit freely; commits on Save.
 */
export default function VariablesPanel({
    isOpen,
    onClose,
    variables,
    onChange,
    editorTextForDetection = '',
}: Props) {
    const [draft, setDraft] = useState<TemplateVariable[]>(variables)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) setDraft(variables)
    }, [isOpen, variables])

    // Discover {{slug}} patterns in the current editor text. Merge with any
    // manually added slugs the user has typed but not yet referenced.
    const detectedSlugs = useMemo(() => {
        const set = new Set<string>()
        const re = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g
        let m: RegExpExecArray | null
        while ((m = re.exec(editorTextForDetection))) set.add(m[1])
        return set
    }, [editorTextForDetection])

    // Ensure every detected slug has a row (even if user hasn't customized it)
    useEffect(() => {
        if (!isOpen) return
        setDraft((prev) => {
            const bySlug = new Map(prev.map((v) => [v.slug, v]))
            for (const slug of detectedSlugs) {
                if (!bySlug.has(slug)) {
                    bySlug.set(slug, { slug, name: slug, type: 'string', defaultValue: '' })
                }
            }
            return Array.from(bySlug.values())
        })
    }, [detectedSlugs, isOpen])

    if (!isOpen) return null

    function updateRow(index: number, patch: Partial<TemplateVariable>) {
        setDraft((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
    }

    function addRow() {
        // Pick a fresh non-clashing slug
        let n = draft.length + 1
        while (draft.some((r) => r.slug === `var${n}`)) n++
        setDraft((rows) => [
            ...rows,
            { slug: `var${n}`, name: `var${n}`, type: 'string', defaultValue: '' },
        ])
    }

    function removeRow(index: number) {
        setDraft((rows) => rows.filter((_, i) => i !== index))
    }

    async function copyToken(slug: string) {
        const token = `{{${slug}}}`
        try {
            await navigator.clipboard.writeText(token)
            setCopied(slug)
            setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1600)
        } catch {
            // Silent — clipboard rejection is rare and not fatal
        }
    }

    function handleSave() {
        // Clean: drop rows with empty slug, dedupe by slug (last wins)
        const seen = new Map<string, TemplateVariable>()
        for (const v of draft) {
            const slug = v.slug.trim()
            if (!slug) continue
            seen.set(slug, {
                slug,
                name: (v.name || slug).trim(),
                type: v.type || 'string',
                defaultValue: v.defaultValue ?? null,
            })
        }
        onChange(Array.from(seen.values()))
        onClose()
    }

    const isDetected = (slug: string) => detectedSlugs.has(slug)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)] overflow-hidden">
                <header className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-accent-soft/60 border border-accent/25 flex items-center justify-center">
                            <Braces className="w-4 h-4 text-accent" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h2 className="font-serif text-[16px] font-semibold text-ink leading-tight">
                                Merge variables
                            </h2>
                            <p className="text-[11.5px] text-ink-muted">
                                Placeholder values that get filled per recipient
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                </header>

                <div className="px-6 py-4 border-b border-line bg-accent-soft/25 flex items-start gap-2.5">
                    <Info className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                    <p className="text-[12.5px] text-ink-muted leading-relaxed">
                        Insert a variable in any text block using{' '}
                        <code className="font-mono bg-surface px-1 py-0.5 rounded border border-line text-ink">
                            {'{{slug}}'}
                        </code>
                        . Rows tagged{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent border border-accent/25 mx-0.5">
                            <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                            Detected
                        </span>
                        are auto-picked from your current content.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {draft.length === 0 ? (
                        <div className="text-center py-14">
                            <div className="w-12 h-12 rounded-lg bg-surface-sunken border border-line flex items-center justify-center mx-auto mb-4">
                                <Braces className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
                            </div>
                            <p className="font-serif text-[15px] font-semibold text-ink mb-1">
                                No variables yet
                            </p>
                            <p className="text-[12.5px] text-ink-muted max-w-[320px] mx-auto leading-relaxed mb-5">
                                Add one manually, or type{' '}
                                <code className="font-mono bg-surface-sunken px-1 py-0.5 rounded border border-line text-ink">
                                    {'{{name}}'}
                                </code>{' '}
                                in any text block and it'll appear here.
                            </p>
                            <button
                                onClick={addRow}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-line hover:border-line-strong text-ink font-medium text-[13px] transition-colors"
                            >
                                <Plus className="w-4 h-4" strokeWidth={2} />
                                Add variable
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Header row */}
                            <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(110px,140px)_minmax(140px,1fr)_auto] gap-2 pb-2 border-b border-line mb-3">
                                <FieldHead>Slug</FieldHead>
                                <FieldHead>Display name</FieldHead>
                                <FieldHead>Type</FieldHead>
                                <FieldHead>Default value</FieldHead>
                                <FieldHead>{' '}</FieldHead>
                            </div>

                            <ul className="flex flex-col gap-2">
                                {draft.map((v, i) => (
                                    <li
                                        key={`${v.slug}-${i}`}
                                        className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(110px,140px)_minmax(140px,1fr)_auto] gap-2 items-center"
                                    >
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={v.slug}
                                                onChange={(e) =>
                                                    updateRow(i, {
                                                        slug: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                                                    })
                                                }
                                                className="w-full h-9 px-2 pr-16 font-mono text-[12.5px] bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
                                                placeholder="firstName"
                                            />
                                            {isDetected(v.slug) && (
                                                <span
                                                    title="Found inside {{...}} in your content"
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent border border-accent/25"
                                                >
                                                    <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                                                    Det.
                                                </span>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={v.name}
                                            onChange={(e) => updateRow(i, { name: e.target.value })}
                                            className="w-full h-9 px-2 text-[12.5px] bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
                                            placeholder="First name"
                                        />

                                        <select
                                            value={v.type || 'string'}
                                            onChange={(e) => updateRow(i, { type: e.target.value })}
                                            className="w-full h-9 px-2 text-[12.5px] bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
                                        >
                                            {TYPE_OPTIONS.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            value={v.defaultValue ?? ''}
                                            onChange={(e) => updateRow(i, { defaultValue: e.target.value })}
                                            className="w-full h-9 px-2 text-[12.5px] bg-surface border border-line rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
                                            placeholder="—"
                                        />

                                        <div className="flex items-center gap-0.5">
                                            <button
                                                onClick={() => copyToken(v.slug)}
                                                className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 rounded transition-colors"
                                                title={`Copy {{${v.slug}}}`}
                                            >
                                                {copied === v.slug ? (
                                                    <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => removeRow(i)}
                                                className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-error hover:bg-error/5 rounded transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={addRow}
                                className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-dashed border-line hover:border-line-strong text-ink-muted hover:text-ink font-medium text-[13px] transition-colors"
                            >
                                <Plus className="w-4 h-4" strokeWidth={2} />
                                Add variable
                            </button>
                        </>
                    )}
                </div>

                <footer className="flex items-center justify-between gap-3 px-6 py-4 border-t border-line flex-shrink-0">
                    <p className="text-[11.5px] text-ink-subtle">
                        {draft.length} variable{draft.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="h-9 px-3 bg-surface border border-line hover:border-line-strong text-ink rounded-md font-medium text-[13px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13px] transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
                            Save variables
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    )
}

function FieldHead({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.12em]">
            {children}
        </span>
    )
}
