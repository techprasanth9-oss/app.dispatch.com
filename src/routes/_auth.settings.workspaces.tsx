import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  Check,
  Plus,
  ArrowRight,
  Settings as SettingsIcon,
  LogOut,
  Crown,
  Loader2,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react'
import { useAuth } from '../store/authContext'
import {
  createWorkspace,
  removeMember,
  type Workspace,
} from '../services/workspaceService'

/**
 * /settings/workspaces — list every workspace the user belongs to.
 * Active workspace shown first with a vermillion dot. Others get
 * Switch / Leave actions. Owners can't Leave without transferring.
 */

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function WorkspaceLogo({ ws, size = 40 }: { ws: Workspace; size?: number }) {
  const style = { width: size, height: size }
  if (ws.logo) {
    return (
      <div
        style={style}
        className="rounded-lg overflow-hidden border border-line flex-shrink-0"
      >
        <img src={ws.logo} alt={ws.name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      style={style}
      className="rounded-lg bg-surface-sunken border border-line flex items-center justify-center flex-shrink-0 font-serif font-semibold text-ink"
    >
      {initials(ws.name)}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const isOwner = role === 'owner'
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide border',
        isOwner
          ? 'bg-accent-soft/60 text-accent border-accent/25'
          : 'bg-surface-sunken text-ink-muted border-line',
      ].join(' ')}
    >
      {isOwner && <Crown className="w-2.5 h-2.5" strokeWidth={2} />}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

function WorkspacesPage() {
  const router = useRouter()
  const { user, workspace, workspaces, switchWorkspace, bootstrap } = useAuth()

  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [leaveTarget, setLeaveTarget] = useState<Workspace | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const activeWs = useMemo(
    () => workspaces.find((w) => w._id === workspace?._id) ?? null,
    [workspaces, workspace],
  )
  const otherWs = useMemo(
    () => workspaces.filter((w) => w._id !== workspace?._id),
    [workspaces, workspace],
  )

  async function handleSwitch(ws: Workspace) {
    setBusy(ws._id)
    try {
      switchWorkspace(ws)
      await bootstrap()
      setToast({ kind: 'success', message: `Switched to ${ws.name}.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch workspace.'
      setToast({ kind: 'error', message })
    } finally {
      setBusy(null)
    }
  }

  async function handleLeave(ws: Workspace) {
    if (!user) return
    setBusy(ws._id)
    setLeaveTarget(null)
    try {
      await removeMember(ws._id, user._id)
      await bootstrap()
      setToast({ kind: 'success', message: `Left ${ws.name}.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave workspace.'
      setToast({ kind: 'error', message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      {/* Page header */}
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2">
            Personal
          </p>
          <h1 className="font-serif text-[32px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
            Workspaces
          </h1>
          <p className="text-[14px] text-ink-muted leading-relaxed max-w-[440px]">
            Switch between workspaces you belong to, or create a new one.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[13.5px] transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.25} />
          New workspace
        </button>
      </header>

      {/* ── Active workspace ─────────────────────────────────── */}
      {activeWs && (
        <section className="mb-8">
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2 px-1">
            Active
          </p>
          <div className="bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_2px_rgba(20,20,20,0.03)]">
            <div className="flex items-start gap-4">
              <WorkspaceLogo ws={activeWs} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[15px] font-semibold text-ink truncate">
                    {activeWs.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide bg-accent-soft/60 text-accent border border-accent/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[12px] text-ink-muted">
                  <span className="font-mono">{activeWs.slug}</span>
                  <span>·</span>
                  <RoleBadge role={activeWs.role} />
                  {activeWs.plan && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{activeWs.plan} plan</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.navigate({ to: '/settings/workspace' })}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-line bg-surface hover:border-line-strong text-ink font-medium text-[13px] transition-colors flex-shrink-0"
              >
                <SettingsIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                Manage
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Other workspaces ─────────────────────────────────── */}
      {otherWs.length > 0 && (
        <section className="mb-8">
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2 px-1">
            Other workspaces
          </p>
          <div className="flex flex-col gap-3">
            {otherWs.map((ws) => {
              const canLeave = ws.role !== 'owner'
              const isBusy = busy === ws._id
              return (
                <div
                  key={ws._id}
                  className="bg-surface border border-line rounded-xl p-5 hover:border-line-strong transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <WorkspaceLogo ws={ws} size={44} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14.5px] font-semibold text-ink truncate mb-1">
                        {ws.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-[12px] text-ink-muted">
                        <span className="font-mono">{ws.slug}</span>
                        <span>·</span>
                        <RoleBadge role={ws.role} />
                        {ws.plan && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{ws.plan} plan</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canLeave ? (
                        <button
                          onClick={() => setLeaveTarget(ws)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-ink-muted hover:text-error hover:bg-error/5 font-medium text-[13px] transition-colors disabled:opacity-50"
                        >
                          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                          Leave
                        </button>
                      ) : (
                        <span
                          className="text-[11.5px] text-ink-subtle cursor-not-allowed"
                          title="Transfer ownership before leaving"
                        >
                          Owner — transfer first
                        </span>
                      )}
                      <button
                        onClick={() => handleSwitch(ws)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-ink text-paper hover:bg-ink/90 font-medium text-[13px] transition-colors disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            Switch to
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Empty other-workspaces state ─────────────────────── */}
      {otherWs.length === 0 && activeWs && (
        <section className="mb-8">
          <div className="border border-dashed border-line rounded-xl p-8 text-center">
            <div className="w-11 h-11 rounded-lg bg-surface border border-line flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
            </div>
            <p className="text-[13.5px] font-medium text-ink mb-1">
              This is your only workspace.
            </p>
            <p className="text-[12.5px] text-ink-muted mb-4">
              Create another workspace to separate clients, products, or teams.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-line hover:border-line-strong text-ink font-medium text-[13px] transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Create a new workspace
            </button>
          </div>
        </section>
      )}

      {/* Modals & toast */}
      {createOpen && (
        <CreateWorkspaceDialog
          onClose={() => setCreateOpen(false)}
          onCreated={async (ws) => {
            setCreateOpen(false)
            await bootstrap()
            switchWorkspace(ws)
            setToast({ kind: 'success', message: `Created ${ws.name}.` })
          }}
          onError={(msg) => setToast({ kind: 'error', message: msg })}
        />
      )}

      {leaveTarget && (
        <ConfirmDialog
          title="Leave workspace?"
          message={`You'll lose access to ${leaveTarget.name} and everything in it. Someone with the right role would have to re-invite you.`}
          confirmLabel="Leave workspace"
          onConfirm={() => handleLeave(leaveTarget)}
          onCancel={() => setLeaveTarget(null)}
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

// ── CreateWorkspaceDialog ────────────────────────────────────────

function CreateWorkspaceDialog({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void
  onCreated: (ws: Workspace) => void
  onError: (msg: string) => void
}) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy || name.trim().length < 2) return
    setBusy(true)
    try {
      const res = await createWorkspace(name.trim())
      onCreated(res.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace.'
      onError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl w-full max-w-sm border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-[14px] font-semibold text-ink">Create workspace</h3>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <label className="block mb-4">
            <span className="block text-[12.5px] font-medium text-ink mb-1.5">
              Workspace name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              autoFocus
              className="w-full h-10 px-3 bg-surface border border-line rounded-md text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-colors"
            />
            <p className="mt-1 text-[11.5px] text-ink-subtle">
              You can rename it later.
            </p>
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || name.trim().length < 2}
              className={[
                'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md font-medium text-[13px] transition-colors',
                busy || name.trim().length < 2
                  ? 'bg-surface-sunken text-ink-subtle cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-hover text-white',
              ].join(' ')}
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create workspace'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ConfirmDialog ───────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl w-full max-w-sm p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
        <div className="w-10 h-10 rounded-md bg-error/10 border border-error/25 flex items-center justify-center mb-4">
          <AlertTriangle className="w-4 h-4 text-error" strokeWidth={1.75} />
        </div>
        <h3 className="text-[15px] font-semibold text-ink mb-1.5">{title}</h3>
        <p className="text-[13px] text-ink-muted leading-relaxed mb-5">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 px-3 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-3.5 text-[13px] font-medium bg-error text-white hover:bg-error/90 rounded-md transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_auth/settings/workspaces')({
  component: WorkspacesPage,
})
