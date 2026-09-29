import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
    Zap,
    Check,
    X,
    Loader2,
    AlertTriangle,
    RefreshCw,
    Trash2,
    Plus,
    ExternalLink,
    ShieldCheck,
    Info,
    Star,
} from 'lucide-react'
import { useAuth } from '../store/authContext'
import {
    listEspConnections,
    createEspConnection,
    deleteEspConnection,
    activateEspConnection,
    verifyEspConnection,
    PROVIDER_META,
    type EspConnection,
    type EspProvider,
    type EspCredentialsInput,
} from '../services/espService'

/**
 * /settings/integrations — BYO-ESP setup.
 *
 * Top: provider grid, one card per available provider with a Connect button.
 * Bottom: list of existing connections, each with activate / verify / delete.
 * A modal opens for the Connect flow — different fields per provider driven
 * by PROVIDER_META.credentialFields.
 */

const inputClass =
    'w-full h-10 px-3 bg-surface border border-line rounded-md text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors'

function IntegrationsPage() {
    const { workspace } = useAuth()
    const [connections, setConnections] = useState<EspConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState<string | null>(null)
    const [connectFor, setConnectFor] = useState<EspProvider | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<EspConnection | null>(null)
    const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

    const canManage = workspace?.role === 'owner' || workspace?.role === 'admin'

    const activeConnection = useMemo(
        () => connections.find((c) => c.isActive) ?? null,
        [connections],
    )

    async function reload() {
        setLoading(true)
        setError(null)
        try {
            const res = await listEspConnections()
            setConnections(res.data)
        } catch (err: any) {
            setError(err?.message ?? 'Could not load ESP connections')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!workspace) return
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspace?._id])

    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 3500)
        return () => clearTimeout(t)
    }, [toast])

    async function handleActivate(c: EspConnection) {
        setBusy(c._id)
        try {
            await activateEspConnection(c._id)
            await reload()
            setToast({ kind: 'success', message: `${PROVIDER_META[c.provider].name} is now active.` })
        } catch (err: any) {
            setToast({ kind: 'error', message: err?.message ?? 'Activate failed' })
        } finally {
            setBusy(null)
        }
    }

    async function handleVerify(c: EspConnection) {
        setBusy(c._id)
        try {
            const res = await verifyEspConnection(c._id)
            await reload()
            setToast({
                kind: res.data.ok ? 'success' : 'error',
                message: res.data.message ?? (res.data.ok ? 'Verified' : 'Verification failed'),
            })
        } catch (err: any) {
            setToast({ kind: 'error', message: err?.message ?? 'Verification failed' })
        } finally {
            setBusy(null)
        }
    }

    async function handleDelete(c: EspConnection) {
        setBusy(c._id)
        setConfirmDelete(null)
        try {
            await deleteEspConnection(c._id)
            await reload()
            setToast({ kind: 'success', message: 'Connection removed.' })
        } catch (err: any) {
            setToast({ kind: 'error', message: err?.message ?? 'Delete failed' })
        } finally {
            setBusy(null)
        }
    }

    if (!workspace) {
        return <div className="text-ink-muted text-[13px]">No active workspace.</div>
    }

    return (
        <div>
            <header className="mb-8">
                <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2">
                    {workspace.name}
                </p>
                <h1 className="font-serif text-[32px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
                    Email providers
                </h1>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                    Connect the ESP your team already uses. Mailix designs and orchestrates —
                    delivery flows through your provider on your reputation.
                </p>
            </header>

            {/* Active provider banner */}
            {activeConnection && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border border-accent/25 bg-accent-soft/40">
                    <div className="w-9 h-9 rounded-md bg-surface border border-line flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-accent" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-ink">
                            Sending through {PROVIDER_META[activeConnection.provider].name}
                        </p>
                        <p className="text-[11.5px] text-ink-muted truncate">
                            {activeConnection.label} · from{' '}
                            <span className="font-mono">
                                {activeConnection.fromEmail ?? 'platform default'}
                            </span>
                        </p>
                    </div>
                </div>
            )}
            {!activeConnection && connections.length === 0 && !loading && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg border border-line bg-surface-sunken/40">
                    <Info className="w-3.5 h-3.5 text-ink-muted flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                    <p className="text-[12.5px] text-ink-muted leading-relaxed">
                        No ESP connected yet — outbound email uses the platform default (Resend).
                        Connect one below to send from your own domain and reputation.
                    </p>
                </div>
            )}

            {/* ── Available providers grid ────────────────────────── */}
            <section className="mb-8">
                <h2 className="text-[13.5px] font-semibold text-ink mb-3">Available providers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(PROVIDER_META).map((p) => {
                        const connected = connections.some((c) => c.provider === p.id)
                        return (
                            <div
                                key={p.id}
                                className="bg-surface border border-line rounded-lg p-4 flex items-start gap-3"
                            >
                                <ProviderMark provider={p.id} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-serif text-[15px] font-semibold text-ink">
                                            {p.name}
                                        </h3>
                                        {!p.available && (
                                            <span className="text-[9.5px] font-semibold uppercase tracking-wide bg-surface-sunken text-ink-subtle border border-line px-1.5 py-0.5 rounded">
                                                Soon
                                            </span>
                                        )}
                                        {connected && (
                                            <span className="text-[9.5px] font-semibold uppercase tracking-wide bg-success/10 text-success border border-success/25 px-1.5 py-0.5 rounded">
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-ink-muted leading-relaxed mb-3">
                                        {p.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setConnectFor(p.id)}
                                            disabled={!p.available || !canManage}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[12px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                                            {connected ? 'Add another' : 'Connect'}
                                        </button>
                                        <a
                                            href={p.docsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-muted hover:text-ink transition-colors"
                                        >
                                            Where to get keys
                                            <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── Existing connections list ───────────────────────── */}
            <section>
                <h2 className="text-[13.5px] font-semibold text-ink mb-3">
                    Your connections
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-error/5 border border-error/25 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-error flex-shrink-0" strokeWidth={2} />
                        <span className="text-[13px] text-error">{error}</span>
                        <button
                            onClick={reload}
                            className="ml-auto text-[12px] font-medium text-error hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-ink-muted">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" strokeWidth={1.75} />
                        <span className="text-[13px]">Loading connections…</span>
                    </div>
                ) : connections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line bg-surface-sunken/30 p-8 text-center">
                        <div className="w-11 h-11 rounded-md bg-surface border border-line flex items-center justify-center mx-auto mb-3">
                            <Zap className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
                        </div>
                        <p className="text-[13.5px] font-medium text-ink mb-1">
                            No connections yet
                        </p>
                        <p className="text-[12px] text-ink-muted">
                            Pick a provider above to connect your first ESP.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {connections.map((c) => (
                            <ConnectionRow
                                key={c._id}
                                connection={c}
                                busy={busy === c._id}
                                canManage={canManage}
                                onActivate={() => handleActivate(c)}
                                onVerify={() => handleVerify(c)}
                                onDelete={() => setConfirmDelete(c)}
                            />
                        ))}
                    </ul>
                )}
            </section>

            {/* Connect modal */}
            {connectFor && (
                <ConnectDialog
                    provider={connectFor}
                    onClose={() => setConnectFor(null)}
                    onCreated={async () => {
                        setConnectFor(null)
                        await reload()
                        setToast({ kind: 'success', message: 'Connection created.' })
                    }}
                    onError={(m) => setToast({ kind: 'error', message: m })}
                />
            )}

            {/* Delete confirm */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl w-full max-w-sm p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                        <div className="w-10 h-10 rounded-md bg-error/10 border border-error/25 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-4 h-4 text-error" strokeWidth={1.75} />
                        </div>
                        <h3 className="font-serif text-[15px] font-semibold text-ink mb-1.5">
                            Remove {confirmDelete.label}?
                        </h3>
                        <p className="text-[13px] text-ink-muted leading-relaxed mb-5">
                            {confirmDelete.isActive
                                ? 'This is your active provider. Outbound email will fall back to the platform default until you activate another.'
                                : 'The stored credentials are deleted immediately. You can reconnect later.'}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                className="h-9 px-3.5 text-[13px] font-medium bg-error text-white hover:bg-error/90 rounded-md transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={[
                        'fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg text-[13px] font-medium border shadow-[0_8px_24px_-8px_rgba(20,20,20,0.25)]',
                        toast.kind === 'success'
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-error text-white border-error',
                    ].join(' ')}
                >
                    {toast.kind === 'success' ? (
                        <Check className="w-4 h-4" strokeWidth={2.25} />
                    ) : (
                        <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                    )}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-1 opacity-70 hover:opacity-100"
                        aria-label="Dismiss"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    )
}

// ── Row ────────────────────────────────────────────────────────────────

function ConnectionRow({
    connection: c,
    busy,
    canManage,
    onActivate,
    onVerify,
    onDelete,
}: {
    connection: EspConnection
    busy: boolean
    canManage: boolean
    onActivate: () => void
    onVerify: () => void
    onDelete: () => void
}) {
    const meta = PROVIDER_META[c.provider]
    return (
        <li className="bg-surface border border-line rounded-lg p-4 flex items-start gap-3">
            <ProviderMark provider={c.provider} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-ink truncate">
                        {c.label}
                    </h3>
                    <span className="text-[11px] text-ink-subtle">{meta.name}</span>
                    {c.isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent border border-accent/25 px-1.5 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 fill-accent" strokeWidth={1.5} />
                            Active
                        </span>
                    )}
                    {c.verifiedAt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-success/10 text-success border border-success/25 px-1.5 py-0.5 rounded">
                            <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                            Verified
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-warning/10 text-warning border border-warning/25 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} />
                            Unverified
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11.5px] text-ink-muted">
                    {c.fromEmail && (
                        <span className="font-mono truncate">from {c.fromEmail}</span>
                    )}
                    {c.fromName && (
                        <>
                            <span>·</span>
                            <span className="truncate">"{c.fromName}"</span>
                        </>
                    )}
                    {Object.entries(c.credentialsMasked).map(([k, v]) => (
                        <span key={k} className="font-mono">
                            · {k}: {v}
                        </span>
                    ))}
                </div>
                {c.lastError && (
                    <p className="mt-1.5 text-[11.5px] text-error">
                        {c.lastError}
                    </p>
                )}
            </div>

            {canManage && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={onVerify}
                        disabled={busy}
                        title="Re-verify credentials"
                        className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 transition-colors disabled:opacity-50"
                    >
                        {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                        ) : (
                            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                    </button>
                    {!c.isActive && c.verifiedAt && (
                        <button
                            onClick={onActivate}
                            disabled={busy}
                            className="h-8 px-2.5 rounded-md bg-surface border border-line hover:border-line-strong text-ink font-medium text-[12px] transition-colors disabled:opacity-50"
                        >
                            Activate
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        disabled={busy}
                        title="Remove"
                        className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                </div>
            )}
        </li>
    )
}

// ── Connect dialog ─────────────────────────────────────────────────────

function ConnectDialog({
    provider,
    onClose,
    onCreated,
    onError,
}: {
    provider: EspProvider
    onClose: () => void
    onCreated: () => void | Promise<void>
    onError: (message: string) => void
}) {
    const meta = PROVIDER_META[provider]
    const [label, setLabel] = useState(`${meta.name} — production`)
    const [fromEmail, setFromEmail] = useState('')
    const [fromName, setFromName] = useState('')
    const [creds, setCreds] = useState<Record<string, string>>({})
    const [activate, setActivate] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const canSubmit = meta.credentialFields.every((f) =>
        !f.required ? true : Boolean(creds[f.key]?.trim()),
    )

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!canSubmit || submitting) return
        setSubmitting(true)
        try {
            await createEspConnection({
                label: label.trim(),
                fromEmail: fromEmail.trim() || undefined,
                fromName: fromName.trim() || undefined,
                credentials: { provider, ...creds } as EspCredentialsInput,
                activate,
            })
            await onCreated()
        } catch (err: any) {
            onError(err?.message ?? 'Connect failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <div className="bg-surface rounded-xl w-full max-w-md border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <ProviderMark provider={provider} size="sm" />
                        <div className="min-w-0">
                            <h2 className="font-serif text-[15px] font-semibold text-ink leading-tight">
                                Connect {meta.name}
                            </h2>
                            <p className="text-[11.5px] text-ink-muted truncate">
                                Credentials are encrypted at rest
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
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                            Label
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            required
                            className={inputClass}
                            placeholder="e.g. Prod SES · West"
                        />
                        <p className="mt-1 text-[11px] text-ink-subtle">
                            Shown in the connections list. You can add multiple.
                        </p>
                    </div>

                    {meta.credentialFields.map((f) => (
                        <div key={f.key}>
                            <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                                {f.label}
                                {f.required && <span className="text-error ml-0.5">*</span>}
                            </label>
                            <input
                                type={f.secret ? 'password' : 'text'}
                                value={creds[f.key] ?? ''}
                                onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                                required={f.required}
                                placeholder={f.placeholder}
                                className={inputClass + (f.secret ? ' font-mono' : '')}
                                autoComplete={f.secret ? 'off' : undefined}
                            />
                        </div>
                    ))}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                                From email
                                <span className="text-ink-subtle font-normal ml-1">(optional)</span>
                            </label>
                            <input
                                type="email"
                                value={fromEmail}
                                onChange={(e) => setFromEmail(e.target.value)}
                                placeholder="noreply@acme.com"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                                From name
                                <span className="text-ink-subtle font-normal ml-1">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={fromName}
                                onChange={(e) => setFromName(e.target.value)}
                                placeholder="Acme"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={activate}
                            onChange={(e) => setActivate(e.target.checked)}
                            className="mt-0.5 accent-accent"
                        />
                        <div>
                            <p className="text-[13px] font-medium text-ink leading-tight">
                                Make this the active provider immediately
                            </p>
                            <p className="text-[11.5px] text-ink-muted leading-snug">
                                All new sends route through this ESP right after we verify it.
                            </p>
                        </div>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit || submitting}
                            className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                                    Connecting…
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                                    Connect &amp; verify
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Provider tile mark ─────────────────────────────────────────────────

function ProviderMark({
    provider,
    size = 'md',
}: {
    provider: EspProvider
    size?: 'sm' | 'md'
}) {
    const dim = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-[13px]'
    const letter = PROVIDER_META[provider].name.charAt(0)
    // Different tint per provider so cards read at a glance
    const tint: Record<EspProvider, string> = {
        resend: 'bg-ink text-paper border-ink',
        brevo: 'bg-accent-soft/70 text-accent border-accent/30',
        sendgrid: 'bg-warning/10 text-warning border-warning/25',
        ses: 'bg-surface-sunken text-ink border-line',
    }
    return (
        <div
            className={[
                'rounded-md flex items-center justify-center font-serif font-semibold border flex-shrink-0',
                dim,
                tint[provider],
            ].join(' ')}
            aria-hidden="true"
        >
            {letter}
        </div>
    )
}

export const Route = createFileRoute('/_auth/settings/integrations')({
    component: IntegrationsPage,
})
