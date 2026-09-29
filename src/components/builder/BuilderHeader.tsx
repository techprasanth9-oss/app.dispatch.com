import { useState, useRef, useEffect } from 'react';
import {
    Monitor,
    Smartphone,
    Eye,
    Code,
    Save,
    Download,
    Trash2,
    Mail,
    LayoutTemplate,
    MousePointer2,
    PenTool,
    Send,
    ArrowLeft,
    Loader2,
    CloudUpload,
    ChevronDown,
    Undo2,
    Redo2,
    FileCode,
    FileType,
    FileText,
    History,
    Braces,
    Copy,
    Check,
} from 'lucide-react';
import { useRouter } from '@tanstack/react-router';

type ExportFormat = 'html' | 'mjml' | 'ejs';

interface Props {
    activeView: 'desktop' | 'mobile';
    setActiveView: (v: 'desktop' | 'mobile') => void;
    openPreview: () => void;
    /** Legacy single-shot HTML export; kept for the "Download JSON"-like icon-only actions. */
    exportHtml: () => void;
    /** Multi-format export used by the split button dropdown. */
    onExport?: (format: ExportFormat) => void;
    showHtml: () => void;
    exportJson: () => void;
    clearCanvas: () => void;
    builderMode: 'editorjs' | 'dragdrop';
    setBuilderMode: (mode: 'editorjs' | 'dragdrop') => void;
    onImportHtml: () => void;
    onSendTestEmail: () => void;
    onSave?: () => void;
    isSaving?: boolean;
    templateName?: string;
    hasUnsavedChanges?: boolean;
    // Undo/redo
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    // Version history — undefined when no saved template exists yet
    onOpenHistory?: () => void;
    // Merge variables — dropdown lists them for quick insertion into content
    onOpenVariables?: () => void;
    variableCount?: number;
    variablesForInsert?: Array<{ slug: string; name: string; defaultValue?: string | null }>;
}

export default function BuilderHeader({
    activeView,
    setActiveView,
    openPreview,
    exportHtml,
    onExport,
    showHtml,
    exportJson,
    clearCanvas,
    builderMode,
    setBuilderMode,
    onImportHtml,
    onSendTestEmail,
    onSave,
    isSaving = false,
    templateName,
    hasUnsavedChanges = false,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onOpenHistory,
    onOpenVariables,
    variableCount: _variableCount = 0,
    variablesForInsert,
}: Props) {
    const router = useRouter();
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Click-outside handler for the export dropdown
    useEffect(() => {
        if (!exportMenuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [exportMenuOpen]);

    const doExport = (format: ExportFormat) => {
        setExportMenuOpen(false);
        if (onExport) onExport(format);
        else if (format === 'html') exportHtml();
    };

    return (
        <header className="bg-paper/95 backdrop-blur-md border-b border-line h-16 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50 shadow-[0_1px_2px_rgba(20,20,20,0.03)]">
            {/* ── Left: Back + wordmark + template name ─────────────── */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={() => router.navigate({ to: '/templates' })}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 transition-colors flex-shrink-0"
                    title="Back to Templates"
                >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <div className="w-px h-5 bg-line flex-shrink-0" />
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-paper" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-serif text-[15px] font-semibold text-ink leading-tight tracking-tight truncate">
                            {templateName || 'Untitled template'}
                        </h1>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                            <span
                                className={[
                                    'w-1.5 h-1.5 rounded-full',
                                    hasUnsavedChanges
                                        ? 'bg-accent animate-pulse'
                                        : 'bg-success',
                                ].join(' ')}
                            />
                            {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Center: mode + device switchers ────────────────────── */}
            <div className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                {/* Editor mode */}
                <div className="flex p-0.5 bg-surface-sunken/60 border border-line rounded-md">
                    <button
                        onClick={() => setBuilderMode('dragdrop')}
                        className={[
                            'flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] font-medium transition-colors',
                            builderMode === 'dragdrop'
                                ? 'bg-surface text-ink shadow-sm border border-line'
                                : 'text-ink-muted hover:text-ink border border-transparent',
                        ].join(' ')}
                    >
                        <MousePointer2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Visual
                    </button>
                    <button
                        onClick={() => setBuilderMode('editorjs')}
                        className={[
                            'flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] font-medium transition-colors',
                            builderMode === 'editorjs'
                                ? 'bg-surface text-ink shadow-sm border border-line'
                                : 'text-ink-muted hover:text-ink border border-transparent',
                        ].join(' ')}
                    >
                        <PenTool className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Editor
                    </button>
                </div>

                <div className="w-px h-5 bg-line" />

                {/* Device preview */}
                <div className="flex p-0.5 bg-surface-sunken/60 border border-line rounded-md">
                    <button
                        onClick={() => setActiveView('desktop')}
                        className={[
                            'h-7 w-8 rounded flex items-center justify-center transition-colors',
                            activeView === 'desktop'
                                ? 'bg-surface text-ink shadow-sm border border-line'
                                : 'text-ink-muted hover:text-ink border border-transparent',
                        ].join(' ')}
                        title="Desktop view"
                    >
                        <Monitor className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <button
                        onClick={() => setActiveView('mobile')}
                        className={[
                            'h-7 w-8 rounded flex items-center justify-center transition-colors',
                            activeView === 'mobile'
                                ? 'bg-surface text-ink shadow-sm border border-line'
                                : 'text-ink-muted hover:text-ink border border-transparent',
                        ].join(' ')}
                        title="Mobile view"
                    >
                        <Smartphone className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                </div>
            </div>

            {/* ── Right: actions ─────────────────────────────────────── */}
            <div className="flex items-center gap-1">
                {/* Undo / Redo — appear only if handlers provided */}
                {(onUndo || onRedo) && (
                    <>
                        <IconButton
                            onClick={() => onUndo?.()}
                            title="Undo (⌘Z)"
                            disabled={!canUndo}
                        >
                            <Undo2 className="w-4 h-4" strokeWidth={1.75} />
                        </IconButton>
                        <IconButton
                            onClick={() => onRedo?.()}
                            title="Redo (⌘⇧Z)"
                            disabled={!canRedo}
                        >
                            <Redo2 className="w-4 h-4" strokeWidth={1.75} />
                        </IconButton>
                        <div className="hidden sm:block h-5 w-px bg-line mx-1" />
                    </>
                )}

                <button
                    onClick={openPreview}
                    className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-surface-sunken/60 rounded-md transition-colors"
                >
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Preview
                </button>

                <div className="hidden sm:block h-5 w-px bg-line mx-1" />

                {/* Uniform-hover action icons — no rainbow, keeps attention on primary CTAs */}
                <div className="flex items-center">
                    <IconButton onClick={showHtml} title="Show HTML code">
                        <Code className="w-4 h-4" strokeWidth={1.75} />
                    </IconButton>
                    <IconButton onClick={onImportHtml} title="Import HTML">
                        <LayoutTemplate className="w-4 h-4" strokeWidth={1.75} />
                    </IconButton>
                    <IconButton onClick={exportJson} title="Download JSON">
                        <Save className="w-4 h-4" strokeWidth={1.75} />
                    </IconButton>
                    {onOpenHistory && (
                        <IconButton onClick={onOpenHistory} title="Version history">
                            <History className="w-4 h-4" strokeWidth={1.75} />
                        </IconButton>
                    )}
                    {onOpenVariables && (
                        <VariablesButton
                            onOpenVariables={onOpenVariables}
                            variables={variablesForInsert ?? []}
                        />
                    )}
                    <IconButton onClick={clearCanvas} title="Clear canvas" danger>
                        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </IconButton>
                </div>

                <div className="h-5 w-px bg-line mx-1" />

                <button
                    onClick={onSendTestEmail}
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-accent bg-accent-soft/60 hover:bg-accent-soft border border-accent/25 hover:border-accent/40 rounded-md transition-colors"
                >
                    <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Test
                </button>

                {onSave && (
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 h-8 px-3 bg-surface border border-line hover:border-line-strong disabled:opacity-60 disabled:cursor-not-allowed text-ink text-[12px] font-medium rounded-md transition-colors"
                        title="Save template to workspace"
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                        ) : (
                            <CloudUpload className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                        {isSaving ? 'Saving…' : 'Save'}
                    </button>
                )}

                {/* Export split button — main click = HTML, chevron opens format menu */}
                <div ref={exportMenuRef} className="relative flex items-stretch">
                    <button
                        onClick={() => doExport('html')}
                        className="flex items-center gap-1.5 h-8 pl-3 pr-2.5 bg-accent hover:bg-accent-hover text-white text-[12px] font-medium rounded-l-md transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" strokeWidth={2} />
                        Export
                    </button>
                    <button
                        onClick={() => setExportMenuOpen((v) => !v)}
                        aria-label="Export format"
                        className="flex items-center justify-center w-6 h-8 bg-accent hover:bg-accent-hover text-white rounded-r-md border-l border-white/20 transition-colors"
                    >
                        <ChevronDown
                            className={[
                                'w-3.5 h-3.5 transition-transform',
                                exportMenuOpen ? 'rotate-180' : '',
                            ].join(' ')}
                            strokeWidth={2}
                        />
                    </button>
                    {exportMenuOpen && (
                        <div className="absolute right-0 top-10 bg-surface rounded-md shadow-[0_12px_32px_-8px_rgba(20,20,20,0.2)] border border-line py-1 w-52 z-50 overflow-hidden">
                            <p className="px-3 py-1.5 text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em] border-b border-line">
                                Export as
                            </p>
                            <button
                                onClick={() => doExport('html')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink hover:bg-surface-sunken/60 transition-colors text-left"
                            >
                                <FileCode className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                                <div className="flex-1">
                                    <div className="font-medium">HTML</div>
                                    <div className="text-[10.5px] text-ink-subtle">Send-ready email HTML</div>
                                </div>
                            </button>
                            <button
                                onClick={() => doExport('mjml')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink hover:bg-surface-sunken/60 transition-colors text-left"
                            >
                                <FileType className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                                <div className="flex-1">
                                    <div className="font-medium">MJML</div>
                                    <div className="text-[10.5px] text-ink-subtle">Source for MJML pipelines</div>
                                </div>
                            </button>
                            <button
                                onClick={() => doExport('ejs')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink hover:bg-surface-sunken/60 transition-colors text-left"
                            >
                                <FileText className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                                <div className="flex-1">
                                    <div className="font-medium">EJS</div>
                                    <div className="text-[10.5px] text-ink-subtle">Template with merge variables</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

/**
 * Small icon-only button used across the header's utility row.
 * `danger` variant flips the hover to vermillion — reserved for destructive
 * actions like Clear Canvas so the intent lands without shouting.
 */
function IconButton({
    onClick,
    title,
    danger,
    disabled,
    children,
}: {
    onClick: () => void;
    title: string;
    danger?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={[
                'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                disabled
                    ? 'text-ink-subtle opacity-40 cursor-not-allowed'
                    : danger
                        ? 'text-ink-muted hover:text-error hover:bg-error/5'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-sunken/60',
            ].join(' ')}
        >
            {children}
        </button>
    );
}

/**
 * Split button: main click opens the full Variables panel, chevron reveals a
 * quick-insert dropdown of currently-defined variables. Selecting a variable
 * copies `{{slug}}` to the clipboard — the user then pastes at their cursor.
 * (Direct-insertion into EditorJS/dnd-kit is a deeper integration; clipboard
 * flow works reliably in both editor modes without touching their internals.)
 */
function VariablesButton({
    onOpenVariables,
    variables,
}: {
    onOpenVariables: () => void;
    variables: Array<{ slug: string; name: string; defaultValue?: string | null }>;
}) {
    const [open, setOpen] = useState(false);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const count = variables.length;

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    async function copyToken(slug: string) {
        try {
            await navigator.clipboard.writeText(`{{${slug}}}`);
            setCopiedSlug(slug);
            setTimeout(() => setCopiedSlug((c) => (c === slug ? null : c)), 1400);
        } catch {
            // clipboard rejection is rare; nothing to fall back to gracefully
        }
    }

    return (
        <div ref={ref} className="relative flex items-stretch">
            <button
                onClick={onOpenVariables}
                title={`Merge variables${count > 0 ? ` (${count})` : ''}`}
                className="w-8 h-8 rounded-l-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 transition-colors relative"
            >
                <Braces className="w-4 h-4" strokeWidth={1.75} />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-accent text-white text-[9.5px] font-bold flex items-center justify-center border border-paper pointer-events-none">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>
            <button
                onClick={() => setOpen((v) => !v)}
                title="Insert a variable"
                aria-label="Insert variable"
                className="w-5 h-8 rounded-r-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 transition-colors border-l border-line"
            >
                <ChevronDown
                    className={['w-3 h-3 transition-transform', open ? 'rotate-180' : ''].join(' ')}
                    strokeWidth={2}
                />
            </button>

            {open && (
                <div className="absolute right-0 top-10 bg-surface rounded-md shadow-[0_12px_32px_-8px_rgba(20,20,20,0.2)] border border-line py-1 w-64 z-50 overflow-hidden">
                    <p className="px-3 py-1.5 text-[10.5px] font-semibold text-ink-subtle uppercase tracking-[0.14em] border-b border-line">
                        Insert variable
                    </p>
                    {count === 0 ? (
                        <div className="px-3 py-4 text-center">
                            <p className="text-[12px] text-ink-muted mb-2 leading-relaxed">
                                No variables defined.
                            </p>
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onOpenVariables();
                                }}
                                className="text-[12px] font-medium text-accent hover:text-accent-hover"
                            >
                                Add one →
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-72 overflow-y-auto py-1">
                            {variables.map((v) => (
                                <button
                                    key={v.slug}
                                    onClick={() => copyToken(v.slug)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-sunken/60 transition-colors"
                                >
                                    <span className="flex-1 min-w-0 truncate text-[13px] text-ink">
                                        {v.name}
                                    </span>
                                    <code className="font-mono text-[10.5px] text-ink-subtle truncate">
                                        {'{{'}
                                        {v.slug}
                                        {'}}'}
                                    </code>
                                    {copiedSlug === v.slug ? (
                                        <Check className="w-3 h-3 text-success flex-shrink-0" strokeWidth={2} />
                                    ) : (
                                        <Copy className="w-3 h-3 text-ink-subtle flex-shrink-0" strokeWidth={1.75} />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="px-3 py-2 border-t border-line bg-surface-sunken/40">
                        <p className="text-[10.5px] text-ink-subtle leading-relaxed">
                            Click a variable to copy <code className="font-mono">{'{{token}}'}</code>, then paste at your cursor.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
