import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  Lock,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  X,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '../store/authContext'
import { updateMe, logout as logoutCall } from '../services/authService'

/**
 * /settings/profile — personal profile: avatar, name, phone, job title, timezone.
 * Email is intentionally read-only (identity anchor).
 */

const MAX_AVATAR_BYTES = 200 * 1024 // 200 KB

// IANA timezone list. Intl.supportedValuesOf is available in modern Node/browsers;
// fall back to a small hand-picked list otherwise so the dropdown still renders.
function getTimezones(): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (Intl as any).supportedValuesOf?.('timeZone') as string[] | undefined
    if (list && list.length) return list
  } catch {
    // ignored
  }
  return [
    'UTC',
    'America/Los_Angeles',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ]
}

interface FormState {
  name: string
  phone: string
  jobTitle: string
  timezone: string
  avatar: string | null
}

function ProfilePage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()

  const timezones = useMemo(() => getTimezones(), [])
  const browserTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    jobTitle: '',
    timezone: '',
    avatar: null,
  })
  const [initial, setInitial] = useState<FormState>(form)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [signOutBusy, setSignOutBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Hydrate from useAuth() once available
  useEffect(() => {
    if (!user) return
    const next: FormState = {
      name: user.name ?? '',
      phone: user.phone ?? '',
      jobTitle: user.jobTitle ?? '',
      timezone: user.timezone ?? '',
      avatar: user.avatar ?? null,
    }
    setForm(next)
    setInitial(next)
  }, [user])

  const dirty = useMemo(() => {
    return (
      form.name !== initial.name ||
      form.phone !== initial.phone ||
      form.jobTitle !== initial.jobTitle ||
      form.timezone !== initial.timezone ||
      form.avatar !== initial.avatar
    )
  }, [form, initial])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function handleFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setToast({ kind: 'error', message: 'Choose an image file (PNG, JPG, GIF, WEBP).' })
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setToast({
        kind: 'error',
        message: `Image is too large (${(file.size / 1024).toFixed(0)} KB). Max 200 KB.`,
      })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar: String(reader.result ?? '') }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await updateMe({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        jobTitle: form.jobTitle.trim() || null,
        timezone: form.timezone || null,
        avatar: form.avatar,
      })
      await refreshUser()
      setInitial(form)
      setToast({ kind: 'success', message: 'Profile updated.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.'
      setToast({ kind: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOutAll() {
    if (signOutBusy) return
    if (!confirm('Sign out of all sessions on all devices?')) return
    setSignOutBusy(true)
    try {
      await logoutCall()
      router.navigate({ to: '/' })
    } catch {
      setToast({ kind: 'error', message: 'Sign out failed.' })
    } finally {
      setSignOutBusy(false)
    }
  }

  const initials = (user?.name ?? user?.email ?? '?')
    .split(' ')
    .map((s) => s.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div>
      {/* Page header */}
      <header className="mb-8">
        <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-2">
          Personal
        </p>
        <h1 className="font-serif text-[32px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
          Profile
        </h1>
        <p className="text-[14px] text-ink-muted leading-relaxed">
          Update your name, avatar, and time zone.
        </p>
      </header>

      {/* ── Avatar ─────────────────────────────────────────────── */}
      <section className="bg-surface border border-line rounded-xl p-6 mb-6">
        <h2 className="text-[13.5px] font-semibold text-ink mb-4">Your photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-sunken border border-line flex items-center justify-center flex-shrink-0">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-serif text-[22px] font-semibold text-ink-muted">
                {initials || <UserIcon className="w-7 h-7" />}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(e) => handleFile(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-line text-ink font-medium text-[13px] hover:border-line-strong transition-colors"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                Upload photo
              </button>
              {form.avatar && (
                <button
                  onClick={() => setForm((f) => ({ ...f, avatar: null }))}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-ink-muted hover:text-error hover:bg-error/5 font-medium text-[13px] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11.5px] text-ink-subtle">
              PNG, JPG, GIF, or WEBP. Max 200 KB.
            </p>
          </div>
        </div>
      </section>

      {/* ── Details ───────────────────────────────────────────── */}
      <section className="bg-surface border border-line rounded-xl p-6 mb-6">
        <h2 className="text-[13.5px] font-semibold text-ink mb-5">Personal details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <Field label="Full name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              autoComplete="name"
            />
          </Field>

          <Field
            label="Email"
            hint="Contact support to change your email address."
          >
            <div className="relative">
              <input
                type="email"
                value={user?.email ?? ''}
                readOnly
                className="input pr-9 bg-surface-sunken cursor-not-allowed text-ink-muted"
              />
              <Lock className="w-3.5 h-3.5 text-ink-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            </div>
          </Field>

          <Field label="Phone" hint="Optional.">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 123 4567"
              className="input"
              autoComplete="tel"
            />
          </Field>

          <Field label="Job title" hint="Optional. Shown on member lists.">
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="e.g. Founder"
              className="input"
              autoComplete="organization-title"
            />
          </Field>

          <Field
            label="Time zone"
            hint={
              !form.timezone && browserTz
                ? `Auto-detected: ${browserTz}. Click to set.`
                : undefined
            }
          >
            <select
              value={form.timezone || ''}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="input pr-9"
            >
              <option value="">— Not set —</option>
              {browserTz && !timezones.includes(browserTz) && (
                <option value={browserTz}>{browserTz} (browser)</option>
              )}
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between pt-5 border-t border-line">
          <p className="text-[12px] text-ink-subtle">
            {dirty ? 'You have unsaved changes.' : 'Nothing to save.'}
          </p>
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
        </div>
      </section>

      {/* ── Danger zone ───────────────────────────────────────── */}
      <section className="border border-error/25 bg-error/5 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-8 h-8 rounded-md bg-error/10 border border-error/25 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-error" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Danger zone</h2>
            <p className="text-[12.5px] text-ink-muted mt-0.5">
              These actions affect your account. Handle with care.
            </p>
          </div>
        </div>

        <DangerRow
          title="Sign out of all sessions"
          body="Revokes refresh tokens across every device signed in as you."
          action={
            <button
              onClick={handleSignOutAll}
              disabled={signOutBusy}
              className="h-9 px-3 rounded-md border border-line bg-surface hover:border-line-strong text-ink font-medium text-[13px] transition-colors disabled:opacity-50"
            >
              {signOutBusy ? 'Signing out…' : 'Sign out all'}
            </button>
          }
        />
        <DangerRow
          title="Delete account"
          body="Permanently removes your account. Contact support to proceed."
          action={
            <button
              disabled
              title="Contact support to delete your account"
              className="h-9 px-3 rounded-md bg-error/10 border border-error/25 text-error font-medium text-[13px] cursor-not-allowed opacity-70"
            >
              Delete account
            </button>
          }
        />
      </section>

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

      {/* Local input styles — kept scoped to this page */}
      <style>{`
        .input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          background: rgb(var(--color-surface));
          border: 1px solid rgb(var(--color-line));
          border-radius: 6px;
          font-size: 13.5px;
          color: rgb(var(--color-ink));
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .input::placeholder { color: rgb(var(--color-ink-subtle)); }
        .input:hover { border-color: rgb(var(--color-line-strong)); }
        .input:focus {
          outline: none;
          border-color: rgb(var(--color-accent));
          box-shadow: 0 0 0 2px rgb(var(--color-accent) / 0.15);
        }
        select.input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6560' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-ink mb-1.5">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-ink-subtle">{hint}</p>}
    </label>
  )
}

function DangerRow({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-error/15 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="text-[12px] text-ink-muted leading-relaxed">{body}</p>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  )
}

export const Route = createFileRoute('/_auth/settings/profile')({
  component: ProfilePage,
})
