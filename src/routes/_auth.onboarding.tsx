import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
    Mail,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Upload,
    Trash2,
    User as UserIcon,
    Building2,
    UsersRound,
    Sparkles,
    AlertTriangle,
    Plus,
    X,
    SkipForward,
} from 'lucide-react'
import { useAuth } from '../store/authContext'
import { updateMe } from '../services/authService'
import { updateWorkspace, inviteMember } from '../services/workspaceService'
import { INDUSTRIES, COMPANY_SIZES, USE_CASES } from '../lib/constants'

/**
 * /onboarding — 3-step wizard shown right after signup.
 *
 *   1. About you       — avatar · job title · phone
 *   2. Your workspace  — name · logo · website · industry · size · use cases
 *   3. Invite team     — optional email invites, skippable
 *
 * Progress is committed to the backend at the end of each step so a
 * disconnected user doesn't lose entered data. The final step sets
 * `onboardedAt` on the user so future logins skip the wizard.
 */

type Step = 1 | 2 | 3

const MAX_IMAGE_BYTES = 200 * 1024

// ── Small primitives — kept local to this file since they're not reused ──

function Wordmark() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-paper" strokeWidth={2.25} />
            </div>
            <span className="font-serif text-[20px] font-semibold text-ink tracking-tight leading-none">
                Mailix
            </span>
        </div>
    )
}

function Field({
    label,
    hint,
    optional,
    children,
}: {
    label: string
    hint?: string
    optional?: boolean
    children: React.ReactNode
}) {
    return (
        <label className="block">
            <span className="flex items-baseline justify-between mb-1.5">
                <span className="text-[12.5px] font-medium text-ink">{label}</span>
                {optional && (
                    <span className="text-[10.5px] text-ink-subtle uppercase tracking-wide">
                        Optional
                    </span>
                )}
            </span>
            {children}
            {hint && <p className="mt-1 text-[11.5px] text-ink-subtle">{hint}</p>}
        </label>
    )
}

const inputClass =
    'w-full h-10 px-3 bg-surface border border-line rounded-md text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 hover:border-line-strong transition-colors'
const selectClass =
    inputClass +
    " appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B6560%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_12px_center]"

// ── Wizard component ────────────────────────────────────────────────────

function Onboarding() {
    const router = useRouter()
    const { user, workspace, bootstrap, isLoading } = useAuth()

    const [step, setStep] = useState<Step>(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Step 1 — About you
    const [avatar, setAvatar] = useState<string | null>(null)
    const [jobTitle, setJobTitle] = useState('')
    const [phone, setPhone] = useState('')
    const [timezone, setTimezone] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    // Step 2 — Workspace
    const [wsName, setWsName] = useState('')
    const [logo, setLogo] = useState<string | null>(null)
    const [website, setWebsite] = useState('')
    const [description, setDescription] = useState('')
    const [industry, setIndustry] = useState<string>('')
    const [companySize, setCompanySize] = useState<string>('')
    const [useCases, setUseCases] = useState<string[]>([])
    const logoFileRef = useRef<HTMLInputElement>(null)

    // Step 3 — Invites
    const [invites, setInvites] = useState<{ email: string; role: 'admin' | 'manager' }[]>([
        { email: '', role: 'manager' },
    ])

    // Hydrate whatever might already be on the user/workspace (survives refresh)
    useEffect(() => {
        if (user) {
            setAvatar(user.avatar ?? null)
            setJobTitle(user.jobTitle ?? '')
            setPhone(user.phone ?? '')
            setTimezone(
                user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
            )
        }
        if (workspace) {
            setWsName(workspace.name ?? '')
            setLogo(workspace.logo ?? null)
            setWebsite(workspace.website ?? '')
            setDescription(workspace.description ?? '')
            setIndustry(workspace.industry ?? '')
            setCompanySize(workspace.companySize ?? '')
            setUseCases(workspace.useCases ?? [])
        }
    }, [user, workspace])

    // Skip the wizard if the user already onboarded (arrived via direct link)
    useEffect(() => {
        if (!isLoading && user?.onboardedAt) {
            router.navigate({ to: '/templates' })
        }
    }, [isLoading, user, router])

    if (isLoading) return <div className="min-h-screen bg-paper" />

    // ── File upload helper ─────────────────────────────────────────
    function handleFile(files: FileList | null, setter: (v: string) => void) {
        const file = files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setError('Please choose an image (PNG, JPG, WEBP).')
            return
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setError(`Too large (${(file.size / 1024).toFixed(0)} KB). Max 200 KB.`)
            return
        }
        setError(null)
        const reader = new FileReader()
        reader.onload = () => setter(String(reader.result ?? ''))
        reader.readAsDataURL(file)
    }

    const toggleUseCase = (v: string) => {
        setUseCases((prev) =>
            prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
        )
    }

    // ── Step submissions ───────────────────────────────────────────
    async function submitStep1() {
        setSaving(true)
        setError(null)
        try {
            await updateMe({
                avatar,
                jobTitle: jobTitle.trim() || null,
                phone: phone.trim() || null,
                timezone: timezone.trim() || null,
            })
            setStep(2)
        } catch (err: any) {
            setError(err?.message ?? 'Could not save profile.')
        } finally {
            setSaving(false)
        }
    }

    async function submitStep2() {
        if (!workspace) {
            setError('No active workspace.')
            return
        }
        if (wsName.trim().length < 2) {
            setError('Workspace name must be at least 2 characters.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            await updateWorkspace(workspace._id, {
                name: wsName.trim(),
                logo,
                website: website.trim() || null,
                description: description.trim() || null,
                industry: industry || null,
                companySize: companySize || null,
                useCases,
            })
            await bootstrap()
            setStep(3)
        } catch (err: any) {
            setError(err?.message ?? 'Could not save workspace.')
        } finally {
            setSaving(false)
        }
    }

    async function submitStep3(withInvites: boolean) {
        setSaving(true)
        setError(null)
        try {
            if (withInvites && workspace) {
                const valid = invites
                    .filter((i) => /^\S+@\S+\.\S+$/.test(i.email.trim()))
                    .map((i) => ({ email: i.email.trim().toLowerCase(), role: i.role }))
                // Fire in parallel; ignore individual failures — user sees a summary
                const results = await Promise.allSettled(
                    valid.map((v) => inviteMember(workspace._id, v.email, v.role)),
                )
                const failed = results.filter((r) => r.status === 'rejected').length
                if (failed > 0 && failed === valid.length) {
                    // All failed — surface the first error
                    const first = results.find((r) => r.status === 'rejected') as
                        | PromiseRejectedResult
                        | undefined
                    throw new Error(first?.reason?.message ?? 'Invites failed to send.')
                }
            }
            // Mark onboarding complete
            await updateMe({ onboardedAt: new Date().toISOString() })
            await bootstrap()
            router.navigate({ to: '/templates' })
        } catch (err: any) {
            setError(err?.message ?? 'Could not finish setup.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-paper flex flex-col paper-grain relative overflow-hidden">
            {/* faint radial spotlight — matches SignIn */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 780px 560px at 50% 45%, rgb(var(--color-surface) / 0.6) 0%, transparent 65%)',
                    zIndex: 0,
                }}
            />

            {/* Top bar */}
            <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
                <Wordmark />
                <span className="text-[12px] text-ink-muted uppercase tracking-[0.14em]">
                    Getting started
                </span>
            </header>

            {/* Main card */}
            <main className="relative z-10 flex-1 flex items-start justify-center px-6 py-6 sm:py-8">
                <div className="w-full max-w-[560px]">
                    <StepIndicator step={step} />

                    <div
                        className="rounded-xl px-7 py-8 sm:px-9 sm:py-9 border border-line/80 backdrop-blur-xl mt-6"
                        style={{
                            background: 'rgb(var(--color-surface) / 0.85)',
                            boxShadow:
                                '0 20px 60px -24px rgba(20, 20, 20, 0.18), 0 2px 6px -2px rgba(20, 20, 20, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                        }}
                    >
                        {step === 1 && (
                            <Step1
                                firstName={user?.name?.split(' ')[0] ?? 'there'}
                                avatar={avatar}
                                setAvatar={setAvatar}
                                jobTitle={jobTitle}
                                setJobTitle={setJobTitle}
                                phone={phone}
                                setPhone={setPhone}
                                timezone={timezone}
                                setTimezone={setTimezone}
                                onPickFile={() => fileRef.current?.click()}
                                fileRef={fileRef}
                                onFile={(files) => handleFile(files, setAvatar)}
                                initials={initialsOf(user?.name ?? user?.email ?? '?')}
                            />
                        )}
                        {step === 2 && (
                            <Step2
                                wsName={wsName}
                                setWsName={setWsName}
                                logo={logo}
                                setLogo={setLogo}
                                website={website}
                                setWebsite={setWebsite}
                                description={description}
                                setDescription={setDescription}
                                industry={industry}
                                setIndustry={setIndustry}
                                companySize={companySize}
                                setCompanySize={setCompanySize}
                                useCases={useCases}
                                toggleUseCase={toggleUseCase}
                                onPickLogo={() => logoFileRef.current?.click()}
                                logoFileRef={logoFileRef}
                                onLogoFile={(files) => handleFile(files, setLogo)}
                            />
                        )}
                        {step === 3 && (
                            <Step3
                                invites={invites}
                                setInvites={setInvites}
                                workspaceName={wsName || workspace?.name || 'your workspace'}
                            />
                        )}

                        {error && (
                            <div className="mt-4 px-3 py-2 rounded-md bg-error/5 border border-error/25 flex items-start gap-2">
                                <AlertTriangle
                                    className="w-3.5 h-3.5 text-error flex-shrink-0 mt-0.5"
                                    strokeWidth={2}
                                />
                                <p className="text-[12.5px] text-error">{error}</p>
                            </div>
                        )}

                        <StepFooter
                            step={step}
                            saving={saving}
                            onBack={() => {
                                setError(null)
                                setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
                            }}
                            onNext={() => {
                                if (step === 1) submitStep1()
                                else if (step === 2) submitStep2()
                                else submitStep3(true)
                            }}
                            onSkip={step === 3 ? () => submitStep3(false) : undefined}
                        />
                    </div>

                    <p className="text-center text-[11.5px] text-ink-subtle mt-5">
                        You can edit everything later in Settings.
                    </p>
                </div>
            </main>
        </div>
    )
}

// ── Step indicator ─────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
    const steps = [
        { n: 1, label: 'About you' },
        { n: 2, label: 'Workspace' },
        { n: 3, label: 'Invite team' },
    ]
    return (
        <div className="flex items-center gap-2 justify-center">
            {steps.map((s, i) => {
                const active = step === s.n
                const done = step > s.n
                return (
                    <div key={s.n} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div
                                className={[
                                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-colors',
                                    done
                                        ? 'bg-accent border-accent text-white'
                                        : active
                                            ? 'bg-surface border-accent text-accent'
                                            : 'bg-surface border-line text-ink-subtle',
                                ].join(' ')}
                            >
                                {done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : s.n}
                            </div>
                            <span
                                className={[
                                    'text-[12px] font-medium hidden sm:inline',
                                    active ? 'text-ink' : 'text-ink-muted',
                                ].join(' ')}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={[
                                    'w-8 sm:w-10 h-px transition-colors',
                                    done ? 'bg-accent' : 'bg-line',
                                ].join(' ')}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Footer with Back / Next ────────────────────────────────────────────

function StepFooter({
    step,
    saving,
    onBack,
    onNext,
    onSkip,
}: {
    step: Step
    saving: boolean
    onBack: () => void
    onNext: () => void
    onSkip?: () => void
}) {
    return (
        <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-line">
            {step > 1 ? (
                <button
                    type="button"
                    onClick={onBack}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-ink-muted hover:text-ink hover:bg-surface-sunken/60 text-[13px] font-medium transition-colors disabled:opacity-50"
                >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Back
                </button>
            ) : (
                <span />
            )}

            <div className="flex items-center gap-2">
                {onSkip && (
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-ink-muted hover:text-ink hover:bg-surface-sunken/60 text-[13px] font-medium transition-colors disabled:opacity-50"
                    >
                        <SkipForward className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Skip for now
                    </button>
                )}
                <button
                    type="button"
                    onClick={onNext}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 h-10 px-4 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-[13.5px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                            Saving…
                        </>
                    ) : step === 3 ? (
                        <>
                            <Check className="w-4 h-4" strokeWidth={2.25} />
                            Finish setup
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

// ── Step 1 — About you ────────────────────────────────────────────────

function Step1(props: {
    firstName: string
    avatar: string | null
    setAvatar: (v: string | null) => void
    jobTitle: string
    setJobTitle: (v: string) => void
    phone: string
    setPhone: (v: string) => void
    timezone: string
    setTimezone: (v: string) => void
    onPickFile: () => void
    fileRef: React.RefObject<HTMLInputElement>
    onFile: (files: FileList | null) => void
    initials: string
}) {
    const timezones = useMemo(() => getTimezones(), [])

    return (
        <>
            <StepHeader
                icon={<UserIcon className="w-4 h-4" strokeWidth={1.75} />}
                title={`Welcome, ${props.firstName}.`}
                subtitle="A few details help teammates know who they're collaborating with."
            />

            <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-sunken border border-line flex items-center justify-center flex-shrink-0">
                    {props.avatar ? (
                        <img src={props.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-serif text-[22px] font-semibold text-ink-muted">
                            {props.initials || <UserIcon className="w-7 h-7" />}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            ref={props.fileRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => props.onFile(e.target.files)}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={props.onPickFile}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-line hover:border-line-strong text-ink font-medium text-[13px] transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Upload photo
                        </button>
                        {props.avatar && (
                            <button
                                type="button"
                                onClick={() => props.setAvatar(null)}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-ink-muted hover:text-error hover:bg-error/5 font-medium text-[13px] transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                Remove
                            </button>
                        )}
                    </div>
                    <p className="text-[11.5px] text-ink-subtle">PNG or JPG, up to 200 KB.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Job title" optional>
                    <input
                        type="text"
                        value={props.jobTitle}
                        onChange={(e) => props.setJobTitle(e.target.value)}
                        placeholder="Founder"
                        className={inputClass}
                    />
                </Field>
                <Field label="Phone" optional>
                    <input
                        type="tel"
                        value={props.phone}
                        onChange={(e) => props.setPhone(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className={inputClass}
                    />
                </Field>
                <Field label="Time zone" optional hint="We auto-detected from your browser.">
                    <select
                        value={props.timezone}
                        onChange={(e) => props.setTimezone(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">— Not set —</option>
                        {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                                {tz}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
        </>
    )
}

// ── Step 2 — Workspace ────────────────────────────────────────────────

function Step2(props: {
    wsName: string
    setWsName: (v: string) => void
    logo: string | null
    setLogo: (v: string | null) => void
    website: string
    setWebsite: (v: string) => void
    description: string
    setDescription: (v: string) => void
    industry: string
    setIndustry: (v: string) => void
    companySize: string
    setCompanySize: (v: string) => void
    useCases: string[]
    toggleUseCase: (v: string) => void
    onPickLogo: () => void
    logoFileRef: React.RefObject<HTMLInputElement>
    onLogoFile: (files: FileList | null) => void
}) {
    return (
        <>
            <StepHeader
                icon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
                title="About your workspace"
                subtitle="Helps us tailor templates and defaults to your team."
            />

            {/* Logo + name row */}
            <div className="flex items-start gap-5 mb-5">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-surface-sunken border border-line flex items-center justify-center flex-shrink-0">
                    {props.logo ? (
                        <img src={props.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="w-6 h-6 text-ink-muted" strokeWidth={1.5} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <Field label="Workspace name">
                        <input
                            type="text"
                            value={props.wsName}
                            onChange={(e) => props.setWsName(e.target.value)}
                            placeholder="Acme Corp"
                            className={inputClass}
                            autoFocus
                        />
                    </Field>
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            ref={props.logoFileRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={(e) => props.onLogoFile(e.target.files)}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={props.onPickLogo}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-surface border border-line hover:border-line-strong text-ink font-medium text-[12px] transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                            {props.logo ? 'Replace logo' : 'Upload logo'}
                        </button>
                        {props.logo && (
                            <button
                                type="button"
                                onClick={() => props.setLogo(null)}
                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-ink-muted hover:text-error hover:bg-error/5 font-medium text-[12px] transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-5">
                <Field label="Website" optional>
                    <input
                        type="url"
                        value={props.website}
                        onChange={(e) => props.setWebsite(e.target.value)}
                        placeholder="https://acme.com"
                        className={inputClass}
                    />
                </Field>
                <Field label="Industry" optional>
                    <select
                        value={props.industry}
                        onChange={(e) => props.setIndustry(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">— Choose —</option>
                        {INDUSTRIES.map((i) => (
                            <option key={i.value} value={i.value}>
                                {i.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Team size" optional>
                    <select
                        value={props.companySize}
                        onChange={(e) => props.setCompanySize(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">— Choose —</option>
                        {COMPANY_SIZES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="One-line description" optional>
                    <input
                        type="text"
                        value={props.description}
                        onChange={(e) => props.setDescription(e.target.value)}
                        placeholder="What does your team do?"
                        className={inputClass}
                        maxLength={140}
                    />
                </Field>
            </div>

            <div>
                <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[12.5px] font-medium text-ink">What will you use Mailix for?</span>
                    <span className="text-[10.5px] text-ink-subtle uppercase tracking-wide">
                        Pick any
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {USE_CASES.map((uc) => {
                        const selected = props.useCases.includes(uc.value)
                        return (
                            <button
                                key={uc.value}
                                type="button"
                                onClick={() => props.toggleUseCase(uc.value)}
                                className={[
                                    'flex items-start gap-2.5 p-3 rounded-md border text-left transition-colors',
                                    selected
                                        ? 'border-accent bg-accent-soft/50 text-ink'
                                        : 'border-line bg-surface hover:border-line-strong',
                                ].join(' ')}
                            >
                                <div
                                    className={[
                                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                                        selected
                                            ? 'bg-accent border-accent'
                                            : 'bg-surface border-line',
                                    ].join(' ')}
                                >
                                    {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-ink">{uc.label}</p>
                                    <p className="text-[11.5px] text-ink-muted leading-snug">
                                        {uc.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

// ── Step 3 — Invite team ──────────────────────────────────────────────

function Step3({
    invites,
    setInvites,
    workspaceName,
}: {
    invites: { email: string; role: 'admin' | 'manager' }[]
    setInvites: React.Dispatch<
        React.SetStateAction<{ email: string; role: 'admin' | 'manager' }[]>
    >
    workspaceName: string
}) {
    const addRow = () => setInvites((prev) => [...prev, { email: '', role: 'manager' }])
    const removeRow = (i: number) =>
        setInvites((prev) => (prev.length > 1 ? prev.filter((_, x) => x !== i) : prev))
    const updateRow = (i: number, patch: Partial<{ email: string; role: 'admin' | 'manager' }>) =>
        setInvites((prev) => prev.map((r, x) => (x === i ? { ...r, ...patch } : r)))

    return (
        <>
            <StepHeader
                icon={<UsersRound className="w-4 h-4" strokeWidth={1.75} />}
                title="Bring your team"
                subtitle={`Invite teammates to ${workspaceName}. Skip if you'd rather do it later — you can always add them from Settings.`}
            />

            <div className="space-y-2 mb-3">
                {invites.map((inv, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2">
                        <input
                            type="email"
                            value={inv.email}
                            onChange={(e) => updateRow(i, { email: e.target.value })}
                            placeholder="teammate@company.com"
                            className={inputClass}
                        />
                        <select
                            value={inv.role}
                            onChange={(e) =>
                                updateRow(i, { role: e.target.value as 'admin' | 'manager' })
                            }
                            className={selectClass}
                        >
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => removeRow(i)}
                            disabled={invites.length <= 1}
                            className="w-10 h-10 flex items-center justify-center text-ink-muted hover:text-error hover:bg-error/5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Remove"
                        >
                            <X className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-surface border border-dashed border-line hover:border-line-strong text-ink-muted hover:text-ink font-medium text-[13px] transition-colors"
            >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Add another
            </button>

            <div className="mt-5 p-3.5 rounded-md bg-accent-soft/40 border border-accent/25 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-[12.5px] text-ink leading-relaxed">
                    Invited teammates get a link to accept. Managers can edit templates; Admins can also invite and manage the workspace.
                </p>
            </div>
        </>
    )
}

// ── Step header ────────────────────────────────────────────────────────

function StepHeader({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode
    title: string
    subtitle: string
}) {
    return (
        <div className="mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-soft/60 border border-accent/25 flex items-center justify-center text-accent mb-4">
                {icon}
            </div>
            <h1 className="font-serif text-[26px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
                {title}
            </h1>
            <p className="text-[13.5px] text-ink-muted leading-relaxed">{subtitle}</p>
        </div>
    )
}

// ── Helpers ────────────────────────────────────────────────────────────

function initialsOf(source: string): string {
    return source
        .split(' ')
        .map((s) => s.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

function getTimezones(): string[] {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (Intl as any).supportedValuesOf?.('timeZone') as string[] | undefined
        if (list && list.length) return list
    } catch {}
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

export const Route = createFileRoute('/_auth/onboarding')({
    component: Onboarding,
})
