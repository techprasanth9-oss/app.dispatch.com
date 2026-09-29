import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
    Building2,
    Upload,
    Trash2,
    Check,
    Loader2,
    AlertTriangle,
    X,
} from 'lucide-react'
import { useAuth } from '../store/authContext'
import {
    updateWorkspace,
    deleteWorkspace,
    type Workspace,
} from '../services/workspaceService'
import { INDUSTRIES, COMPANY_SIZES, USE_CASES } from '../lib/constants'

/**
 * /settings/workspace — general settings for the active workspace.
 * Members live at /settings/members, integrations/billing/API later.
 * Save button lights up when any tracked field diverges from the loaded workspace.
 */

const MAX_LOGO_BYTES = 200 * 1024

interface FormState {
    name: string
    logo: string | null
    website: string
    description: string
    industry: string
    companySize: string
    useCases: string[]
    timezone: string
}

const emptyForm: FormState = {
    name: '',
    logo: null,
    website: '',
    description: '',
    industry: '',
    companySize: '',
    useCases: [],
    timezone: '',
}

function seedFromWorkspace(ws: Workspace | null | undefined): FormState {
    if (!ws) return emptyForm
    return {
        name: ws.name ?? '',
        logo: ws.logo ?? null,
        website: ws.website ?? '',
        description: ws.description ?? '',
        industry: ws.industry ?? '',
        companySize: ws.companySize ?? '',
        useCases: ws.useCases ?? [],
        timezone: ws.timezone ?? '',
    }
}

const inputClass =
    'w-full h-10 px-3 bg-surface border border-line rounded-md text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors'
const selectClass =
    inputClass +
    " appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B6560%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_12px_center]"

function WorkspaceGeneralPage() {
    const router = useRouter()
    const { workspace, bootstrap } = useAuth()

    const [form, setForm] = useState<FormState>(emptyForm)
    const [initial, setInitial] = useState<FormState>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteText, setDeleteText] = useState('')
    const logoRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const next = seedFromWorkspace(workspace)
        setForm(next)
        setInitial(next)
    }, [workspace])

    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 3500)
        return () => clearTimeout(t)
    }, [toast])

    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
    const canManage = workspace?.role === 'owner' || workspace?.role === 'admin'
    const isOwner = workspace?.role === 'owner'

    const timezones = useMemo(() => getTimezones(), [])

    function handleLogoFile(files: FileList | null) {
        const file = files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setToast({ kind: 'error', message: 'Choose an image (PNG, JPG, WEBP, SVG).' })
            return
        }
        if (file.size > MAX_LOGO_BYTES) {
            setToast({
                kind: 'error',
                message: `Image too large (${(file.size / 1024).toFixed(0)} KB). Max 200 KB.`,
            })
            return
        }
        const reader = new FileReader()
        reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result ?? '') }))
        reader.readAsDataURL(file)
    }

    async function handleSave() {
        if (!workspace || !dirty || saving) return
        setSaving(true)
        try {
            await updateWorkspace(workspace._id, {
                name: form.name.trim(),
                logo: form.logo,
                website: form.website.trim() || null,
                description: form.description.trim() || null,
                industry: form.industry || null,
                companySize: form.companySize || null,
                useCases: form.useCases,
                timezone: form.timezone || null,
            })
            await bootstrap()
            setInitial(form)
            setToast({ kind: 'success', message: 'Workspace updated.' })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save workspace.'
            setToast({ kind: 'error', message })
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!workspace || deleting) return
        if (deleteText.trim() !== workspace.name) return
        setDeleting(true)
        try {
            await deleteWorkspace(workspace._id)
            await bootstrap()
            router.navigate({ to: '/settings/workspaces' })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Delete failed.'
            setToast({ kind: 'error', message })
            setDeleting(false)
        }
    }

    if (!workspace) {
        return (
            <div className="text-ink-muted text-[13px]">
                No active workspace. Pick one from{' '}
                <a href="/settings/workspaces" className="text-accent hover:text-accent-hover font-medium">
                    Workspaces
                </a>
                .
            </div>
        )
    }

    return (
        <div>
            <header className="mb-8">
                <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2">
                    {workspace.name}
                </p>
                <h1 className="font-serif text-[32px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
                    General
                </h1>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                    Name, branding, and profile of this workspace.
                </p>
            </header>

            {/* ── Branding ─────────────────────────────────────────── */}
            <section className="bg-surface border border-line rounded-xl p-6 mb-6">
                <h2 className="text-[13.5px] font-semibold text-ink mb-4">Branding</h2>
                <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-sunken border border-line flex items-center justify-center flex-shrink-0">
                        {form.logo ? (
                            <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-8 h-8 text-ink-muted" strokeWidth={1.25} />
                        )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <input
                                ref={logoRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={(e) => handleLogoFile(e.target.files)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => logoRef.current?.click()}
                                disabled={!canManage}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-line hover:border-line-strong text-ink font-medium text-[13px] transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                                {form.logo ? 'Replace logo' : 'Upload logo'}
                            </button>
                            {form.logo && (
                                <button
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, logo: null }))}
                                    disabled={!canManage}
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-ink-muted hover:text-error hover:bg-error/5 font-medium text-[13px] transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    Remove
                                </button>
                            )}
                        </div>
                        <p className="text-[11.5px] text-ink-subtle">
                            PNG, JPG, WEBP, or SVG up to 200 KB. Square works best.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Details ──────────────────────────────────────────── */}
            <section className="bg-surface border border-line rounded-xl p-6 mb-6">
                <h2 className="text-[13.5px] font-semibold text-ink mb-5">Workspace details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    <Field label="Workspace name">
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className={inputClass}
                            disabled={!canManage}
                        />
                    </Field>

                    <Field label="Slug" hint="Auto-generated from the name.">
                        <input
                            type="text"
                            value={workspace.slug}
                            readOnly
                            className={inputClass + ' bg-surface-sunken cursor-not-allowed text-ink-muted font-mono'}
                        />
                    </Field>

                    <Field label="Website" optional>
                        <input
                            type="url"
                            value={form.website}
                            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                            placeholder="https://acme.com"
                            className={inputClass}
                            disabled={!canManage}
                        />
                    </Field>

                    <Field label="Industry" optional>
                        <select
                            value={form.industry}
                            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                            className={selectClass}
                            disabled={!canManage}
                        >
                            <option value="">— Choose —</option>
                            {INDUSTRIES.map((i) => (
                                <option key={i.value} value={i.value}>
                                    {i.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Team size" optional>
                        <select
                            value={form.companySize}
                            onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}
                            className={selectClass}
                            disabled={!canManage}
                        >
                            <option value="">— Choose —</option>
                            {COMPANY_SIZES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Time zone" optional>
                        <select
                            value={form.timezone}
                            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                            className={selectClass}
                            disabled={!canManage}
                        >
                            <option value="">— Not set —</option>
                            {timezones.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="sm:col-span-2">
                        <Field label="One-line description" optional>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="What does your team do?"
                                className={inputClass}
                                maxLength={140}
                                disabled={!canManage}
                            />
                        </Field>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-line">
                    <p className="text-[12.5px] font-medium text-ink mb-3">Use cases</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {USE_CASES.map((uc) => {
                            const selected = form.useCases.includes(uc.value)
                            return (
                                <button
                                    key={uc.value}
                                    type="button"
                                    disabled={!canManage}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            useCases: selected
                                                ? f.useCases.filter((x) => x !== uc.value)
                                                : [...f.useCases, uc.value],
                                        }))
                                    }
                                    className={[
                                        'flex items-start gap-2.5 p-3 rounded-md border text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                                        selected
                                            ? 'border-accent bg-accent-soft/50'
                                            : 'border-line bg-surface hover:border-line-strong',
                                    ].join(' ')}
                                >
                                    <div
                                        className={[
                                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                                            selected ? 'bg-accent border-accent' : 'bg-surface border-line',
                                        ].join(' ')}
                                    >
                                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium text-ink">{uc.label}</p>
                                        <p className="text-[11.5px] text-ink-muted leading-snug">
                                            {uc.description}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-5 border-t border-line">
                    <p className="text-[12px] text-ink-subtle">
                        {!canManage
                            ? 'View-only — ask an admin to edit.'
                            : dirty
                                ? 'You have unsaved changes.'
                                : 'Nothing to save.'}
                    </p>
                    {canManage && (
                        <button
                            onClick={handleSave}
                            disabled={!dirty || saving}
                            className={[
                                'inline-flex items-center gap-2 h-10 px-4 rounded-md font-medium text-[13.5px] transition-colors',
                                !dirty || saving
                                    ? 'bg-surface-sunken text-ink-subtle cursor-not-allowed'
                                    : 'bg-accent hover:bg-accent-hover text-white',
                            ].join(' ')}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" strokeWidth={2.25} />
                                    Save changes
                                </>
                            )}
                        </button>
                    )}
                </div>
            </section>

            {/* ── Danger zone (owner only) ─────────────────────────── */}
            {isOwner && (
                <section className="border border-error/25 bg-error/5 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-8 h-8 rounded-md bg-error/10 border border-error/25 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-error" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-ink">Danger zone</h2>
                            <p className="text-[12.5px] text-ink-muted mt-0.5">
                                Only owners can delete a workspace. Everything inside — templates,
                                assets, members — is soft-deleted.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-ink">Delete this workspace</p>
                            <p className="text-[12px] text-ink-muted leading-relaxed">
                                Permanent. Members lose access immediately.
                            </p>
                        </div>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="h-9 px-3 rounded-md bg-error/10 border border-error/25 text-error font-medium text-[13px] hover:bg-error hover:text-white transition-colors"
                        >
                            Delete workspace
                        </button>
                    </div>
                </section>
            )}

            {/* ── Delete confirm ───────────────────────────────────── */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl w-full max-w-md p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                        <div className="w-10 h-10 rounded-md bg-error/10 border border-error/25 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-4 h-4 text-error" strokeWidth={1.75} />
                        </div>
                        <h3 className="font-serif text-[16px] font-semibold text-ink mb-1.5">
                            Delete {workspace.name}?
                        </h3>
                        <p className="text-[13px] text-ink-muted leading-relaxed mb-4">
                            Type <span className="font-mono font-semibold text-ink">{workspace.name}</span>{' '}
                            to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteText}
                            onChange={(e) => setDeleteText(e.target.value)}
                            className={inputClass}
                            placeholder={workspace.name}
                            autoFocus
                        />
                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setConfirmDelete(false)
                                    setDeleteText('')
                                }}
                                className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteText.trim() !== workspace.name || deleting}
                                className="h-9 px-3.5 text-[13px] font-medium bg-error text-white hover:bg-error/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? 'Deleting…' : 'Delete workspace'}
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

function Field({
    label,
    hint,
    optional,
    children,
}: {
    label: string
    hint?: string
    optional?: boolean
    children: React.ReactNode
}) {
    return (
        <label className="block">
            <span className="flex items-baseline justify-between mb-1.5">
                <span className="text-[12.5px] font-medium text-ink">{label}</span>
                {optional && (
                    <span className="text-[10.5px] text-ink-subtle uppercase tracking-wide">
                        Optional
                    </span>
                )}
            </span>
            {children}
            {hint && <p className="mt-1 text-[11.5px] text-ink-subtle">{hint}</p>}
        </label>
    )
}

function getTimezones(): string[] {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (Intl as any).supportedValuesOf?.('timeZone') as string[] | undefined
        if (list && list.length) return list
    } catch {}
    return ['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Kolkata']
}

export const Route = createFileRoute('/_auth/settings/workspace')({
    component: WorkspaceGeneralPage,
})
