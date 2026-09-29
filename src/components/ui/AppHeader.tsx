import { useState, useEffect } from 'react'
import { useRouter, useLocation, Link } from '@tanstack/react-router'
import {
  Mail,
  LayoutTemplate,
  Hammer,
  Settings,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useAuth } from '../../store/authContext'

/**
 * App shell top bar — matches the SignIn editorial palette (paper + ink +
 * vermillion, Fraunces wordmark, Inter UI). Sticky, translucent paper
 * background with a subtle scroll shadow.
 */

const NAV_ITEMS = [
  { path: '/templates', label: 'Templates', icon: LayoutTemplate },
  { path: '/builder', label: 'Builder', icon: Hammer },
  { path: '/settings/workspace', label: 'Settings', icon: Settings },
] as const

export default function AppHeader() {
  const router = useRouter()
  const location = useLocation()
  const { user, workspace, workspaces, switchWorkspace, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [wsOpen, setWsOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function onLogout() {
    await logout()
    router.navigate({ to: '/' })
  }

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === '/settings/workspace' && location.pathname.startsWith('/settings'))

  return (
    <header
      className={[
        'sticky top-0 z-40 w-full transition-all duration-300',
        'border-b border-line/70 backdrop-blur-md',
        scrolled
          ? 'bg-paper/95 shadow-[0_1px_2px_rgba(20,20,20,0.04)]'
          : 'bg-paper/85 shadow-none',
      ].join(' ')}
    >
      <div className="w-full px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Left: wordmark + primary nav */}
          <div className="flex items-center gap-8">
            <Link
              to="/templates"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center transition-transform duration-200 group-active:scale-95">
                <Mail className="w-4 h-4 text-paper" strokeWidth={2.25} />
              </div>
              <span className="font-serif text-[19px] font-semibold text-ink tracking-tight leading-none">
                Mailix
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const active = isActive(path)
                return (
                  <button
                    key={path}
                    onClick={() => router.navigate({ to: path })}
                    className={[
                      'flex items-center gap-2 text-[13.5px] font-medium h-9 px-3 rounded-md transition-colors',
                      active
                        ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,20,0.04)] border border-line'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-sunken/60',
                    ].join(' ')}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right: workspace, notifications, avatar, logout */}
          <div className="flex items-center gap-2">
            {workspaces.length > 0 && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setWsOpen(!wsOpen)}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink h-9 px-3 rounded-md bg-surface hover:bg-surface-sunken border border-line transition-colors"
                >
                  <span className="max-w-[160px] truncate">
                    {workspace?.name ?? 'Workspace'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                </button>
                {wsOpen && (
                  <div className="absolute right-0 top-11 bg-surface rounded-lg shadow-[0_8px_32px_-8px_rgba(20,20,20,0.15)] border border-line py-1.5 w-64 z-20">
                    <p className="px-3.5 pt-1.5 pb-2 text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em]">
                      Your workspaces
                    </p>
                    {workspaces.map((ws) => {
                      const activeWs = ws._id === workspace?._id
                      return (
                        <button
                          key={ws._id}
                          onClick={() => {
                            switchWorkspace(ws)
                            setWsOpen(false)
                          }}
                          className={[
                            'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors',
                            activeWs
                              ? 'text-ink bg-accent-soft/40'
                              : 'text-ink-muted hover:text-ink hover:bg-surface-sunken/60',
                          ].join(' ')}
                        >
                          <div className="w-6 h-6 rounded-md bg-surface-sunken border border-line flex items-center justify-center text-ink text-[10.5px] font-semibold flex-shrink-0">
                            {ws.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{ws.name}</span>
                          {activeWs && (
                            <Check className="ml-auto w-3.5 h-3.5 text-accent flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {user && (
              <span className="text-[12px] text-ink-muted hidden lg:block mx-1 truncate max-w-[180px]">
                {user.email}
              </span>
            )}

            <button
              className="relative w-9 h-9 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
              {/* Small vermillion unread dot — pulses subtly */}
              <span className="absolute top-2 right-2 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
            </button>

            <button
              className="w-9 h-9 rounded-md bg-surface border border-line flex items-center justify-center text-ink-muted hover:text-ink transition-colors overflow-hidden"
              aria-label="Profile"
              onClick={() => router.navigate({ to: '/settings/workspace' })}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  className="w-full h-full object-cover"
                  alt={user.name}
                />
              ) : (
                <User className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>

            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-md flex items-center justify-center text-ink-muted hover:text-error hover:bg-error/5 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Click-outside layer for workspace dropdown */}
      {wsOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setWsOpen(false)}
        />
      )}
    </header>
  )
}
