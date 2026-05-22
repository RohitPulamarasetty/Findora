import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Container follows docs: centered, padded, max 1280px
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      // ── Colors ──────────────────────────────────────────────────
      colors: {
        // shadcn/ui HSL tokens — required for all shadcn primitives
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Findora brand palette — rgb(channels / alpha) enables /opacity modifier
        brand: {
          50: "rgb(var(--color-brand-50)  / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)",
        },

        // Accent palette (Plasma Violet)
        accentc: {
          300: "rgb(var(--color-accent-300) / <alpha-value>)",
          400: "rgb(var(--color-accent-400) / <alpha-value>)",
          500: "rgb(var(--color-accent-500) / <alpha-value>)",
          600: "rgb(var(--color-accent-600) / <alpha-value>)",
          700: "rgb(var(--color-accent-700) / <alpha-value>)",
        },

        // Spark palette (Neo Cyan)
        spark: {
          400: "rgb(var(--color-spark-400) / <alpha-value>)",
          500: "rgb(var(--color-spark-500) / <alpha-value>)",
          600: "rgb(var(--color-spark-600) / <alpha-value>)",
        },

        // Surface tokens
        "bg-base": "rgb(var(--color-bg) / <alpha-value>)",
        "bg-subtle": "rgb(var(--color-bg-subtle) / <alpha-value>)",
        "bg-muted-surface": "rgb(var(--color-bg-muted) / <alpha-value>)",

        // Text tokens
        "text-base": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-secondary-fg": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-muted-fg": "rgb(var(--color-text-muted) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        "text-inverted": "rgb(var(--color-text-inverted) / <alpha-value>)",

        // Border tokens
        "border-default": "rgb(var(--color-border) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",

        // Item status semantic colors (UI_UX_GUIDELINES §2 — Semantic)
        status: {
          lost: "var(--color-lost)",
          found: "var(--color-found)",
          pending: "var(--color-pending)",
          verified: "var(--color-verified)",
          completed: "var(--color-completed)",
          closed: "var(--color-closed)",
        },
      },

      // ── Typography ───────────────────────────────────────────────
      fontFamily: {
        // TASKS §M1.6.1 — font variable slots; font loading is in layout.tsx
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      // ── Border radius ────────────────────────────────────────────
      // --radius drives the shadcn token; md/sm are derived from it
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Design spec: card 12px, button 8px — available as named values
        card: "12px",
        button: "8px",
      },

      // ── Keyframes ────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      // ── Animation utilities ──────────────────────────────────────
      animation: {
        "fade-in": "fade-in 220ms cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-up": "slide-up 220ms cubic-bezier(0.16,1,0.3,1) forwards",
        "scale-in": "scale-in 180ms cubic-bezier(0.16,1,0.3,1) forwards",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "accordion-down": "accordion-down 0.22s ease-out",
        "accordion-up": "accordion-up 0.22s ease-out",
      },

      // ── Spacing ──────────────────────────────────────────────────
      // 8pt grid — Tailwind's default 4px base unit covers this;
      // these are named aliases for common layout measurements
      spacing: {
        "bottom-nav": "80px", // floating pill nav: 62px bar + 10px padding + 8px gap
        sidebar: "220px", // fixed desktop sidebar width
      },

      // ── Min-height / min-width touch targets ─────────────────────
      minHeight: {
        touch: "44px", // Apple HIG / WCAG minimum touch target
      },
      minWidth: {
        touch: "44px",
      },

      // ── Max widths ───────────────────────────────────────────────
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
