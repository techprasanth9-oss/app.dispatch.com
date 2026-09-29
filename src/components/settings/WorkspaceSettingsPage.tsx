import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Crown, Mail, Plus, Trash2, UserPlus, AlertTriangle, X, Check } from 'lucide-react'
import { useAuth } from '../../store/authContext'
import {
  listMembers,
  inviteMember,
  removeMember,
  changeMemberRole,
  transferOwnership,
  type WorkspaceMember,
} from '../../services/workspaceService'

type Role = 'owner' | 'admin' | 'manager'

const ROLE_BADGES: Record<Role, { label: string; classes: string }> = {
  owner:   { label: 'Owner',   classes: 'bg-amber-50 text-amber-800 border border-amber-200' },
  admin:   { label: 'Admin',   classes: 'bg-brand-50 text-brand-700 border border-brand-200' },
  manager: { label: 'Manager', classes: 'bg-surface-100 text-surface-700 border border-surface-200' },
}

export default function WorkspaceSettingsPage() {
  const { workspace, user } = useAuth()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const selfMembership = members.find((m) => m.user?.email === user?.email)
  const effectiveRole: Role | null = (selfMembership?.role as Role) ?? null

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

  if (!workspace) {
    return <p className="text-ink-muted">No active workspace.</p>
  }

  const canInvite = effectiveRole === 'owner' || effectiveRole === 'admin'
  const canTransfer = effectiveRole === 'owner'

  return (
    <>
      <main className="space-y-8">
        <header>
          <p className="text-xs font-semibold tracking-wider text-surface-400 uppercase">Workspace settings</p>
          <h1 className="mt-1 text-2xl font-semibold text-surface-900">{workspace.name}</h1>
          <p className="mt-1 text-sm text-surface-500">
            Plan: <span className="font-medium text-surface-700 capitalize">{workspace.plan}</span> ·
            {' '}
            <span className="font-medium text-surface-700">{members.filter((m) => m.status === 'active').length}</span> active /
            {' '}
            <span className="font-medium text-surface-700">{workspace.maxMembers === -1 ? 'unlimited' : workspace.maxMembers}</span> max
          </p>
        </header>

        <section className="bg-white rounded-2xl border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
            <div>
              <h2 className="text-base font-semibold text-surface-900">Members</h2>
              <p className="text-xs text-surface-500 mt-0.5">People with access to this workspace</p>
            </div>
            {canInvite && (
              <button
                onClick={() => setInviteOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Invite member
              </button>
            )}
          </div>

          {error && (
            <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 text-sm text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {loading ? (
            <p className="px-6 py-8 text-sm text-surface-500">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-surface-500">No members yet.</p>
          ) : (
            <ul className="divide-y divide-surface-100">
              {members.map((m) => (
                <MemberRow
                  key={m._id}
                  member={m}
                  workspaceId={workspace._id}
                  effectiveRole={effectiveRole}
                  onChanged={reload}
                />
              ))}
            </ul>
          )}
        </section>

        {canTransfer && (
          <TransferOwnershipCard workspaceId={workspace._id} members={members} onTransferred={reload} />
        )}
      </main>

      {inviteOpen && (
        <InviteDialog
          workspaceId={workspace._id}
          onClose={() => setInviteOpen(false)}
          onInvited={reload}
        />
      )}
    </>
  )
}

// ── MemberRow ──────────────────────────────────────────────────────────────

function MemberRow({
  member,
  workspaceId,
  effectiveRole,
  onChanged,
}: {
  member: WorkspaceMember
  workspaceId: string
  effectiveRole: Role | null
  onChanged: () => void | Promise<void>
}) {
  const [pending, setPending] = useState<'role' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isOwner = member.role === 'owner'
  const canChangeThisRole = effectiveRole === 'owner' && !isOwner
  const canRemoveThis =
    !isOwner &&
    (effectiveRole === 'owner' || (effectiveRole === 'admin' && member.role !== 'admin'))

  async function onRoleChange(newRole: 'admin' | 'manager') {
    setPending('role')
    setError(null)
    try {
      await changeMemberRole(workspaceId, member.userId, newRole)
      await onChanged()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to change role')
    } finally {
      setPending(null)
    }
  }

  async function onRemove() {
    if (!confirm(`Remove ${member.user?.email ?? 'this member'} from the workspace?`)) return
    setPending('remove')
    setError(null)
    try {
      await removeMember(workspaceId, member.userId)
      await onChanged()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove member')
    } finally {
      setPending(null)
    }
  }

  return (
    <li className="px-6 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 font-semibold flex items-center justify-center flex-shrink-0">
        {(member.user?.name ?? member.user?.email ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-900 truncate">
          {member.user?.name ?? <span className="text-surface-400 italic">Pending invite</span>}
        </p>
        <p className="text-xs text-surface-500 truncate">{member.user?.email ?? '—'}</p>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      </div>

      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${ROLE_BADGES[member.role].classes}`}>
        {member.role === 'owner' && <Crown className="w-3 h-3" />}
        {ROLE_BADGES[member.role].label}
      </span>

      {member.status === 'invited' && (
        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md font-medium">
          Invited
        </span>
      )}

      <div className="flex items-center gap-1">
        {canChangeThisRole && (
          <select
            value={member.role}
            disabled={pending === 'role'}
            onChange={(e) => onRoleChange(e.target.value as 'admin' | 'manager')}
            className="text-xs border border-surface-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
        )}
        {canRemoveThis && (
          <button
            onClick={onRemove}
            disabled={pending === 'remove'}
            className="w-8 h-8 rounded-md text-surface-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Remove member"
          >
            <Trash2 className="w-4 h-4 mx-auto" />
          </button>
        )}
      </div>
    </li>
  )
}

// ── InviteDialog ───────────────────────────────────────────────────────────

function InviteDialog({
  workspaceId,
  onClose,
  onInvited,
}: {
  workspaceId: string
  onClose: () => void
  onInvited: () => void | Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'manager'>('manager')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await inviteMember(workspaceId, email.trim().toLowerCase(), role)
      setDone(true)
      await onInvited()
      setTimeout(onClose, 600)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to invite')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold text-surface-900">Invite a member</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-700 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-surface-700">Email address</span>
            <div className="mt-1.5 relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="email"
                required
                autoFocus
                disabled={submitting || done}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-surface-700">Role</span>
            <select
              disabled={submitting || done}
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            >
              <option value="manager">Manager — can edit templates</option>
              <option value="admin">Admin — full access except billing</option>
            </select>
          </label>
          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting || done || !email}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {done ? (
              <>
                <Check className="w-4 h-4" /> Invite sent
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> {submitting ? 'Sending…' : 'Send invite'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── TransferOwnershipCard ──────────────────────────────────────────────────

function TransferOwnershipCard({
  workspaceId,
  members,
  onTransferred,
}: {
  workspaceId: string
  members: WorkspaceMember[]
  onTransferred: () => void | Promise<void>
}) {
  const admins = members.filter((m) => m.role === 'admin' && m.status === 'active')
  const [selected, setSelected] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onTransfer() {
    if (!selected) return
    const target = admins.find((m) => m.userId === selected)
    if (!confirm(`Transfer ownership to ${target?.user?.email ?? 'this admin'}? You will become an admin.`)) return
    setSubmitting(true)
    setError(null)
    try {
      await transferOwnership(workspaceId, selected)
      await onTransferred()
      setSelected('')
    } catch (e: any) {
      setError(e?.message ?? 'Transfer failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-amber-200 shadow-sm">
      <div className="px-6 py-5 border-b border-amber-100 bg-amber-50/50">
        <h2 className="text-base font-semibold text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Transfer ownership
        </h2>
        <p className="text-xs text-amber-800 mt-1">
          Promote an admin to owner. You become an admin in the process and lose owner-only permissions.
        </p>
      </div>
      <div className="px-6 py-5 space-y-3">
        {admins.length === 0 ? (
          <p className="text-sm text-surface-500">There are no admins yet. Promote a member to admin first.</p>
        ) : (
          <>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            >
              <option value="">Choose an admin…</option>
              {admins.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name ?? m.user?.email ?? m.userId}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              onClick={onTransfer}
              disabled={!selected || submitting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Transferring…' : 'Transfer ownership'}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
