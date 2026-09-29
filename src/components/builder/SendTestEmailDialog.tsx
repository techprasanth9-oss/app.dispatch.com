import React, { useState } from 'react'
import { Send, Loader2, X, AlertTriangle, Mail } from 'lucide-react'

interface SendTestEmailDialogProps {
    isOpen: boolean
    onClose: () => void
    onSend: (email: string, subject: string) => Promise<void>
}

/**
 * Dialog that collects recipients + subject and hands them to onSend,
 * which is wired to the backend /workspaces/:wsId/templates/test-send
 * endpoint via BuilderPage.
 */
export default function SendTestEmailDialog({
    isOpen,
    onClose,
    onSend,
}: SendTestEmailDialogProps) {
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('Test email from Mailix')
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            setError('Please enter an email address')
            return
        }

        setError(null)
        setIsSending(true)

        try {
            await onSend(email, subject)
            onClose()
            setEmail('')
        } catch (err: any) {
            setError(err?.message || 'Failed to send email')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <div className="bg-surface rounded-xl max-w-md w-full border border-line shadow-[0_24px_60px_-24px_rgba(20,20,20,0.25)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-accent-soft/60 border border-accent/25 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-accent" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h3 className="font-serif text-[15px] font-semibold text-ink tracking-tight leading-tight">
                                Send test email
                            </h3>
                            <p className="text-[11.5px] text-ink-muted">
                                Preview delivery in a real inbox
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken/60 rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                            Recipients
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-10 px-3 border border-line rounded-md bg-surface text-[13.5px] text-ink placeholder:text-ink-subtle focus:ring-2 focus:ring-accent/15 focus:border-accent hover:border-line-strong outline-none transition-colors"
                            placeholder="you@example.com, teammate@example.com"
                            autoFocus
                        />
                        <p className="mt-1 text-[11.5px] text-ink-subtle">
                            Separate multiple emails with commas.
                        </p>
                    </div>

                    <div>
                        <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full h-10 px-3 border border-line rounded-md bg-surface text-[13.5px] text-ink placeholder:text-ink-subtle focus:ring-2 focus:ring-accent/15 focus:border-accent hover:border-line-strong outline-none transition-colors"
                            placeholder="Test email"
                        />
                        <p className="mt-1 text-[11.5px] text-ink-subtle">
                            We prepend <span className="font-mono">[Test]</span> automatically.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-error/5 border border-error/25 flex items-start gap-2">
                            <AlertTriangle
                                className="w-3.5 h-3.5 text-error flex-shrink-0 mt-0.5"
                                strokeWidth={2}
                            />
                            <p className="text-[12.5px] text-error leading-relaxed">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-3 bg-surface border border-line hover:border-line-strong text-ink rounded-md font-medium text-[13px] transition-colors disabled:opacity-50"
                            disabled={isSending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="flex items-center gap-1.5 h-9 px-4 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    Send test
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
