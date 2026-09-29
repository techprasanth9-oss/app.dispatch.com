import React, { useEffect, useRef, useState } from 'react'
import Palette from './Palette'
import EditorJSComponent from '../EditorJs'
import PropertiesPanel from './PropertiesPanel'
import DragDropBuilder, { EmailElement } from './DragDropBuilder'
import { LayoutTemplate, Settings, Layers, Monitor, Smartphone } from 'lucide-react'

interface Props {
    builderMode: 'editorjs' | 'dragdrop'
    editorData: any
    onEditorChange: any
    editorRef: React.MutableRefObject<Map<number, any> | any>
    pageLayouts: any[]
    updatePageLayout: (partial: any) => void
    professionalOptions: any
    updateProfessionalOptions: (partial: any) => void
    activeView: 'desktop' | 'mobile'
    loadTemplate: (d: any) => void
    reInitializerEditor: boolean
    dragDropElements: EmailElement[]
    onDragDropElementsChange: (elements: EmailElement[]) => void
}

/**
 * Three-pane editor frame: templates gallery (left), canvas (center),
 * properties (right). The DragDropBuilder is a separate top-level frame,
 * so this component only builds the EditorJS three-pane layout.
 */
export default function BuilderWorkspace({
    builderMode,
    editorData,
    onEditorChange,
    editorRef,
    pageLayouts,
    updatePageLayout,
    professionalOptions,
    updateProfessionalOptions,
    activeView,
    loadTemplate,
    reInitializerEditor,
    dragDropElements,
    onDragDropElementsChange,
}: Props) {
    const [isLoaded, setIsLoaded] = useState(false)
    const canvasRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const t = setTimeout(() => setIsLoaded(true), 100)
        return () => clearTimeout(t)
    }, [])

    const handleEditorHeightChange = (_pageIndex: number, height: number) => {
        updatePageLayout({ height })
    }

    const page = pageLayouts?.[0] || {}

    if (builderMode === 'dragdrop') {
        return (
            <DragDropBuilder
                elements={dragDropElements}
                onElementsChange={onDragDropElementsChange}
                pageLayouts={pageLayouts}
                activeView={activeView}
            />
        )
    }

    return (
        <div className="flex-1 flex overflow-hidden bg-paper">
            {/* ── Left: Templates gallery ────────────────────────────── */}
            <aside
                className={[
                    'w-72 lg:w-80 bg-surface border-r border-line',
                    'flex flex-col h-full flex-shrink-0',
                    'transition-all duration-400 ease-out',
                    isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
                ].join(' ')}
            >
                <PanelHeader
                    icon={<LayoutTemplate className="w-4 h-4 text-accent" strokeWidth={1.75} />}
                    title="Templates"
                    subtitle="Pre-designed layouts"
                />
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-3">
                        <Palette loadTemplate={loadTemplate} />
                    </div>
                </div>
            </aside>

            {/* ── Center: Canvas ─────────────────────────────────────── */}
            <section
                className={[
                    'flex-1 bg-paper flex flex-col overflow-hidden min-w-0 relative',
                    'transition-opacity duration-400 delay-75 ease-out',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
            >
                {/* Canvas header — sits above the canvas, editorial toolbar strip */}
                <div className="bg-paper/90 backdrop-blur-md border-b border-line px-6 py-3 flex-shrink-0 z-20 sticky top-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-surface border border-line flex items-center justify-center">
                                <Layers className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                            </div>
                            <div>
                                <h2 className="text-[10.5px] font-semibold text-ink uppercase tracking-[0.14em]">
                                    Canvas
                                </h2>
                                <p className="text-[10.5px] text-ink-subtle mt-0.5">
                                    Design your email
                                </p>
                            </div>
                        </div>

                        {/* View indicator */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-sunken/60 border border-line rounded-full">
                            {activeView === 'desktop' ? (
                                <Monitor className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                            ) : (
                                <Smartphone className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                            )}
                            <span className="text-[11px] font-medium text-ink-muted capitalize">
                                {activeView}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Canvas surface — actual paper the email lives on */}
                <div className="flex-1 overflow-auto p-8 lg:p-12 relative custom-scrollbar">
                    <div className="flex items-start justify-center min-h-full pb-20">
                        <div
                            ref={canvasRef}
                            className={[
                                'bg-surface rounded-xl border border-line',
                                'shadow-[0_1px_2px_rgba(20,20,20,0.03),0_16px_48px_-16px_rgba(20,20,20,0.12)]',
                                'transition-transform duration-400 ease-out',
                                activeView === 'mobile' ? 'scale-[0.85] origin-top' : 'scale-100',
                            ].join(' ')}
                            style={{
                                width:
                                    activeView === 'mobile' ? '375px' : `${page.width || 900}px`,
                                maxWidth:
                                    activeView === 'mobile'
                                        ? '375px'
                                        : `${page.maxWidth || 900}px`,
                                backgroundColor: page.background || undefined,
                                backgroundImage: page.backgroundImage
                                    ? `url(${page.backgroundImage})`
                                    : undefined,
                                backgroundRepeat: page.backgroundRepeat || 'no-repeat',
                                backgroundSize: page.backgroundSize || 'cover',
                                borderRadius: `${page.borderRadius || 12}px`,
                                padding: `${page.padding?.top || 48}px ${
                                    page.padding?.right || 48
                                }px ${page.padding?.bottom || 48}px ${page.padding?.left || 48}px`,
                                minHeight: page.height ? `${page.height}px` : 'auto',
                            }}
                        >
                            <div
                                className="overflow-y-auto relative custom-scrollbar"
                                style={{
                                    minHeight: page.height ? `${page.height}px` : '700px',
                                }}
                            >
                                <EditorJSComponent
                                    data={editorData}
                                    onChange={onEditorChange}
                                    pageIndex={0}
                                    editorRef={editorRef}
                                    pageLayouts={pageLayouts}
                                    onHeightChange={handleEditorHeightChange}
                                    reInitializerEditor={reInitializerEditor}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Right: Properties panel ────────────────────────────── */}
            <aside
                className={[
                    'w-80 lg:w-96 bg-surface border-l border-line',
                    'flex flex-col h-full flex-shrink-0',
                    'transition-all duration-400 delay-100 ease-out',
                    isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
                ].join(' ')}
            >
                <PanelHeader
                    icon={<Settings className="w-4 h-4 text-accent" strokeWidth={1.75} />}
                    title="Properties"
                    subtitle="Customize design"
                />
                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-5">
                    <PropertiesPanel
                        pageLayouts={pageLayouts}
                        onUpdatePageLayout={updatePageLayout}
                        professionalOptions={professionalOptions}
                        onUpdateProfessionalOptions={updateProfessionalOptions}
                    />
                </div>
            </aside>

            {/* Warm scrollbar palette — matches the editorial ink/line neutrals */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(var(--color-line-strong) / 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(var(--color-line-strong) / 0.9);
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgb(var(--color-line-strong) / 0.5) transparent;
                }
            `}</style>
        </div>
    )
}

/**
 * Shared header for both side panels. Small accent icon square + serif title
 * + muted subtitle. Kept local — the panels have no other consumers today.
 */
function PanelHeader({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode
    title: string
    subtitle: string
}) {
    return (
        <div className="p-5 border-b border-line flex-shrink-0 bg-surface/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-accent-soft/60 border border-accent/25 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h3 className="font-serif text-[15px] font-semibold text-ink leading-tight">
                        {title}
                    </h3>
                    <p className="text-[11px] text-ink-muted">{subtitle}</p>
                </div>
            </div>
        </div>
    )
}
