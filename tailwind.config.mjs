/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Fraunces", "Tinos", "Georgia", "serif"],
        display: ["Fraunces", "Tinos", "Georgia", "serif"],
        dmsans: ["DM Sans", "sans-serif"],
        tinos: ["Tinos", "serif"],
        "back-street": ["back-street"],
        "bastliga-one": ["bastliga-one"],
        "central-well": ["central-well"],
        corinthiago: ["corinthiago"],
        "whispering-signature": ["whispering-signature"],
        arial: ["arial"],
        helvetica: ["helvetica"],
        "helvetica-bold": ["helvetica-bold"],
      },
      screens: {
        mid: "1400px",
        "3xl": "1920px",
        "4xl": "2560px",
      },
      colors: {
        /* ─────────────────────────────────────────────────────────────
         * Mailix editorial semantic tokens
         * Resolve to CSS variables defined in styles.css (:root + .dark).
         * Prefer these over raw brand/surface scales in new code.
         * ───────────────────────────────────────────────────────────── */
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--color-ink-subtle) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--color-line) / <alpha-value>)",
          strong: "rgb(var(--color-line-strong) / <alpha-value>)",
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        ring: "rgb(var(--color-ring) / <alpha-value>)",

        primary: "rgba(var(--primary))",
        "primary-950": "rgba(var(--primary-950))",
        "primary-200": "rgba(var(--primary-200))",
        "primary-300": "rgba(var(--primary-300))",
        "primary-400": "rgba(var(--primary-400))",
        "primary-600": "rgba(var(--primary-600))",

        "grey-100": "rgba(var(--grey-100))",
        "grey-200": "rgba(var(--grey-200))",

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // Custom brand palette
        brand: {
          50: "#effefb",
          100: "#c8fff4",
          200: "#91feea",
          300: "#52f5dc",
          400: "#1edeca",
          500: "#0bbfae",
          600: "#069b90",
          700: "#0a7b74",
          800: "#0d615d",
          900: "#10504d",
          950: "#023130",
        },
        surface: {
          // Editorial semantic: bg-surface (cards/modals), bg-surface-sunken (hover/disabled)
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          sunken: "rgb(var(--color-surface-sunken) / <alpha-value>)",
          // Legacy slate scale — retained until per-screen refactors migrate off it
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        accent: {
          // Editorial semantic: bg-accent (brand vermillion), hover, soft-tinted bg
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          // Legacy orange scale — retained until per-screen refactors migrate off it
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
      backgroundImage: {
        "custom-gradient":
          "linear-gradient(95.1deg, #3357AA 0.6%, #BF1B39 101.33%)",
        "brand-gradient":
          "linear-gradient(135deg, #0a7b74 0%, #0bbfae 50%, #1edeca 100%)",
        "surface-gradient":
          "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      },
      boxShadow: {
        all: "0px 0px 9px 0px rgba(0, 0, 0, 0.14)",
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        float: "0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 60px -12px rgba(0, 0, 0, 0.2)",
        "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        "brand-sm": "0 1px 3px 0 rgba(11, 191, 174, 0.2), 0 1px 2px -1px rgba(11, 191, 174, 0.12)",
        "brand-md": "0 4px 16px -2px rgba(11, 191, 174, 0.2)",
      },
      height: {
        comments: "calc(100vh - 520px)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "progress-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "progress-bar": "progress-bar 1.5s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-reverse": "spin-reverse 1s linear infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
};

export default config;
