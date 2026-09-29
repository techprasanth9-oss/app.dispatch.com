import { Link } from '@tanstack/react-router'
import { Mail, ArrowLeft, ArrowRight, Compass } from 'lucide-react'
import { useAuth } from '../../store/authContext'

/**
 * Editorial 404 page — matches the SignIn palette (paper + ink + vermillion,
 * Fraunces headline). Wired at the root route via `notFoundComponent` in
 * src/routes/__root.tsx so it catches every unmatched path.
 *
 * CTA is auth-aware: authenticated users get sent back to /templates,
 * everyone else to the sign-in card.
 */

const Wordmark = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center">
      <Mail className="w-3.5 h-3.5 text-paper" strokeWidth={2.25} />
    </div>
    <span className="font-serif text-[20px] font-semibold text-ink tracking-tight leading-none">
      Mailix
    </span>
  </div>
)

export default function NotFound() {
  const { isAuthenticated, isLoading } = useAuth()

  // Wait for auth to settle before we decide which CTA to render — otherwise
  // an authenticated user briefly sees the "Back to sign in" version.
  if (isLoading) {
    return <div className="min-h-screen bg-paper" />
  }

  return (
    <div className="paper-grain canvas-grid min-h-screen bg-paper flex flex-col relative overflow-hidden">
      {/* Faint radial spotlight behind the message — same trick as SignIn */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 720px 520px at 50% 50%, rgb(var(--color-surface) / 0.55) 0%, transparent 65%)',
          zIndex: 0,
        }}
      />

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
        {isAuthenticated ? (
          <Link to="/templates" className="focus:outline-none">
            <Wordmark />
          </Link>
        ) : (
          <Link to="/" className="focus:outline-none">
            <Wordmark />
          </Link>
        )}
        <a
          href="mailto:hello@mailix.io"
          className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Contact support
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* ── Centered message ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-[520px] text-center">
          {/* Editorial eyebrow */}
          <div className="inline-flex items-center gap-2 text-[11.5px] text-ink-muted uppercase tracking-[0.16em] mb-6">
            <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Error 404 · Page not found</span>
          </div>

          <h1 className="font-serif text-[44px] sm:text-[56px] font-semibold text-ink tracking-tight leading-[1.05] mb-5">
            This page took<br />a wrong turn.
          </h1>

          <p className="text-[15px] text-ink-muted leading-relaxed mb-9 max-w-[420px] mx-auto">
            The address you tried doesn't lead anywhere in Mailix. It may have
            moved, or it might never have existed. Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {isAuthenticated ? (
              <Link
                to="/templates"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[14px] transition-colors w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to templates
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[14px] transition-colors w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            )}
            <a
              href="mailto:hello@mailix.io"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-surface hover:bg-surface-sunken border border-line text-ink font-medium text-[14px] transition-colors w-full sm:w-auto"
            >
              Contact support
            </a>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between text-[11.5px] text-ink-subtle">
        <span>© {new Date().getFullYear()} Mailix</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-ink transition-colors">Docs</a>
          <a href="#" className="hover:text-ink transition-colors">Status</a>
          <a href="mailto:hello@mailix.io" className="hover:text-ink transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  )
}
