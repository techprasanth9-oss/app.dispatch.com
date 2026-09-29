import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import {
  User,
  Building2,
  Settings as SettingsIcon,
  Users,
  Bell,
  Zap,
  KeyRound,
  CreditCard,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'
import AppHeader from '../components/ui/AppHeader'
import { useAuth } from '../store/authContext'

/**
 * /settings — layout route. Renders the shared app header, a personal +
 * workspace-scoped sidebar, and an <Outlet /> for the matching child route.
 * Sits under _auth so unauthenticated users get bounced to sign-in.
 */

interface NavItemProps {
  icon: LucideIcon
  label: string
  to?: string
  badge?: string
  active?: boolean
}

function NavItem({ to, icon: Icon, label, badge, active }: NavItemProps) {
  const disabled = !to
  const content = (
    <>
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-ink-subtle bg-surface-sunken border border-line rounded px-1.5 py-[1px]">
          {badge}
        </span>
      )}
    </>
  )

  if (disabled) {
    return (
      <div className="flex items-center gap-2.5 px-2.5 h-9 text-[13px] font-medium text-ink-subtle cursor-not-allowed opacity-70">
        {content}
      </div>
    )
  }

  return (
    <Link
      to={to as string}
      className={[
        'flex items-center gap-2.5 px-2.5 h-9 rounded-md text-[13px] font-medium transition-colors',
        active
          ? 'bg-surface text-ink border border-line shadow-[0_1px_2px_rgba(20,20,20,0.03)]'
          : 'text-ink-muted hover:text-ink hover:bg-surface-sunken/50 border border-transparent',
      ].join(' ')}
    >
      {content}
    </Link>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em] mb-1.5">
      {children}
    </p>
  )
}

function SettingsLayout() {
  const { workspace } = useAuth()
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <AppHeader />

      <div className="flex-1 flex">
        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 border-r border-line bg-paper/60 px-4 py-8 hidden md:flex flex-col">
          <SectionHeading>Personal</SectionHeading>
          <nav className="flex flex-col gap-0.5 mb-6">
            <NavItem
              to="/settings/profile"
              icon={User}
              label="Profile"
              active={isActive('/settings/profile')}
            />
            <NavItem
              to="/settings/workspaces"
              icon={Building2}
              label="Workspaces"
              active={isActive('/settings/workspaces')}
            />
            <NavItem icon={Bell} label="Preferences" badge="Soon" />
          </nav>

          <SectionHeading>{workspace?.name ?? 'Workspace'}</SectionHeading>
          <nav className="flex flex-col gap-0.5 mb-6">
            <NavItem
              to="/settings/workspace"
              icon={SettingsIcon}
              label="General"
              active={isActive('/settings/workspace')}
            />
            <NavItem
              to="/settings/members"
              icon={Users}
              label="Members"
              active={isActive('/settings/members')}
            />
            <NavItem
              to="/settings/integrations"
              icon={Zap}
              label="Integrations"
              active={isActive('/settings/integrations')}
            />
            <NavItem icon={KeyRound} label="API keys" badge="Soon" />
            <NavItem icon={CreditCard} label="Billing" badge="Soon" />
          </nav>

          <div className="mt-auto pt-4 border-t border-line">
            <Link
              to="/templates"
              className="flex items-center gap-2 px-2.5 h-9 rounded-md text-[12.5px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken/50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Back to templates
            </Link>
          </div>
        </aside>

        {/* ── Main pane ──────────────────────────────────────────── */}
        <main className="flex-1 px-6 lg:px-10 py-8 lg:py-12">
          <div className="max-w-[720px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_auth/settings')({
  component: SettingsLayout,
})
