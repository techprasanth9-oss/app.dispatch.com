import { useEffect, useState } from 'react'
import {
    History,
    X,
    RotateCcw,
    Loader2,
    AlertTriangle,
    Check,
    Clock,
} from 'lucide-react'
import {
    listVersions,
    restoreVersion,
    type TemplateVersion,
} from '../../services/templateService'

interface Props {
    isOpen: boolean
    onClose: () => void
    templateId: string | null
    currentVersion: number
    /** Called after a successful restore. Receives the restored template so the
        builder can reload its state. */
    onRestored: (template: any) => void
}

/**
 * Right-side drawer listing the template's version history newest first.
 * Each row shows version #, timestamp, "current" badge, optional change note,
 * and a Restore button. Restore confirms first — it's a mutation.
 */
export default function VersionHistoryPanel({
    isOpen,
    onClose,
    templateId,
    currentVersion,
    onRestored,
}: Props) {
    const [versions, setVersions] = useState<TemplateVersion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [restoringId, setRestoringId] = useState<string | null>(null)
    const [confirmTarget, setConfirmTarget] = useState<TemplateVersion | null>(null)

    const load = () => {
        if (!templateId) return
        setLoading(true)
        setError(null)
        listVersions(templateId)
            .then((res) => setVersions(res.data))
            .catch((err) => setError(err?.message ?? 'Failed to load history'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isOpen && templateId) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, templateId])

    async function handleRestore(v: TemplateVersion) {
        if (!templateId) return
        setRestoringId(v._id)
        setConfirmTarget(null)
        try {
            const res = await restoreVersion(templateId, v._id)
            onRestored(res.data)
            // Reload the list so the newly-created restore-snapshot shows up
            await new Promise((r) => setTimeout(r, 300))
            load()
        } catch (err: any) {
            setError(err?.message ?? 'Restore failed')
        } finally {
            setRestoringId(null)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Scrim */}
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
                aria-label="Close version history"
            />

            {/* Drawer */}
            <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-surface border-l border-line shadow-[0_0_60px_-12px_rgba(20,20,20,0.25)] flex flex-col animate-in slide-in-from-right duration-200">
                <header className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-accent-soft/60 border border-accent/25 flex items-center justify-center">
                            <History className="w-4 h-4 text-accent" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h2 className="font-serif text-[15px] font-semibold text-ink leading-tight">
                                Version history
                            </h2>
                            <p className="text-[11px] text-ink-muted">
                                Browse and restore earlier snapshots
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

                <div className="flex-1 overflow-y-auto p-5">
                    {!templateId ? (
                        <EmptyMessage
                            title="Save first"
                            body="Save your template at least once — versions are recorded on save."
                        />
                    ) : loading ? (
                        <div className="flex items-center justify-center py-16 text-ink-muted">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" strokeWidth={1.75} />
                            <span className="text-[13px]">Loading history…</span>
                        </div>
                    ) : error ? (
                        <div className="px-4 py-3 rounded-md bg-error/5 border border-error/25 flex items-start gap-2 mb-4">
                            <AlertTriangle
                                className="w-4 h-4 text-error flex-shrink-0 mt-0.5"
                                strokeWidth={2}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-error">{error}</p>
                                <button
                                    onClick={load}
                                    className="mt-1 text-[12px] font-medium text-error hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : versions.length === 0 ? (
                        <EmptyMessage
                            title="No history yet"
                            body="Save the template to record a version."
                        />
                    ) : (
                        <ol className="space-y-3">
                            {versions.map((v) => {
                                const isCurrent = v.version === currentVersion
                                const isBusy = restoringId === v._id
                                return (
                                    <li
                                        key={v._id}
                                        className={[
                                            'relative rounded-lg border p-4 transition-colors',
                                            isCurrent
                                                ? 'border-accent/30 bg-accent-soft/25'
                                                : 'border-line bg-surface hover:border-line-strong',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-serif text-[15px] font-semibold text-ink">
                                                        Version {v.version}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent border border-accent/25">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] text-ink-muted flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" strokeWidth={1.75} />
                                                    {formatDateTime(v.createdAt)}
                                                </p>
                                            </div>
                                            {!isCurrent && (
                                                <button
                                                    onClick={() => setConfirmTarget(v)}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken/60 disabled:opacity-50 transition-colors flex-shrink-0"
                                                >
                                                    {isBusy ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                                                            Restoring…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                                                            Restore
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {v.changeNote && (
                                            <p className="text-[12px] text-ink-muted leading-relaxed border-l-2 border-line pl-2.5 mt-2">
                                                {v.changeNote}
                                            </p>
                                        )}
                                        <p className="text-[10.5px] text-ink-subtle mt-2 font-mono truncate">
                                            {v.name}
                                        </p>
                                    </li>
                                )
                            })}
                        </ol>
                    )}
                </div>
            </aside>

            {/* Confirm dialog */}
            {confirmTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl w-full max-w-sm p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                        <div className="w-10 h-10 rounded-md bg-accent-soft/60 border border-accent/25 flex items-center justify-center mb-4">
                            <RotateCcw className="w-4 h-4 text-accent" strokeWidth={1.75} />
                        </div>
                        <h3 className="font-serif text-[15px] font-semibold text-ink mb-1.5">
                            Restore version {confirmTarget.version}?
                        </h3>
                        <p className="text-[13px] text-ink-muted leading-relaxed mb-5">
                            Your current draft becomes the newest version — you can restore it
                            back later from this same history list. Undo won't reach across.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setConfirmTarget(null)}
                                className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRestore(confirmTarget)}
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13px] transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function EmptyMessage({ title, body }: { title: string; body: string }) {
    return (
        <div className="text-center py-16">
            <div className="w-12 h-12 rounded-lg bg-surface-sunken border border-line flex items-center justify-center mx-auto mb-4">
                <History className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
            </div>
            <p className="font-serif text-[15px] font-semibold text-ink mb-1">{title}</p>
            <p className="text-[12.5px] text-ink-muted max-w-[280px] mx-auto leading-relaxed">
                {body}
            </p>
        </div>
    )
}

/** Compact date+time: "Mar 4, 2:14 PM" for recent, ISO date otherwise. */
function formatDateTime(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const now = new Date()
    const sameYear = d.getFullYear() === now.getFullYear()
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}
