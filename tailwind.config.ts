/** @type {import('tailwindcss').Config} */
type ThemeColor = (options: {
  opacityValue?: string;
  opacityVariable?: string;
}) => string;

/**
 * Cor baseada em canais RGB (var(--token) = "r g b").
 * - sem modifier de opacidade, respeita o alpha do token (ex.: --muted-alpha: .08);
 * - com modifier (/40, /5...), usa o valor informado pelo Tailwind.
 */
const color =
  (variable: string, alphaVariable?: string): ThemeColor =>
  ({ opacityValue }) => {
    const isDefault =
      opacityValue === undefined || opacityValue.includes("--tw-");
    const alpha = isDefault
      ? alphaVariable
        ? `var(${alphaVariable})`
        : "1"
      : opacityValue;
    return `rgb(var(${variable}) / ${alpha})`;
  };

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: color("--background"),
        foreground: color("--foreground", "--foreground-alpha"),
        secondary: color("--secondary", "--secondary-alpha"),
        tertiary: color("--tertiary", "--tertiary-alpha"),
        border: color("--border", "--border-alpha"),
        input: color("--input", "--input-alpha"),
        ring: color("--ring"),
        accent: color("--accent"),
        "accent-foreground": color("--accent-foreground"),
        "accent-hover": color("--accent-hover"),
        muted: color("--muted", "--muted-alpha"),
        "muted-foreground": color("--muted-foreground", "--muted-foreground-alpha"),
        card: color("--card"),
        "card-foreground": color("--card-foreground", "--card-foreground-alpha"),
        popover: color("--popover"),
        "popover-foreground": color("--popover-foreground", "--popover-foreground-alpha"),
        primary: color("--primary"),
        "primary-foreground": color("--primary-foreground"),
        danger: color("--danger"),
        "danger-foreground": color("--danger-foreground"),
        success: color("--success"),
        warning: color("--warning"),
        sidebar: color("--sidebar"),
        "sidebar-foreground": color("--sidebar-foreground", "--sidebar-foreground-alpha"),
        "sidebar-border": color("--sidebar-border", "--sidebar-border-alpha"),

        // Legado em camelCase, mantido para compatibilidade.
        accentHover: color("--accent-hover"),
        mutedForeground: color("--muted-foreground", "--muted-foreground-alpha"),
        cardForeground: color("--card-foreground", "--card-foreground-alpha"),
        popoverForeground: color("--popover-foreground", "--popover-foreground-alpha"),
        primaryForeground: color("--primary-foreground"),
        dangerForeground: color("--danger-foreground"),
      },
      fontFamily: {
        // Em Apple (macOS/iOS) usa a San Francisco do sistema; nos demais, Inter.
        sans: ["var(--font-ui)"],
        display: ["var(--font-display)"],
        serif: ['"Lyon-Text"', "Georgia", "serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "4px",
        md: "6px",
        lg: "6px",
        xl: "6px",
      },
      spacing: {
        sidebar: "240px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
      },
    },
  },
  plugins: [],
};
