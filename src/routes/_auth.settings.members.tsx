import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
    Crown,
    Mail,
    Plus,
    Trash2,
    UserPlus,
    AlertTriangle,
    X,
    Check,
    Loader2,
    Users,
    ArrowRightLeft,
    Clock,
} from 'lucide-react'
import { useAuth } from '../store/authContext'
import {
    listMembers,
    inviteMember,
    removeMember,
    changeMemberRole,
    transferOwnership,
    type WorkspaceMember,
} from '../services/workspaceService'

type Role = 'owner' | 'admin' | 'manager'

const ROLE_META: Record<Role, { label: string; description: string; classes: string }> = {
    owner: {
        label: 'Owner',
        description: 'Full control, including billing and ownership transfer',
        classes: 'bg-accent-soft/60 text-accent border-accent/25',
    },
    admin: {
        label: 'Admin',
        description: 'Manage members and templates. No ownership control.',
        classes: 'bg-surface-sunken text-ink border-line',
    },
    manager: {
        label: 'Manager',
        description: 'Edit templates and workspace content',
        classes: 'bg-surface-sunken text-ink-muted border-line',
    },
}

const inputClass =
    'w-full h-10 px-3 bg-surface border border-line rounded-md text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors'
const selectClass =
    inputClass +
    " appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B6560%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_12px_center]"

function MembersPage() {
    const { workspace, user } = useAuth()
    const [members, setMembers] = useState<WorkspaceMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

    const selfMembership = members.find((m) => m.user?.email === user?.email)
    const effectiveRole: Role | null = (selfMembership?.role as Role) ?? null
    const canInvite = effectiveRole === 'owner' || effectiveRole === 'admin'
    const canTransfer = effectiveRole === 'owner'

    const reload = useCallback(async () => {
        if (!workspace) return
        setLoading(true)
        setError(null)
        try {
            const res = await listMembers(workspace._id)
            setMembers(res.data)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load members')
        } finally {
            setLoading(false)
        }
    }, [workspace])

    useEffect(() => {
        reload()
    }, [reload])

    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 3500)
        return () => clearTimeout(t)
    }, [toast])

    if (!workspace) {
        return (
            <div className="text-ink-muted text-[13px]">
                No active workspace.
            </div>
        )
    }

    const activeCount = members.filter((m) => m.status === 'active').length
    const invitedCount = members.filter((m) => m.status === 'invited').length

    return (
        <div>
            <header className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2">
                        {workspace.name}
                    </p>
                    <h1 className="font-serif text-[32px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
                        Members
                    </h1>
                    <p className="text-[14px] text-ink-muted leading-relaxed">
                        People with access to this workspace.{' '}
                        <span className="text-ink font-medium">
                            {activeCount}
                        </span>{' '}
                        active
                        {invitedCount > 0 && (
                            <>
                                {' · '}
                                <span className="text-ink font-medium">{invitedCount}</span> invited
                            </>
                        )}
                        {workspace.maxMembers && workspace.maxMembers !== -1 && (
                            <>
                                {' · '}
                                {workspace.maxMembers} max on {workspace.plan}
                            </>
                        )}
                    </p>
                </div>
                {canInvite && (
                    <button
                        onClick={() => setInviteOpen(true)}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[13.5px] transition-colors flex-shrink-0"
                    >
                        <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                        Invite member
                    </button>
                )}
            </header>

            {error && (
                <div className="mb-5 p-3 rounded-md bg-error/5 border border-error/25 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-error flex-shrink-0" strokeWidth={2} />
                    <p className="text-[13px] text-error">{error}</p>
                    <button
                        onClick={reload}
                        className="ml-auto text-[12px] font-medium text-error hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16 text-ink-muted">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" strokeWidth={1.75} />
                    <span className="text-[13px]">Loading members…</span>
                </div>
            ) : members.length === 0 ? (
                <div className="bg-surface border border-dashed border-line rounded-xl p-10 text-center">
                    <div className="w-12 h-12 rounded-lg bg-surface-sunken border border-line flex items-center justify-center mx-auto mb-4">
                        <Users className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
                    </div>
                    <p className="font-serif text-[16px] font-semibold text-ink mb-1">
                        No members yet
                    </p>
                    <p className="text-[12.5px] text-ink-muted mb-4">
                        Invite a teammate to start collaborating.
                    </p>
                    {canInvite && (
                        <button
                            onClick={() => setInviteOpen(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[13px] transition-colors"
                        >
                            <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                            Invite member
                        </button>
                    )}
                </div>
            ) : (
                <section className="bg-surface border border-line rounded-xl overflow-hidden mb-6">
                    <ul className="divide-y divide-line">
                        {members.map((m) => (
                            <MemberRow
                                key={m._id}
                                member={m}
                                workspaceId={workspace._id}
                                effectiveRole={effectiveRole}
                                onChanged={reload}
                                onToast={setToast}
                            />
                        ))}
                    </ul>
                </section>
            )}

            {canTransfer && members.filter((m) => m.role === 'admin' && m.status === 'active').length > 0 && (
                <TransferOwnershipCard
                    workspaceId={workspace._id}
                    members={members}
                    onDone={reload}
                    onToast={setToast}
                />
            )}

            {inviteOpen && (
                <InviteDialog
                    workspaceId={workspace._id}
                    onClose={() => setInviteOpen(false)}
                    onInvited={() => {
                        reload()
                        setToast({ kind: 'success', message: 'Invite sent.' })
                    }}
                    onError={(m) => setToast({ kind: 'error', message: m })}
                />
            )}

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

// ── Member row ─────────────────────────────────────────────────────

function MemberRow({
    member,
    workspaceId,
    effectiveRole,
    onChanged,
    onToast,
}: {
    member: WorkspaceMember
    workspaceId: string
    effectiveRole: Role | null
    onChanged: () => void | Promise<void>
    onToast: (t: { kind: 'success' | 'error'; message: string }) => void
}) {
    const [pending, setPending] = useState<'role' | 'remove' | null>(null)
    const [confirmRemove, setConfirmRemove] = useState(false)

    const isOwner = member.role === 'owner'
    const canChangeThisRole = effectiveRole === 'owner' && !isOwner
    const canRemoveThis =
        !isOwner &&
        (effectiveRole === 'owner' || (effectiveRole === 'admin' && member.role !== 'admin'))

    async function onRoleChange(newRole: 'admin' | 'manager') {
        setPending('role')
        try {
            await changeMemberRole(workspaceId, member.userId, newRole)
            await onChanged()
            onToast({ kind: 'success', message: 'Role updated.' })
        } catch (e: any) {
            onToast({ kind: 'error', message: e?.message ?? 'Role change failed' })
        } finally {
            setPending(null)
        }
    }

    async function onRemove() {
        setPending('remove')
        setConfirmRemove(false)
        try {
            await removeMember(workspaceId, member.userId)
            await onChanged()
            onToast({ kind: 'success', message: 'Member removed.' })
        } catch (e: any) {
            onToast({ kind: 'error', message: e?.message ?? 'Remove failed' })
        } finally {
            setPending(null)
        }
    }

    const meta = ROLE_META[member.role]

    return (
        <li className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-sunken border border-line text-ink font-serif font-semibold text-[15px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.user?.avatar ? (
                    <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                ) : (
                    (member.user?.name ?? member.user?.email ?? '?').charAt(0).toUpperCase()
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-ink truncate">
                    {member.user?.name ?? (
                        <span className="text-ink-muted italic">Pending invite</span>
                    )}
                </p>
                <p className="text-[12px] text-ink-muted truncate">{member.user?.email ?? '—'}</p>
            </div>

            <span
                className={[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wide border',
                    meta.classes,
                ].join(' ')}
                title={meta.description}
            >
                {isOwner && <Crown className="w-2.5 h-2.5" strokeWidth={2} />}
                {meta.label}
            </span>

            {member.status === 'invited' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wide bg-warning/10 text-warning border border-warning/30">
                    <Clock className="w-2.5 h-2.5" strokeWidth={2} />
                    Invited
                </span>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
                {canChangeThisRole && (
                    <select
                        value={member.role}
                        disabled={pending === 'role'}
                        onChange={(e) => onRoleChange(e.target.value as 'admin' | 'manager')}
                        className={selectClass + ' w-32 text-[12px]'}
                    >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                    </select>
                )}
                {canRemoveThis && (
                    <button
                        onClick={() => setConfirmRemove(true)}
                        disabled={pending === 'remove'}
                        className="w-9 h-9 rounded-md text-ink-muted hover:text-error hover:bg-error/5 transition-colors disabled:opacity-50 flex items-center justify-center"
                        aria-label="Remove member"
                    >
                        {pending === 'remove' ? (
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                        ) : (
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        )}
                    </button>
                )}
            </div>

            {confirmRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl w-full max-w-sm p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                        <div className="w-10 h-10 rounded-md bg-error/10 border border-error/25 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-4 h-4 text-error" strokeWidth={1.75} />
                        </div>
                        <h3 className="font-serif text-[15px] font-semibold text-ink mb-1.5">
                            Remove {member.user?.name ?? 'this member'}?
                        </h3>
                        <p className="text-[13px] text-ink-muted leading-relaxed mb-5">
                            They'll lose access to {'the'} workspace immediately. You can re-invite them later.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setConfirmRemove(false)}
                                className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onRemove}
                                className="h-9 px-3.5 text-[13px] font-medium bg-error text-white hover:bg-error/90 rounded-md transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </li>
    )
}

// ── Invite dialog ──────────────────────────────────────────────────

function InviteDialog({
    workspaceId,
    onClose,
    onInvited,
    onError,
}: {
    workspaceId: string
    onClose: () => void
    onInvited: () => void
    onError: (message: string) => void
}) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'manager'>('manager')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        if (!email.trim()) return
        setSubmitting(true)
        try {
            await inviteMember(workspaceId, email.trim().toLowerCase(), role)
            setDone(true)
            onInvited()
            setTimeout(onClose, 600)
        } catch (e: any) {
            onError(e?.message ?? 'Invite failed')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <div className="bg-surface rounded-xl w-full max-w-md border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-accent-soft/60 border border-accent/25 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-accent" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h2 className="font-serif text-[15px] font-semibold text-ink leading-tight">
                                Invite a member
                            </h2>
                            <p className="text-[11.5px] text-ink-muted">
                                They'll receive a link to accept
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

                <form onSubmit={onSubmit} className="px-5 py-5 space-y-4">
                    <label className="block">
                        <span className="block text-[12.5px] font-medium text-ink mb-1.5">
                            Email address
                        </span>
                        <div className="relative">
                            <Mail
                                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                                strokeWidth={1.75}
                            />
                            <input
                                type="email"
                                required
                                autoFocus
                                disabled={submitting || done}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className={inputClass + ' pl-10'}
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="block text-[12.5px] font-medium text-ink mb-1.5">Role</span>
                        <select
                            disabled={submitting || done}
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}
                            className={selectClass}
                        >
                            <option value="manager">Manager — can edit templates</option>
                            <option value="admin">Admin — can also invite + manage</option>
                        </select>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-1">
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
                            disabled={submitting || done || !email}
                            className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13px] transition-colors disabled:opacity-50"
                        >
                            {done ? (
                                <>
                                    <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
                                    Sent
                                </>
                            ) : submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                                    Send invite
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Transfer ownership card ────────────────────────────────────────

function TransferOwnershipCard({
    workspaceId,
    members,
    onDone,
    onToast,
}: {
    workspaceId: string
    members: WorkspaceMember[]
    onDone: () => void | Promise<void>
    onToast: (t: { kind: 'success' | 'error'; message: string }) => void
}) {
    const admins = members.filter((m) => m.role === 'admin' && m.status === 'active')
    const [selected, setSelected] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    async function onTransfer() {
        if (!selected) return
        setSubmitting(true)
        try {
            await transferOwnership(workspaceId, selected)
            await onDone()
            setSelected('')
            setConfirming(false)
            onToast({ kind: 'success', message: 'Ownership transferred.' })
        } catch (e: any) {
            onToast({ kind: 'error', message: e?.message ?? 'Transfer failed' })
        } finally {
            setSubmitting(false)
        }
    }

    const target = admins.find((m) => m.userId === selected)

    return (
        <section className="border border-warning/25 bg-warning/5 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-md bg-warning/10 border border-warning/30 flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-4 h-4 text-warning" strokeWidth={1.75} />
                </div>
                <div>
                    <h2 className="text-[14px] font-semibold text-ink">Transfer ownership</h2>
                    <p className="text-[12.5px] text-ink-muted mt-0.5">
                        Promote an admin to owner. You'll become an admin and lose owner-only permissions.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className={selectClass + ' flex-1'}
                >
                    <option value="">Choose an admin…</option>
                    {admins.map((m) => (
                        <option key={m.userId} value={m.userId}>
                            {m.user?.name ?? m.user?.email ?? m.userId}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setConfirming(true)}
                    disabled={!selected || submitting}
                    className="h-10 px-3.5 rounded-md bg-warning/10 border border-warning/30 text-warning font-medium text-[13px] hover:bg-warning hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Transfer
                </button>
            </div>

            {confirming && target && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl w-full max-w-sm p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                        <div className="w-10 h-10 rounded-md bg-warning/10 border border-warning/30 flex items-center justify-center mb-4">
                            <ArrowRightLeft className="w-4 h-4 text-warning" strokeWidth={1.75} />
                        </div>
                        <h3 className="font-serif text-[15px] font-semibold text-ink mb-1.5">
                            Transfer ownership to {target.user?.name ?? target.user?.email}?
                        </h3>
                        <p className="text-[13px] text-ink-muted leading-relaxed mb-5">
                            You'll be demoted to admin. This is reversible only by the new owner.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setConfirming(false)}
                                disabled={submitting}
                                className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onTransfer}
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium bg-warning text-white hover:bg-warning/90 rounded-md transition-colors disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Transferring…
                                    </>
                                ) : (
                                    'Confirm transfer'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export const Route = createFileRoute('/_auth/settings/members')({
    component: MembersPage,
})
