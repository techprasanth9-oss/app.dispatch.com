import { useRouter } from "@tanstack/react-router";
import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Mail,
  ArrowRight,
  Loader2,
  User,
  Building2,
  ChevronLeft,
  Check,
  PenTool,
  Users,
  Cable,
} from "lucide-react";
import { sendOtp, verifyOtp, register } from "../../services/authService";
import { useAuth } from "../../store/authContext";

type Mode = "signin" | "signup";
type Step = "form" | "otp";

/* ─── Text input with label above ─────────────────────────────────────────── */
interface TextInputProps {
  id: string;
  name: string;
  type: string;
  value: string;
  label: string;
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
}
const TextInput: React.FC<TextInputProps> = ({
  id, name, type, value, label, placeholder, onChange, disabled, error, icon, autoComplete, autoFocus,
}) => (
  <div>
    <label htmlFor={id} className="block text-[13px] font-medium text-ink mb-1.5">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">
          {icon}
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        className={[
          "w-full py-2.5 pr-3 bg-surface text-[14px] text-ink placeholder:text-ink-subtle",
          "rounded-md border transition-colors duration-150 focus:outline-none",
          icon ? "pl-10" : "pl-3",
          error
            ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
            : "border-line hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/20",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-[12px] text-error flex items-center gap-1.5">
        <span className="inline-block w-1 h-1 rounded-full bg-error" />
        {error}
      </p>
    )}
  </div>
);

/* ─── OTP 6-box input ─────────────────────────────────────────────────────── */
const OtpInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}> = ({ value, onChange, disabled, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-[13px] font-medium text-ink mb-1.5">
        Verification code
      </label>
      <div
        onClick={() => inputRef.current?.focus()}
        className={[
          "relative flex items-center justify-between gap-2 px-3 py-3 rounded-md border cursor-text bg-surface transition-colors",
          error ? "border-error" : "border-line hover:border-line-strong",
        ].join(" ")}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={[
              "flex-1 h-11 rounded flex items-center justify-center font-serif text-[20px] font-medium transition-colors",
              value[i]
                ? "bg-accent-soft text-ink border border-accent"
                : "bg-surface-sunken text-ink-subtle border border-line",
            ].join(" ")}
          >
            {value[i] || ""}
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={disabled}
          autoFocus
          className="absolute opacity-0 w-px h-px pointer-events-none"
        />
      </div>
      {error && (
        <p className="mt-1.5 text-[12px] text-error flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-error" />
          {error}
        </p>
      )}
    </div>
  );
};

/* ─── Inline error banner ─────────────────────────────────────────────────── */
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-md bg-error/5 border border-error/25 px-3 py-2.5">
    <p className="text-[12.5px] text-error font-medium flex items-start gap-2 m-0">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
      <span>{message}</span>
    </p>
  </div>
);

/* ─── Primary CTA ─────────────────────────────────────────────────────────── */
const SubmitBtn: React.FC<{
  label: string;
  isSubmitting: boolean;
  submitDone?: boolean;
  icon?: React.ReactNode;
}> = ({ label, isSubmitting, submitDone, icon }) => (
  <button
    type="submit"
    disabled={isSubmitting || submitDone}
    className={[
      "w-full h-11 px-4 rounded-md font-medium text-[14px] flex items-center justify-center gap-2 transition-colors",
      isSubmitting || submitDone
        ? "bg-surface-sunken text-ink-subtle cursor-not-allowed"
        : "bg-accent hover:bg-accent-hover text-white cursor-pointer",
    ].join(" ")}
  >
    {isSubmitting ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Please wait…</span>
      </>
    ) : submitDone ? (
      <>
        <Check className="w-4 h-4" />
        <span>Redirecting…</span>
      </>
    ) : (
      <>
        {icon}
        <span>{label}</span>
        <ArrowRight className="w-4 h-4" />
      </>
    )}
  </button>
);

/* ─── Brand wordmark ──────────────────────────────────────────────────────── */
const Wordmark: React.FC = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center">
      <Mail className="w-3.5 h-3.5 text-paper" strokeWidth={2.25} />
    </div>
    <span className="font-serif text-[20px] font-semibold text-ink tracking-tight leading-none">
      Mailix
    </span>
  </div>
);

/* ─── Below-card feature pitch — three real capabilities, no fluff ────────── */
const Feature: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="text-center sm:text-left">
    <div className="w-9 h-9 rounded-md bg-surface border border-line flex items-center justify-center text-accent mx-auto sm:mx-0 mb-3">
      {icon}
    </div>
    <p className="font-serif text-[15px] font-semibold text-ink leading-tight mb-1">{title}</p>
    <p className="text-[12.5px] text-ink-muted leading-relaxed">{body}</p>
  </div>
);

/* ─── Small email-template wireframes for the drifting background flock ───── */
type MiniVariant = "newsletter" | "twoCol" | "hero" | "minimal";

const MiniTemplate: React.FC<{ variant: MiniVariant }> = ({ variant }) => {
  const accent = "rgb(var(--color-accent))";
  switch (variant) {
    case "newsletter":
      return (
        <svg viewBox="0 0 68 88" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="66" height="86" rx="4" stroke="currentColor" strokeWidth="1" />
          <rect x="8" y="10" width="30" height="4" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="8" y="20" width="52" height="24" rx="2" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.4" fill="none" />
          <rect x="8" y="52" width="52" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="8" y="58" width="44" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="8" y="70" width="30" height="10" rx="2" fill={accent} opacity="0.72" />
        </svg>
      );
    case "twoCol":
      return (
        <svg viewBox="0 0 88 68" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="86" height="66" rx="4" stroke="currentColor" strokeWidth="1" />
          <rect x="8" y="8" width="30" height="4" rx="1" fill="currentColor" opacity="0.5" />
          <line x1="44" y1="20" x2="44" y2="60" stroke="currentColor" strokeWidth="0.7" opacity="0.35" />
          <rect x="8" y="22" width="28" height="30" rx="2" fill="currentColor" opacity="0.08" />
          <rect x="50" y="24" width="30" height="3" rx="1" fill="currentColor" opacity="0.4" />
          <rect x="50" y="30" width="26" height="3" rx="1" fill="currentColor" opacity="0.4" />
          <rect x="50" y="42" width="20" height="7" rx="1.5" fill={accent} opacity="0.7" />
        </svg>
      );
    case "hero":
      return (
        <svg viewBox="0 0 68 78" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="66" height="76" rx="4" stroke="currentColor" strokeWidth="1" />
          <rect x="1" y="1" width="66" height="30" rx="4" fill="currentColor" opacity="0.14" />
          <path d="M12 26 L26 16 L38 22 L54 12 L54 30 L12 30 Z" fill="currentColor" opacity="0.35" />
          <circle cx="46" cy="12" r="3" fill="currentColor" opacity="0.4" />
          <rect x="8" y="38" width="40" height="4" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="8" y="46" width="52" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="8" y="58" width="26" height="10" rx="2" fill={accent} opacity="0.72" />
        </svg>
      );
    case "minimal":
      return (
        <svg viewBox="0 0 56 78" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="54" height="76" rx="4" stroke="currentColor" strokeWidth="1" />
          <rect x="8" y="10" width="24" height="4" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="8" y="22" width="40" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="8" y="28" width="34" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="8" y="34" width="40" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="8" y="48" width="22" height="9" rx="2" fill={accent} opacity="0.65" />
        </svg>
      );
  }
};

/* ─── Editorial backdrop: paper grain + canvas grid + hero template + drifting layouts ── */
const EditorialBackdrop: React.FC = () => (
  <>
    {/* Radial spotlight behind the form card — pulls the eye centrally */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 720px 520px at 50% 55%, rgb(var(--color-surface) / 0.55) 0%, transparent 65%)",
        zIndex: 0,
      }}
    />

    {/* HERO email-template wireframe — bottom-right. The vermillion CTA is
        the visual anchor and reads immediately as "this is an email template". */}
    <div
      className="absolute pointer-events-none hidden md:block"
      style={{
        right: "-50px",
        bottom: "-50px",
        width: "480px",
        opacity: 0.11,
        zIndex: 0,
        color: "rgb(var(--color-ink))",
      }}
    >
      <svg viewBox="0 0 460 360" fill="none" aria-hidden="true">
        {/* Card frame */}
        <rect x="10" y="10" width="440" height="340" rx="8" stroke="currentColor" strokeWidth="1.5" />

        {/* Top header strip with logo placeholder */}
        <rect x="10" y="10" width="440" height="44" fill="currentColor" opacity="0.05" />
        <line x1="10" y1="54" x2="450" y2="54" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <rect x="28" y="26" width="72" height="10" rx="2" fill="currentColor" opacity="0.6" />

        {/* Image slot with mountain glyph */}
        <rect x="28" y="72" width="404" height="104" rx="4" fill="currentColor" opacity="0.04" />
        <rect x="28" y="72" width="404" height="104" rx="4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" fill="none" opacity="0.45" />
        <circle cx="118" cy="112" r="9" fill="currentColor" opacity="0.35" />
        <path d="M60 158 L140 108 L200 138 L260 118 L320 148 L400 118 L400 170 L60 170 Z" fill="currentColor" opacity="0.28" />

        {/* Headline */}
        <rect x="28" y="196" width="284" height="14" rx="2" fill="currentColor" opacity="0.65" />

        {/* Body text lines */}
        <rect x="28" y="222" width="380" height="6" rx="1" fill="currentColor" opacity="0.32" />
        <rect x="28" y="234" width="368" height="6" rx="1" fill="currentColor" opacity="0.32" />
        <rect x="28" y="246" width="220" height="6" rx="1" fill="currentColor" opacity="0.32" />

        {/* CTA — the vermillion anchor, wrapped in a subtle selection ring */}
        <rect x="24" y="268" width="156" height="48" rx="8" fill="rgb(var(--color-accent))" opacity="0.15" className="select-pulse" />
        <rect x="28" y="272" width="148" height="40" rx="6" fill="rgb(var(--color-accent))" opacity="0.9" />
        <rect x="62" y="288" width="80" height="8" rx="1" fill="rgb(var(--color-paper))" opacity="0.92" />

        {/* Footer */}
        <line x1="10" y1="326" x2="450" y2="326" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <rect x="28" y="336" width="28" height="4" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="64" y="336" width="28" height="4" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="100" y="336" width="28" height="4" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    </div>

    {/* Secondary template — top-left, rotated */}
    <div
      className="absolute pointer-events-none hidden lg:block"
      style={{
        left: "-40px",
        top: "72px",
        width: "200px",
        opacity: 0.09,
        zIndex: 0,
        color: "rgb(var(--color-ink))",
        transform: "rotate(-10deg)",
      }}
    >
      <MiniTemplate variant="hero" />
    </div>

    {/* Drifting mini-template flock */}
    <div
      className="absolute pointer-events-none mail-drift-1 hidden sm:block"
      style={{ top: "18%", left: "14%", width: "70px", color: "rgb(var(--color-ink))", opacity: 0.11, zIndex: 0 }}
    >
      <MiniTemplate variant="newsletter" />
    </div>
    <div
      className="absolute pointer-events-none mail-drift-2 hidden sm:block"
      style={{ top: "68%", left: "22%", width: "88px", color: "rgb(var(--color-ink))", opacity: 0.1, zIndex: 0 }}
    >
      <MiniTemplate variant="twoCol" />
    </div>
    <div
      className="absolute pointer-events-none mail-drift-3 hidden md:block"
      style={{ top: "20%", right: "16%", width: "64px", color: "rgb(var(--color-ink))", opacity: 0.1, zIndex: 0 }}
    >
      <MiniTemplate variant="minimal" />
    </div>
    <div
      className="absolute pointer-events-none mail-drift-4 hidden md:block"
      style={{ top: "58%", right: "8%", width: "60px", color: "rgb(var(--color-ink))", opacity: 0.09, zIndex: 0 }}
    >
      <MiniTemplate variant="hero" />
    </div>
  </>
);

/* ─── Main component ──────────────────────────────────────────────────────── */
const SignIn: React.FC = () => {
  const router = useRouter();
  const { bootstrap } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [regName, setRegName] = useState("");
  const [regWorkspace, setRegWorkspace] = useState("");
  // Handed out by the backend on OTP verify for new-user emails. Consumed by
  // register() immediately in signup mode — never leaves this component.
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Auto-submit once the 6-digit code is typed. Only fires on the OTP step.
  useEffect(() => {
    if (step === "otp" && otp.length === 6 && !isSubmitting) handleVerifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  /** Swap between sign-in and sign-up without losing typed email. */
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setStep("form");
    setErrors({});
    setOtp("");
    setRegistrationToken(null);
  };

  /** Form submit — mode-aware validation, then triggers OTP send. */
  const handleFormSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const errs: Record<string, string> = {};

    if (mode === "signup") {
      if (!regName.trim() || regName.trim().length < 2)
        errs.name = "Name must be at least 2 characters";
      if (!regWorkspace.trim() || regWorkspace.trim().length < 2)
        errs.workspace = "Workspace name must be at least 2 characters";
    }
    if (!email.trim()) errs.email = "Email address is required";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      errs.email = "Enter a valid email address";

    if (Object.keys(errs).length) return setErrors(errs);

    setErrors({});
    setIsSubmitting(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      setStep("otp");
      setResendCountdown(60);
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to send code" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Verify OTP. Behaviour branches on mode:
   *   - signin  →  existing user expected; error if verify returns isNewUser
   *   - signup  →  new user expected; on success we chain register() with
   *                the name/workspace we already collected in the form step.
   */
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return setErrors({ otp: "Enter the 6-digit code" });
    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otp);

      if (mode === "signin") {
        if (res.data.isNewUser) {
          setErrors({
            submit: `No Mailix account found for ${email}. Try signing up instead.`,
          });
          setOtp("");
          return;
        }
        await bootstrap();
        router.navigate({ to: "/templates" });
        return;
      }

      // signup mode
      if (!res.data.isNewUser) {
        setErrors({
          submit: `An account already exists for ${email}. Try signing in instead.`,
        });
        setOtp("");
        return;
      }
      const token = res.data.registrationToken;
      if (!token) {
        setErrors({ submit: "Something went wrong — please request a new code." });
        setOtp("");
        return;
      }
      setRegistrationToken(token);

      // Immediately register with the details we already collected in step 1
      await register(
        token,
        regName.trim(),
        email.trim().toLowerCase(),
        regWorkspace.trim(),
      );
      await bootstrap();
      setSubmitDone(true);
      await new Promise((r) => setTimeout(r, 300));
      router.navigate({ to: "/onboarding" });
    } catch (err: any) {
      setErrors({ otp: err.message || "Invalid code" });
      setOtp("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardMeta =
    step === "otp"
      ? {
          title: "Check your email",
          subtitle: (
            <>
              We sent a 6-digit code to <span className="text-ink font-medium">{email}</span>.
            </>
          ),
        }
      : mode === "signin"
        ? {
            title: "Welcome back",
            subtitle: "Sign in with a one-time code — no password needed.",
          }
        : {
            title: "Create your account",
            subtitle: "Set up your workspace in under a minute.",
          };

  return (
    <div className="paper-grain canvas-grid min-h-screen bg-paper flex flex-col relative overflow-hidden">
      {/* Editorial decor sits behind everything; kept in its own layer so the
          form and header stay visually crisp on top. */}
      <EditorialBackdrop />

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
        <Wordmark />
        <a
          href="mailto:hello@mailix.io"
          className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Contact sales
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* ── Centered form ──────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-6 sm:py-8">
        <div className="w-full max-w-[760px] flex flex-col items-center">
          {/* Card column — width matches original 400px card */}
          <div className="w-full max-w-[400px]">
            {/* Small tagline above card — sets the tone without shouting */}
            <p className="text-center text-[12px] text-ink-muted uppercase tracking-[0.14em] mb-6">
              The email design platform for teams that ship
            </p>

            <div
              className="rounded-xl px-7 py-8 sm:px-8 sm:py-9 border border-line/80 backdrop-blur-xl"
            style={{
              background: "rgb(var(--color-surface) / 0.82)",
              boxShadow:
                "0 20px 60px -24px rgba(20, 20, 20, 0.18), 0 2px 6px -2px rgba(20, 20, 20, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
            }}
          >
            {/* Tab bar — visible on the form step; hidden on OTP so it doesn't
                compete with the Back button + verify flow. */}
            {step === "form" && (
              <div
                role="tablist"
                aria-label="Sign in or sign up"
                className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-surface-sunken/60 border border-line"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => switchMode("signin")}
                  className={[
                    "h-8 rounded-md text-[13px] font-medium transition-colors",
                    mode === "signin"
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink",
                  ].join(" ")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => switchMode("signup")}
                  className={[
                    "h-8 rounded-md text-[13px] font-medium transition-colors",
                    mode === "signup"
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink",
                  ].join(" ")}
                >
                  Sign up
                </button>
              </div>
            )}

            {step === "otp" && (
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setErrors({});
                  setOtp("");
                }}
                className="flex items-center gap-1 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors mb-5 -ml-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <div className="mb-6">
              <h1 className="font-serif text-[26px] font-semibold text-ink tracking-tight leading-tight mb-1.5">
                {cardMeta.title}
              </h1>
              <p className="text-[13.5px] text-ink-muted leading-relaxed">
                {cardMeta.subtitle}
              </p>
            </div>

            {step === "form" && (
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <>
                    <TextInput
                      id="regName"
                      name="regName"
                      type="text"
                      value={regName}
                      label="Full name"
                      placeholder="Jane Doe"
                      onChange={setRegName}
                      disabled={isSubmitting}
                      error={errors.name}
                      icon={<User className="w-4 h-4" />}
                      autoComplete="name"
                      autoFocus
                    />
                  </>
                )}
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  label="Work email"
                  placeholder="you@company.com"
                  onChange={setEmail}
                  disabled={isSubmitting}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  autoFocus={mode === "signin"}
                />
                {mode === "signup" && (
                  <TextInput
                    id="regWorkspace"
                    name="regWorkspace"
                    type="text"
                    value={regWorkspace}
                    label="Workspace name"
                    placeholder="e.g. Acme Corp"
                    onChange={setRegWorkspace}
                    disabled={isSubmitting}
                    error={errors.workspace}
                    icon={<Building2 className="w-4 h-4" />}
                    autoComplete="organization"
                  />
                )}
                {errors.submit && <ErrorBanner message={errors.submit} />}
                <SubmitBtn
                  label={mode === "signin" ? "Send sign-in code" : "Send code & continue"}
                  isSubmitting={isSubmitting}
                />
                <p className="text-center text-[12.5px] text-ink-muted mt-1">
                  {mode === "signin" ? (
                    <>
                      New to Mailix?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className="text-accent hover:text-accent-hover font-medium"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className="text-accent hover:text-accent-hover font-medium"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}

            {step === "otp" && (
              <div className="flex flex-col gap-4">
                <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} error={errors.otp} />
                {isSubmitting && (
                  <div className="flex items-center justify-center gap-2 text-[13px] text-ink-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {submitDone ? "Setting up your workspace…" : "Verifying…"}
                  </div>
                )}
                {errors.submit && <ErrorBanner message={errors.submit} />}
                <div className="text-center pt-1">
                  {resendCountdown > 0 ? (
                    <span className="text-[12.5px] text-ink-subtle">
                      Resend code in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOtp("");
                        handleFormSubmit();
                      }}
                      className="text-[12.5px] font-medium text-accent hover:text-accent-hover transition-colors"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-7 pt-5 border-t border-line">
              <p className="text-center text-[12px] text-ink-subtle leading-relaxed">
                No passwords. Codes expire in 10 minutes.
              </p>
            </div>
          </div>

            <p className="text-center text-[11.5px] text-ink-subtle mt-5">
              By continuing you agree to Mailix's Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* ── Feature strip below the card ─────────────────────────────
              Three real capabilities. Fills the vertical space with
              product content instead of empty page. */}
          <div className="w-full max-w-[720px] mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <Feature
              icon={<PenTool className="w-4 h-4" strokeWidth={1.75} />}
              title="Design faster"
              body="Drag-drop or code — both editors, one workspace, instant preview."
            />
            <Feature
              icon={<Users className="w-4 h-4" strokeWidth={1.75} />}
              title="Ship as a team"
              body="Workspaces, roles, and an audit trail your admins will love."
            />
            <Feature
              icon={<Cable className="w-4 h-4" strokeWidth={1.75} />}
              title="Send anywhere"
              body="Bring Brevo, Resend, SendGrid, or SES — your delivery, your rules."
            />
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between text-[11.5px] text-ink-subtle">
        <span>© {new Date().getFullYear()} Mailix</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-ink transition-colors">Status</a>
          <a href="#" className="hover:text-ink transition-colors">Docs</a>
          <a href="#" className="hover:text-ink transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default SignIn;
