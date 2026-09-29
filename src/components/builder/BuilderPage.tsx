import { useCallback, useRef, useState, useEffect } from 'react';
import { buildEmailFromEditor } from '../../lib/renderTemplate';
import BuilderHeader from './BuilderHeader';
import BuilderWorkspace from './BuilderWorkspace';
import { EmailElement } from './DragDropBuilder';
import { buildEmailFromDragDrop } from '../../lib/renderDragDropTemplate';
import ImportHtmlDialog from './ImportHtmlDialog';
import { htmlToEditorJS } from '../../lib/htmlToEditorJS';
import { htmlToBlocks } from '@/lib/htmlToDragDrop';
import SendTestEmailDialog from './SendTestEmailDialog';
import VersionHistoryPanel from './VersionHistoryPanel';
import VariablesPanel from './VariablesPanel';
import Toast from '../common/Toast';
import {
    createTemplate,
    updateTemplate,
    sendTestEmail,
    exportTemplate,
    type TemplateVariable,
} from '../../services/templateService';
import { useAuth } from '../../store/authContext';

interface EditorData {
    time: number;
    blocks: any[];
    version: string;
}

interface PageLayout {
    background: string;
    backgroundImage?: string;
    backgroundRepeat?: string;
    backgroundSize?: string;
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    width: number;
    maxWidth: number;
    borderRadius: number;
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    height?: number;
}

interface ProfessionalOptions {
    fontFamily: string;
    baseColor: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    borderRadius: number;
    buttonStyle: 'flat' | 'rounded' | 'outline';
    spacing: number;
}

/**
 * Flatten every user-facing string out of the editor state so the variables
 * panel can grep it for {{slug}} tokens. Stringifying the whole state is
 * cheaper and simpler than walking the tree — the regex only cares about
 * text content anyway, and non-text noise won't produce false positives.
 */
function editorTextForVariables(
    editorData: unknown,
    dragDropElements: unknown,
    mode: 'editorjs' | 'dragdrop',
): string {
    try {
        if (mode === 'editorjs') return JSON.stringify(editorData ?? {});
        return JSON.stringify(dragDropElements ?? []);
    } catch {
        return '';
    }
}

export default function BuilderPage() {
    const { workspaceId } = useAuth();

    const [editorData, setEditorData] = useState<EditorData>({
        time: Date.now(),
        blocks: [],
        version: '2.30.8'
    });

    const editorRef = useRef<Map<number, any>>(new Map());
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [showHtmlDialog, setShowHtmlDialog] = useState(false);
    const [htmlCode, setHtmlCode] = useState<string>('');
    const [showImportHtmlDialog, setShowImportHtmlDialog] = useState(false);
    const [activeView, setActiveView] = useState<'desktop' | 'mobile'>('desktop');
    const [builderMode, setBuilderMode] = useState<'editorjs' | 'dragdrop'>('editorjs');
    const [dragDropElements, setDragDropElements] = useState<EmailElement[]>([]);
    const [pageLayouts, setPageLayouts] = useState<PageLayout[]>([{
        background: '#ffffff',
        backgroundImage: '',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        margins: { top: 40, right: 0, bottom: 0, left: 0 },
        width: 600,
        maxWidth: 900,
        borderRadius: 8,
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        height: 800
    }]);
    const [reInitializerEditor, setReInitializerEditor] = useState(false);
    const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [currentTemplateVersion, setCurrentTemplateVersion] = useState<number>(1);
    const [showVariables, setShowVariables] = useState(false);
    const [variables, setVariables] = useState<TemplateVariable[]>([]);
    // Per-slug values the user has typed into the preview modal's sidebar.
    // Empty string means "use variable default"; unset means "not yet initialized".
    const [sampleData, setSampleData] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Save / load state
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const lastSavedDataRef = useRef<string>('');

    // Autosave — debounced background save while editing
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Undo/redo history — captures all editable design state
    type Snapshot = {
        editorData: EditorData;
        dragDropElements: EmailElement[];
        pageLayouts: PageLayout[];
        professionalOptions: ProfessionalOptions;
    };
    const HISTORY_CAP = 50;
    const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] });
    const isRestoringRef = useRef(false);
    const historyPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const [professionalOptions, setProfessionalOptions] = useState<ProfessionalOptions>({
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        baseColor: '#06b6d4',
        primaryColor: '#06b6d4',
        secondaryColor: '#64748b',
        textColor: '#1e293b',
        borderRadius: 8,
        buttonStyle: 'rounded',
        spacing: 16
    });

    const loadTemplate = (data: any) => {
        setEditorData(data);
        setReInitializerEditor(!reInitializerEditor);
        setHasUnsavedChanges(false);
        lastSavedDataRef.current = JSON.stringify(data);
    };

    // On mount: restore template from sessionStorage (set by TemplatesPage on
    // "Edit" click). sessionStorage rather than localStorage so a stale handoff
    // can't leak across browser sessions or tabs. Every key is consumed exactly
    // once and cleared immediately.
    useEffect(() => {
        const readOnce = (key: string): string | null => {
            const v = sessionStorage.getItem(key) ?? localStorage.getItem(key);
            sessionStorage.removeItem(key);
            localStorage.removeItem(key); // migrate away from any old localStorage handoffs
            return v;
        };

        const tplId = readOnce('editingTemplateId');
        const tplName = readOnce('editingTemplateName');
        const rawTpl = readOnce('selectedTemplate');

        if (tplId) setEditingTemplateId(tplId);
        if (tplName) setTemplateName(tplName);

        if (rawTpl) {
            try {
                const parsed = JSON.parse(rawTpl);
                if (parsed) {
                    setEditorData(parsed);
                    lastSavedDataRef.current = rawTpl;
                }
            } catch (err) {
                console.warn('Failed to load selected template from storage', err);
            }
        }
    }, []);

    // Track unsaved changes + push history snapshot + schedule autosave.
    // History push is debounced 250ms so rapid keystrokes coalesce into
    // one undo step. Autosave debounced 3s so we don't hammer the API.
    useEffect(() => {
        const current = JSON.stringify(editorData);
        const isDirty = current !== lastSavedDataRef.current;
        setHasUnsavedChanges(isDirty);

        // ── History push ─────────────────────────────────────────
        if (isRestoringRef.current) {
            // This change came from undo/redo — don't record it again.
            isRestoringRef.current = false;
        } else {
            if (historyPushTimerRef.current) clearTimeout(historyPushTimerRef.current);
            historyPushTimerRef.current = setTimeout(() => {
                const snap: Snapshot = {
                    editorData,
                    dragDropElements,
                    pageLayouts,
                    professionalOptions,
                };
                const last = historyRef.current.past[historyRef.current.past.length - 1];
                // Skip if identical to the previous snapshot (no real change)
                if (last && JSON.stringify(last) === JSON.stringify(snap)) return;
                historyRef.current.past.push(snap);
                if (historyRef.current.past.length > HISTORY_CAP) {
                    historyRef.current.past.shift();
                }
                historyRef.current.future = [];
                setCanUndo(true);
                setCanRedo(false);
            }, 250);
        }

        // ── Autosave ─────────────────────────────────────────────
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        if (isDirty && editingTemplateId && !isSaving) {
            autosaveTimerRef.current = setTimeout(() => {
                // Fire and forget — silent = no success toast; failures still show
                handleSave({ silent: true });
            }, 3000);
        }

        return () => {
            if (historyPushTimerRef.current) clearTimeout(historyPushTimerRef.current);
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorData, dragDropElements, pageLayouts, professionalOptions, editingTemplateId, isSaving]);

    const clearCanvas = () => {
        if (builderMode === 'editorjs') {
            setEditorData({ time: Date.now(), blocks: [], version: '2.30.8' });
            setReInitializerEditor(!reInitializerEditor);
        } else {
            setDragDropElements([]);
        }
    };

    const exportHtml = async (view?: 'desktop' | 'mobile') => {
        const usedView = view || activeView || 'desktop';
        let html: string;
        if (builderMode === 'editorjs') {
            html = await buildEmailFromEditor(editorData, usedView, pageLayouts[0]);
        } else {
            html = buildEmailFromDragDrop(dragDropElements, pageLayouts[0], usedView);
        }
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-template-${usedView}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportJson = () => {
        const data = {
            builderMode,
            editorData: builderMode === 'editorjs' ? editorData : null,
            dragDropElements: builderMode === 'dragdrop' ? dragDropElements : null,
            pageLayouts,
            professionalOptions,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const openPreview = async () => {
        let html: string;
        if (builderMode === 'editorjs') {
            html = await buildEmailFromEditor(editorData, activeView, pageLayouts[0]);
        } else {
            html = buildEmailFromDragDrop(dragDropElements, pageLayouts[0], activeView);
        }
        // Seed sample data with variable defaults for any slugs not already
        // set by the user. Existing user input is preserved across re-opens.
        setSampleData((prev) => {
            const next = { ...prev };
            for (const v of variables) {
                if (next[v.slug] === undefined) next[v.slug] = v.defaultValue ?? '';
            }
            return next;
        });
        setPreviewHtml(html);
    };

    /**
     * Replace {{slug}} tokens in the preview HTML with, in order of preference:
     *   1. the value the user typed into the preview sidebar (sampleData)
     *   2. the variable's stored defaultValue
     *   3. the original token — so unresolved variables stay visible instead
     *      of collapsing to an empty string, which is more useful for debugging
     */
    const substitutedPreviewHtml = (() => {
        if (!previewHtml) return '';
        return previewHtml.replace(
            /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
            (match, slug: string) => {
                const s = sampleData[slug];
                if (s !== undefined && s !== '') return s;
                const v = variables.find((x) => x.slug === slug);
                if (v?.defaultValue) return v.defaultValue;
                return match;
            },
        );
    })();

    const resetSampleData = () => {
        const next: Record<string, string> = {};
        for (const v of variables) next[v.slug] = v.defaultValue ?? '';
        setSampleData(next);
    };

    // Save template to API. `silent` skips the success toast — used by autosave.
    const handleSave = async (opts: { silent?: boolean } = {}) => {
        if (!workspaceId) {
            setToast({ message: 'No workspace selected. Please log in again.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            let compiledHtml = '';
            try {
                compiledHtml = await buildEmailFromEditor(editorData, 'desktop', pageLayouts[0]);
            } catch {}

            const payload = {
                name: templateName || 'Untitled Template',
                editorData: editorData as unknown as Record<string, unknown>,
                compiledHtml,
                status: 'draft' as const,
                // Only send variables when the user has customized them — otherwise
                // let the backend's compileTemplate() auto-derive from the content.
                ...(variables.length > 0 ? { variables } : {}),
            };

            let saved;
            if (editingTemplateId) {
                const res = await updateTemplate(editingTemplateId, payload);
                saved = res.data;
            } else {
                const res = await createTemplate(payload);
                saved = res.data;
                setEditingTemplateId(saved._id);
                setTemplateName(saved.name);
            }

            lastSavedDataRef.current = JSON.stringify(editorData);
            setHasUnsavedChanges(false);
            if (typeof saved.version === 'number') {
                setCurrentTemplateVersion(saved.version);
            }
            // Sync from server so auto-detected variables added by compileTemplate() show up
            if (Array.isArray(saved.variables)) {
                setVariables(saved.variables as TemplateVariable[]);
            }
            if (!opts.silent) {
                setToast({ message: `"${saved.name}" saved successfully`, type: 'success' });
            }
        } catch (err: any) {
            // Even silent autosaves surface errors — the user should know.
            setToast({ message: err.message || 'Failed to save template', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Undo / Redo ─────────────────────────────────────────────────
    // Snapshot restore. Guarded by isRestoringRef so the dirty/history
    // effect doesn't re-record the state we just restored.

    const applySnapshot = (snap: Snapshot) => {
        isRestoringRef.current = true;
        setEditorData(snap.editorData);
        setDragDropElements(snap.dragDropElements);
        setPageLayouts(snap.pageLayouts);
        setProfessionalOptions(snap.professionalOptions);
        setReInitializerEditor((v) => !v); // force EditorJS to re-mount with restored data
    };

    const undo = useCallback(() => {
        const { past, future } = historyRef.current;
        if (past.length === 0) return;
        // Cancel any pending snapshot push so we don't re-record mid-undo
        if (historyPushTimerRef.current) clearTimeout(historyPushTimerRef.current);
        const current: Snapshot = {
            editorData, dragDropElements, pageLayouts, professionalOptions,
        };
        const previous = past.pop()!;
        future.unshift(current);
        if (future.length > HISTORY_CAP) future.pop();
        applySnapshot(previous);
        setCanUndo(past.length > 0);
        setCanRedo(true);
    }, [editorData, dragDropElements, pageLayouts, professionalOptions]);

    const redo = useCallback(() => {
        const { past, future } = historyRef.current;
        if (future.length === 0) return;
        if (historyPushTimerRef.current) clearTimeout(historyPushTimerRef.current);
        const current: Snapshot = {
            editorData, dragDropElements, pageLayouts, professionalOptions,
        };
        const next = future.shift()!;
        past.push(current);
        if (past.length > HISTORY_CAP) past.shift();
        applySnapshot(next);
        setCanUndo(true);
        setCanRedo(future.length > 0);
    }, [editorData, dragDropElements, pageLayouts, professionalOptions]);

    // ── Keyboard shortcuts ──────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const mod = isMac ? e.metaKey : e.ctrlKey;
            if (!mod) return;
            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((key === 'z' && e.shiftKey) || key === 'y') {
                e.preventDefault();
                redo();
            } else if (key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [undo, redo]);

    // ── Multi-format export ─────────────────────────────────────────
    // HTML: client-side render + download (no save needed — works on drafts)
    // MJML / EJS: backend export — requires a saved template (has tplId)

    const exportAs = async (format: 'html' | 'mjml' | 'ejs') => {
        try {
            if (format === 'html') {
                const html = builderMode === 'editorjs'
                    ? await buildEmailFromEditor(editorData, 'desktop', pageLayouts[0])
                    : buildEmailFromDragDrop(dragDropElements, pageLayouts[0], 'desktop');
                downloadFile(`${templateName || 'template'}.html`, html, 'text/html');
                setToast({ message: 'HTML downloaded', type: 'success' });
                return;
            }

            if (!editingTemplateId) {
                setToast({
                    message: `Save the template first, then export as ${format.toUpperCase()}.`,
                    type: 'error',
                });
                return;
            }
            const res = await exportTemplate(editingTemplateId, format);
            const output = res.data.output || res.data.rendered || '';
            const mime = format === 'mjml' ? 'text/xml' : 'text/plain';
            downloadFile(`${templateName || 'template'}.${format}`, output, mime);
            setToast({ message: `${format.toUpperCase()} downloaded`, type: 'success' });
        } catch (err: any) {
            setToast({ message: err.message || `${format.toUpperCase()} export failed`, type: 'error' });
        }
    };

    const downloadFile = (name: string, content: string, mime: string) => {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatHtml = (html: string): string => {
        let formatted = '';
        let indent = 0;
        const tab = '  ';

        const tokens = html.replace(/>\s*</g, '><').split(/(<[^>]+>)/g).filter(Boolean);

        const voidElements = [
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        ];

        for (const token of tokens) {
            if (token.match(/^<\//)) {
                indent = Math.max(0, indent - 1);
                formatted += '\n' + tab.repeat(indent) + token;
            } else if (token.match(/^<.*>$/)) {
                const tagNameMatch = token.match(/^<([a-z0-9]+)/i);
                const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';

                const isSelfClosing = token.endsWith('/>') || voidElements.includes(tagName);

                formatted += '\n' + tab.repeat(indent) + token;

                if (!isSelfClosing && !token.startsWith('<!')) {
                    indent++;
                }
            } else {
                const text = token.trim();
                if (text) {
                    formatted += '\n' + tab.repeat(indent) + text;
                }
            }
        }

        return formatted.trim();
    };

    const showHtml = async () => {
        let html: string;
        if (builderMode === 'editorjs') {
            html = await buildEmailFromEditor(editorData, activeView, pageLayouts[0]);
        } else {
            html = buildEmailFromDragDrop(dragDropElements, pageLayouts[0], activeView);
        }
        const formattedHtml = formatHtml(html);
        setHtmlCode(formattedHtml);
        setShowHtmlDialog(true);
    };

    useEffect(() => {
        if (previewHtml) {
            openPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView]);

    const updatePageLayout = (partial: Partial<PageLayout>) => {
        setPageLayouts((prev) => {
            const copy = [...prev];
            copy[0] = { ...copy[0], ...partial };
            return copy;
        });
    };

    const updateProfessionalOptions = (partial: Partial<ProfessionalOptions>) => {
        setProfessionalOptions(prev => ({ ...prev, ...partial }));
    };

    const handleChangeEditorjsData = useCallback(
        (content: any, _pageIndex: number) => {
            setEditorData(content);
        },
        [editorData]
    );

    const handleImportHtml = (htmlString: string) => {
        try {
            if (builderMode === 'editorjs') {
                const editorJSData = htmlToEditorJS(htmlString);
                setEditorData(editorJSData);
                setReInitializerEditor(!reInitializerEditor);
            } else {
                const dragDropElements = htmlToBlocks(htmlString);
                setDragDropElements(dragDropElements);
            }
        } catch (error) {
            console.error('Error importing HTML:', error);
            alert('Failed to import HTML. Please check the HTML format and try again.');
        }
    };

    const handleSendTestEmail = async (to: string, subject: string) => {
        try {
            const emails = to.split(',').map(e => e.trim()).filter(Boolean);
            if (emails.length === 0) {
                throw new Error('Please enter at least one valid email address');
            }

            let html: string;
            if (builderMode === 'editorjs') {
                html = await buildEmailFromEditor(editorData, activeView, pageLayouts[0]);
            } else {
                html = buildEmailFromDragDrop(dragDropElements, pageLayouts[0], activeView);
            }

            const res = await sendTestEmail(emails, subject, html);
            setToast({
                message: `Test email delivered to ${res.data.delivered} recipient${
                    res.data.delivered !== 1 ? 's' : ''
                }`,
                type: 'success',
            });
        } catch (error: any) {
            console.error('Error sending test email:', error);
            setToast({ message: error.message || 'Failed to send test email', type: 'error' });
            throw error;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-paper">
            <BuilderHeader
                activeView={activeView}
                setActiveView={(v) => setActiveView(v)}
                openPreview={openPreview}
                exportHtml={exportHtml}
                onExport={exportAs}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onOpenHistory={editingTemplateId ? () => setShowVersionHistory(true) : undefined}
                onOpenVariables={() => setShowVariables(true)}
                variableCount={variables.length}
                variablesForInsert={variables}
                showHtml={showHtml}
                exportJson={exportJson}
                clearCanvas={clearCanvas}
                builderMode={builderMode}
                setBuilderMode={setBuilderMode}
                onImportHtml={() => setShowImportHtmlDialog(true)}
                onSendTestEmail={() => setShowTestEmailDialog(true)}
                onSave={workspaceId ? () => handleSave() : undefined}
                isSaving={isSaving}
                templateName={templateName}
                hasUnsavedChanges={hasUnsavedChanges}
            />

            <BuilderWorkspace
                builderMode={builderMode}
                editorData={editorData}
                onEditorChange={handleChangeEditorjsData}
                editorRef={editorRef}
                pageLayouts={pageLayouts}
                updatePageLayout={updatePageLayout}
                professionalOptions={professionalOptions}
                updateProfessionalOptions={updateProfessionalOptions}
                activeView={activeView}
                loadTemplate={loadTemplate}
                reInitializerEditor={reInitializerEditor}
                dragDropElements={dragDropElements}
                onDragDropElementsChange={setDragDropElements}
            />

            {/* ── Preview modal ─────────────────────────────────────── */}
            {previewHtml && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl max-w-7xl w-full max-h-[90vh] flex flex-col border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
                            <h3 className="font-serif text-[16px] font-semibold text-ink tracking-tight">
                                Email preview
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="flex p-0.5 bg-surface-sunken/60 border border-line rounded-md">
                                    <button
                                        onClick={() => setActiveView('desktop')}
                                        className={[
                                            'h-7 px-3 rounded text-[12px] font-medium transition-colors',
                                            activeView === 'desktop'
                                                ? 'bg-surface text-ink shadow-sm border border-line'
                                                : 'text-ink-muted hover:text-ink border border-transparent',
                                        ].join(' ')}
                                    >
                                        Desktop
                                    </button>
                                    <button
                                        onClick={() => setActiveView('mobile')}
                                        className={[
                                            'h-7 px-3 rounded text-[12px] font-medium transition-colors',
                                            activeView === 'mobile'
                                                ? 'bg-surface text-ink shadow-sm border border-line'
                                                : 'text-ink-muted hover:text-ink border border-transparent',
                                        ].join(' ')}
                                    >
                                        Mobile
                                    </button>
                                </div>
                                <button
                                    onClick={async () => {
                                        // Export uses the *substituted* HTML so sample data flows into the tab
                                        const blob = new Blob([substitutedPreviewHtml], { type: 'text/html' });
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                    }}
                                    className="h-8 px-3 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[12px] transition-colors"
                                >
                                    Open in new tab
                                </button>
                                <button
                                    onClick={() => setPreviewHtml(null)}
                                    className="h-8 px-3 bg-surface border border-line hover:border-line-strong text-ink rounded-md font-medium text-[12px] transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Body: variables sidebar (if any) + preview stage */}
                        <div className="flex-1 flex overflow-hidden">
                            {variables.length > 0 && (
                                <aside className="w-64 lg:w-72 border-r border-line bg-surface-sunken/40 flex flex-col overflow-hidden flex-shrink-0 hidden md:flex">
                                    <div className="px-4 pt-4 pb-3 border-b border-line flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h4 className="text-[10.5px] font-semibold text-ink uppercase tracking-[0.14em]">
                                                Test data
                                            </h4>
                                            <p className="text-[11.5px] text-ink-muted mt-0.5 leading-snug">
                                                {variables.length} variable{variables.length !== 1 ? 's' : ''} — try sample values live
                                            </p>
                                        </div>
                                        <button
                                            onClick={resetSampleData}
                                            className="text-[11.5px] font-medium text-ink-muted hover:text-ink transition-colors flex-shrink-0 mt-0.5"
                                            title="Reset each field to its variable default"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {variables.map((v) => (
                                            <div key={v.slug}>
                                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                                    <label
                                                        htmlFor={`sample-${v.slug}`}
                                                        className="text-[12px] font-medium text-ink truncate"
                                                    >
                                                        {v.name}
                                                    </label>
                                                    <code className="font-mono text-[10.5px] text-ink-subtle truncate">
                                                        {'{{'}
                                                        {v.slug}
                                                        {'}}'}
                                                    </code>
                                                </div>
                                                <input
                                                    id={`sample-${v.slug}`}
                                                    type="text"
                                                    value={sampleData[v.slug] ?? ''}
                                                    onChange={(e) =>
                                                        setSampleData((prev) => ({
                                                            ...prev,
                                                            [v.slug]: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full h-9 px-2.5 text-[13px] bg-surface border border-line rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors"
                                                    placeholder={v.defaultValue || '—'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-3 border-t border-line bg-surface/40">
                                        <p className="text-[11px] text-ink-subtle leading-relaxed">
                                            Empty fields fall back to variable defaults, then to the raw{' '}
                                            <code className="font-mono">{'{{token}}'}</code> so unresolved
                                            merges stay visible.
                                        </p>
                                    </div>
                                </aside>
                            )}

                            <div className="flex-1 overflow-y-auto bg-paper flex items-start justify-center p-8">
                                <div className="w-full flex items-start justify-center min-h-full">
                                    <div
                                        className={`bg-surface border border-line rounded-lg shadow-[0_16px_48px_-16px_rgba(20,20,20,0.12)] ${activeView === 'mobile' ? 'mobile-view-active' : ''}`}
                                        style={{
                                            width: activeView === 'mobile' ? '375px' : '600px',
                                            maxWidth: activeView === 'mobile' ? '375px' : '600px',
                                            backgroundColor: pageLayouts[0]?.background || '#ffffff',
                                            backgroundImage: pageLayouts[0]?.backgroundImage ? `url(${pageLayouts[0]?.backgroundImage})` : undefined,
                                            backgroundRepeat: pageLayouts[0]?.backgroundRepeat || 'no-repeat',
                                            backgroundSize: pageLayouts[0]?.backgroundSize || 'cover',
                                            transition: 'all 0.3s ease',
                                            overflow: 'auto',
                                            maxHeight: 'calc(100vh - 200px)',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: substitutedPreviewHtml }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HTML code modal ───────────────────────────────────── */}
            {showHtmlDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
                            <h3 className="font-serif text-[16px] font-semibold text-ink tracking-tight">
                                HTML code
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        let html: string;
                                        if (builderMode === 'editorjs') {
                                            html = await buildEmailFromEditor(editorData, activeView, pageLayouts[0]);
                                        } else {
                                            html = buildEmailFromDragDrop(dragDropElements, pageLayouts[0], activeView);
                                        }
                                        await navigator.clipboard.writeText(html);
                                        setToast({ message: 'HTML copied to clipboard', type: 'success' });
                                    }}
                                    className="h-8 px-3 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[12px] transition-colors"
                                >
                                    Copy
                                </button>
                                <button
                                    onClick={() => setShowHtmlDialog(false)}
                                    className="h-8 px-3 bg-surface border border-line hover:border-line-strong text-ink rounded-md font-medium text-[12px] transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        {/* Ink-black code panel — deliberate high-contrast reading surface for code */}
                        <div className="flex-1 overflow-auto p-6 bg-ink">
                            <pre className="text-[13px] text-paper/90 font-mono whitespace-pre-wrap break-words overflow-x-auto leading-relaxed">
                                <code>{htmlCode}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            <ImportHtmlDialog
                isOpen={showImportHtmlDialog}
                onClose={() => setShowImportHtmlDialog(false)}
                onImport={handleImportHtml}
                builderMode={builderMode}
            />

            <SendTestEmailDialog
                isOpen={showTestEmailDialog}
                onClose={() => setShowTestEmailDialog(false)}
                onSend={handleSendTestEmail}
            />

            <VariablesPanel
                isOpen={showVariables}
                onClose={() => setShowVariables(false)}
                variables={variables}
                onChange={(next) => setVariables(next)}
                editorTextForDetection={editorTextForVariables(editorData, dragDropElements, builderMode)}
            />

            <VersionHistoryPanel
                isOpen={showVersionHistory}
                onClose={() => setShowVersionHistory(false)}
                templateId={editingTemplateId}
                currentVersion={currentTemplateVersion}
                onRestored={(tpl) => {
                    // Load restored editorData into the canvas and mark clean.
                    if (tpl?.editorData) {
                        setEditorData(tpl.editorData as EditorData);
                        setReInitializerEditor((v) => !v);
                        lastSavedDataRef.current = JSON.stringify(tpl.editorData);
                        setHasUnsavedChanges(false);
                    }
                    if (typeof tpl?.version === 'number') {
                        setCurrentTemplateVersion(tpl.version);
                    }
                    if (Array.isArray(tpl?.variables)) {
                        setVariables(tpl.variables as TemplateVariable[]);
                    }
                    setToast({
                        message: `Restored — now at version ${tpl?.version ?? '?'}`,
                        type: 'success',
                    });
                }}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
