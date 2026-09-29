import React, { useState } from 'react'
import { X, AlertTriangle, Info } from 'lucide-react'

interface ImportHtmlDialogProps {
    isOpen: boolean
    onClose: () => void
    onImport: (htmlString: string) => void
    builderMode: 'editorjs' | 'dragdrop'
}

export default function ImportHtmlDialog({
    isOpen,
    onClose,
    onImport,
    builderMode,
}: ImportHtmlDialogProps) {
    const [htmlString, setHtmlString] = useState('')
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleImport = () => {
        if (!htmlString.trim()) {
            setError('Please paste some HTML content')
            return
        }
        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(htmlString, 'text/html')
            if (doc.querySelector('parsererror')) {
                setError('Invalid HTML format. Please check your HTML and try again.')
                return
            }
            setError(null)
            onImport(htmlString)
            setHtmlString('')
            onClose()
        } catch {
            setError('Failed to parse HTML. Please check the format and try again.')
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData('text')
        if (pastedText) {
            setHtmlString(pastedText)
            setError(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <div className="bg-surface rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
                    <div>
                        <h3 className="font-serif text-[16px] font-semibold text-ink tracking-tight">
                            Import HTML
                        </h3>
                        <p className="text-[12px] text-ink-muted mt-0.5">
                            Paste your HTML code. Tables become columns, and divs become containers.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mb-4">
                        <label className="block text-[12.5px] font-medium text-ink mb-2">
                            HTML code
                        </label>
                        <textarea
                            value={htmlString}
                            onChange={(e) => {
                                setHtmlString(e.target.value)
                                setError(null)
                            }}
                            onPaste={handlePaste}
                            placeholder={
                                'Paste your HTML code here…\n\nExample:\n<table>\n  <tr>\n    <td>Column 1</td>\n    <td>Column 2</td>\n  </tr>\n</table>'
                            }
                            className="w-full h-80 p-4 border border-line rounded-md font-mono text-[13px] bg-surface text-ink focus:ring-2 focus:ring-accent/15 focus:border-accent focus:outline-none hover:border-line-strong resize-none placeholder:text-ink-subtle transition-colors"
                        />
                        {error && (
                            <p className="mt-2 text-[12.5px] text-error flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="bg-accent-soft/40 border border-accent/25 rounded-md p-4">
                        <h4 className="text-[13px] font-semibold text-ink mb-2 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
                            How it works
                        </h4>
                        <ul className="text-[12.5px] text-ink-muted space-y-1 list-disc list-inside leading-relaxed">
                            <li>Tables (&lt;table&gt;, &lt;tr&gt;) become column layouts</li>
                            <li>Divs with multiple children become containers</li>
                            <li>Styles and formatting are preserved</li>
                            <li>
                                Imports into the{' '}
                                <strong className="text-ink">
                                    {builderMode === 'editorjs' ? 'EditorJS' : 'Drag &amp; Drop'}
                                </strong>{' '}
                                builder
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="h-9 px-3 bg-surface border border-line hover:border-line-strong text-ink rounded-md font-medium text-[13px] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        className="h-9 px-4 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13px] transition-colors"
                    >
                        Import HTML
                    </button>
                </div>
            </div>
        </div>
    )
}
