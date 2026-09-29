import { useState, useEffect, useCallback } from 'react'
import AppHeader from '../ui/AppHeader'
import TemplateCard from './TemplateCard'
import { useRouter } from '@tanstack/react-router'
import {
  Search,
  Plus,
  FolderOpen,
  Loader2,
  RefreshCw,
  Globe,
  LayoutTemplate,
  Trash2,
  Copy,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react'
import {
  listTemplates,
  listGallery,
  deleteTemplate,
  duplicateTemplate,
  copyFromGallery,
  type Template,
} from '../../services/templateService'
import { listCategories, type Category } from '../../services/categoryService'
import { useAuth } from '../../store/authContext'

// ── Toast + Confirm ─────────────────────────────────────────────────────

type ToastState = { message: string; type: 'success' | 'error' } | null

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (toast) {
      const t = setTimeout(onClose, 3500)
      return () => clearTimeout(t)
    }
  }, [toast, onClose])
  if (!toast) return null
  const success = toast.type === 'success'
  return (
    <div
      className={[
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg text-[13px] font-medium border shadow-[0_8px_24px_-8px_rgba(20,20,20,0.25)]',
        success
          ? 'bg-ink text-paper border-ink'
          : 'bg-error/95 text-white border-error',
      ].join(' ')}
    >
      {success ? (
        <Check className="w-4 h-4" strokeWidth={2.25} />
      ) : (
        <AlertTriangle className="w-4 h-4" strokeWidth={2} />
      )}
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl w-full max-w-sm p-6 border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
        <div className="w-10 h-10 rounded-md bg-error/10 border border-error/25 flex items-center justify-center mb-4">
          <Trash2 className="w-4 h-4 text-error" strokeWidth={1.75} />
        </div>
        <p className="text-[13.5px] text-ink mb-5 leading-relaxed">{message}</p>
        <div className="flex items-center gap-2 justify-end">
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
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────

type Tab = 'my' | 'gallery'

export default function TemplatesPage() {
  const router = useRouter()
  const { isAuthenticated, workspaceId } = useAuth()

  const [tab, setTab] = useState<Tab>('my')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'draft' | 'published'>('all')

  const [templates, setTemplates] = useState<Template[]>([])
  const [gallery, setGallery] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [toast, setToast] = useState<ToastState>(null)
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.navigate({ to: '/' })
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!workspaceId) return
    listCategories()
      .then((r) => setCategories(r.data))
      .catch(() => {})
  }, [workspaceId])

  const loadTemplates = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    setError(null)
    try {
      const filters: Record<string, any> = { page, limit: 20 }
      if (query) filters.search = query
      if (statusFilter !== 'all') filters.status = statusFilter
      if (categoryFilter !== 'All') {
        const cat = categories.find((c) => c.name === categoryFilter)
        if (cat) filters.category = cat._id
      }
      const res = await listTemplates(filters)
      setTemplates(res.data)
      setTotalPages(res.meta?.totalPages ?? 1)
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, page, query, statusFilter, categoryFilter, categories])

  const loadGallery = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await listGallery(
        categoryFilter !== 'All' ? categoryFilter : undefined,
      )
      setGallery(res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load gallery')
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => {
    if (tab === 'my') loadTemplates()
  }, [tab, loadTemplates])
  useEffect(() => {
    if (tab === 'gallery') loadGallery()
  }, [tab, loadGallery])

  // Debounce search: reset page when query changes
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350)
    return () => clearTimeout(t)
  }, [query])

  function openTemplate(tpl: Template) {
    try {
      // sessionStorage (per-tab) — the builder reads-and-clears immediately on mount
      sessionStorage.setItem(
        'selectedTemplate',
        JSON.stringify(
          tpl.editorData ?? { time: Date.now(), blocks: [], version: '2.30.8' },
        ),
      )
      sessionStorage.setItem('editingTemplateId', tpl._id)
      sessionStorage.setItem('editingTemplateName', tpl.name)
    } catch {}
    router.navigate({ to: '/builder' })
  }

  async function handleDuplicate(tpl: Template) {
    setActionLoading(tpl._id)
    setOpenMenu(null)
    try {
      await duplicateTemplate(tpl._id)
      setToast({ message: `"${tpl.name}" duplicated`, type: 'success' })
      loadTemplates()
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to duplicate', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(tpl: Template) {
    setActionLoading(tpl._id)
    setDeleteTarget(null)
    setOpenMenu(null)
    try {
      await deleteTemplate(tpl._id)
      setToast({ message: `"${tpl.name}" deleted`, type: 'success' })
      setTemplates((prev) => prev.filter((t) => t._id !== tpl._id))
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCopyFromGallery(tpl: Template) {
    setActionLoading(tpl._id)
    try {
      await copyFromGallery(tpl._id)
      setToast({
        message: `"${tpl.name}" added to your workspace`,
        type: 'success',
      })
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to copy template',
        type: 'error',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const displayItems =
    tab === 'gallery'
      ? gallery.filter(
          (t) => !query || t.name.toLowerCase().includes(query.toLowerCase()),
        )
      : templates

  const categoryNames = ['All', ...categories.map((c) => c.name)]

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />

      <main className="w-full px-6 lg:px-10 py-10 lg:py-14 max-w-[1400px] mx-auto">
        {/* ── Page header ────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-9">
          <div>
            <p className="text-[11.5px] text-ink-muted uppercase tracking-[0.16em] mb-3">
              Email templates
            </p>
            <h1 className="font-serif text-[34px] lg:text-[42px] font-semibold text-ink tracking-tight leading-[1.05] mb-2.5">
              Your templates
            </h1>
            <p className="text-[14.5px] text-ink-muted leading-relaxed max-w-[440px]">
              Design, manage, and export — all your outbound email templates in one workspace.
            </p>
          </div>

          <button
            onClick={() => {
              sessionStorage.removeItem('editingTemplateId')
              sessionStorage.removeItem('editingTemplateName')
              sessionStorage.removeItem('selectedTemplate')
              router.navigate({ to: '/builder' })
            }}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[14px] transition-colors self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            New template
          </button>
        </div>

        {/* ── Tab switcher ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:inline-grid sm:grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-surface-sunken/60 border border-line w-full sm:w-auto">
          <button
            onClick={() => {
              setTab('my')
              setPage(1)
            }}
            className={[
              'flex items-center justify-center gap-2 h-9 px-4 rounded-md text-[13px] font-medium transition-colors',
              tab === 'my'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            <LayoutTemplate className="w-4 h-4" strokeWidth={1.75} />
            My templates
          </button>
          <button
            onClick={() => {
              setTab('gallery')
              setCategoryFilter('All')
            }}
            className={[
              'flex items-center justify-center gap-2 h-9 px-4 rounded-md text-[13px] font-medium transition-colors',
              tab === 'gallery'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            <Globe className="w-4 h-4" strokeWidth={1.75} />
            Gallery
          </button>
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
              <Search className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="w-full h-10 pl-9 pr-9 bg-surface border border-line rounded-md text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-sunken hover:bg-line flex items-center justify-center text-ink-muted transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {tab === 'my' && (
            <div className="flex items-center gap-1.5">
              {(['all', 'draft', 'published'] as const).map((s) => {
                const active = statusFilter === s
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s)
                      setPage(1)
                    }}
                    className={[
                      'h-9 px-3.5 rounded-md text-[13px] font-medium border transition-colors',
                      active
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-surface text-ink-muted border-line hover:text-ink hover:border-line-strong',
                    ].join(' ')}
                  >
                    {s === 'all'
                      ? 'All'
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              })}
            </div>
          )}

          {tab === 'gallery' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {categoryNames.map((c) => {
                const active = categoryFilter === c
                return (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={[
                      'h-9 px-3.5 rounded-md text-[13px] font-medium border transition-colors',
                      active
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-surface text-ink-muted border-line hover:text-ink hover:border-line-strong',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={() => (tab === 'my' ? loadTemplates() : loadGallery())}
            className="h-9 w-9 flex items-center justify-center bg-surface border border-line rounded-md text-ink-muted hover:text-ink hover:border-line-strong transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* ── Error banner ───────────────────────────────────────── */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-md bg-error/5 border border-error/25 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" strokeWidth={2} />
            <span className="text-[13px] text-error">{error}</span>
            <button
              onClick={() => (tab === 'my' ? loadTemplates() : loadGallery())}
              className="ml-auto text-[12px] font-medium text-error hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Count line ─────────────────────────────────────────── */}
        {!isLoading && !error && (
          <p className="text-[12.5px] text-ink-muted mb-5">
            Showing{' '}
            <span className="font-semibold text-ink">
              {displayItems.length}
            </span>{' '}
            template{displayItems.length !== 1 ? 's' : ''}
            {tab === 'my' && totalPages > 1 && (
              <span className="ml-1">
                (page {page} of {totalPages})
              </span>
            )}
          </p>
        )}

        {/* ── Grid / empty / loading ─────────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-line rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-surface-sunken" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-surface-sunken rounded w-3/4" />
                  <div className="h-3 bg-surface-sunken rounded w-1/2" />
                  <div className="h-8 bg-surface-sunken rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && displayItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-xl bg-surface border border-line flex items-center justify-center mb-5">
              <FolderOpen className="w-6 h-6 text-ink-muted" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-[22px] font-semibold text-ink mb-1.5">
              {tab === 'my' ? 'No templates yet' : 'No gallery templates'}
            </h3>
            <p className="text-[13.5px] text-ink-muted text-center max-w-sm mb-6 leading-relaxed">
              {tab === 'my'
                ? query
                  ? `No templates match "${query}".`
                  : 'Create your first template to get started.'
                : query
                  ? `No results for "${query}".`
                  : 'Gallery is empty.'}
            </p>
            {tab === 'my' && (
              <button
                onClick={() => router.navigate({ to: '/builder' })}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-accent hover:bg-accent-hover text-white font-medium text-[13.5px] transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={2.25} />
                Create template
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && displayItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayItems.map((tpl) => (
              <div key={tpl._id}>
                {tab === 'gallery' ? (
                  <TemplateCard
                    template={{
                      id: tpl._id,
                      title: tpl.name,
                      description: tpl.description || '',
                      category: 'Gallery',
                      data: tpl.editorData,
                    }}
                    onOpen={() => handleCopyFromGallery(tpl)}
                    actionLabel={
                      actionLoading === tpl._id ? 'Copying…' : 'Use template'
                    }
                  />
                ) : (
                  <div className="group relative bg-surface border border-line rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,20,20,0.03)] hover:shadow-[0_8px_24px_-8px_rgba(20,20,20,0.12)] hover:border-line-strong transition-all duration-200">
                    {/* Status badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={[
                          'inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide rounded border',
                          tpl.status === 'published'
                            ? 'bg-success/10 text-success border-success/25'
                            : 'bg-surface-sunken text-ink-muted border-line',
                        ].join(' ')}
                      >
                        {tpl.status}
                      </span>
                    </div>

                    {/* Action menu */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(openMenu === tpl._id ? null : tpl._id)
                        }}
                        className="w-7 h-7 rounded-md bg-surface/95 hover:bg-surface border border-line flex items-center justify-center text-ink-muted hover:text-ink transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {actionLoading === tpl._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                      </button>
                      {openMenu === tpl._id && (
                        <div className="absolute right-0 top-8 bg-surface rounded-lg shadow-[0_8px_32px_-8px_rgba(20,20,20,0.15)] border border-line py-1 w-44 z-20">
                          <button
                            onClick={() => handleDuplicate(tpl)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink hover:bg-surface-sunken/60 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(tpl)
                              setOpenMenu(null)
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-error hover:bg-error/5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <div
                      className="h-44 bg-surface-sunken overflow-hidden relative cursor-pointer"
                      onClick={() => openTemplate(tpl)}
                    >
                      {tpl.compiledHtml ? (
                        <iframe
                          srcDoc={tpl.compiledHtml}
                          className="w-full h-full border-0 pointer-events-none"
                          style={{
                            transform: 'scale(0.6)',
                            transformOrigin: 'top left',
                            width: '167%',
                            height: '167%',
                          }}
                          title={tpl.name}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <LayoutTemplate
                            className="w-10 h-10 text-line-strong"
                            strokeWidth={1.5}
                          />
                        </div>
                      )}
                    </div>

                    {/* Meta + CTA */}
                    <div className="p-5">
                      <h3 className="text-[14px] font-semibold text-ink truncate">
                        {tpl.name}
                      </h3>
                      {tpl.description && (
                        <p className="mt-1 text-[12.5px] text-ink-muted line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-subtle">
                        <span>v{tpl.version ?? 1}</span>
                        <span>·</span>
                        <span>{tpl.exportCount ?? 0} exports</span>
                      </div>
                      <button
                        onClick={() => openTemplate(tpl)}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-ink hover:bg-ink/90 text-paper rounded-md text-[13px] font-medium transition-colors"
                      >
                        Open in builder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────── */}
        {tab === 'my' && totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 px-3.5 text-[13px] font-medium bg-surface border border-line rounded-md text-ink-muted hover:text-ink hover:border-line-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-[12.5px] text-ink-muted px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 px-3.5 text-[13px] font-medium bg-surface border border-line rounded-md text-ink-muted hover:text-ink hover:border-line-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
