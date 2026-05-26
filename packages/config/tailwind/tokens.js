/**
 * Hikaya design tokens — single source of truth.
 *
 * Theme-aware colors (bg, surface, line) resolve to CSS variables set in
 * apps/web/src/styles/globals.css. The default theme is LIGHT; users can
 * opt into dark via the theme toggle in the header (data-theme="dark" on
 * <html>). Brand accents (eucalyptus, fig, sage, blue) stay
 * constant across themes.
 *
 * Consumed by:
 *   - Tailwind preset (./preset.js) to generate utility classes.
 *   - The `:root` CSS custom properties in apps/web/src/styles/globals.css.
 */

/** @type {const} */
const colors = {
  // Theme-aware neutrals — actual values come from CSS variables.
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  line: 'var(--line)',

  // Fixed brand neutrals (used when we explicitly want one or the other,
  // regardless of theme — e.g. button text on the yellow accent must be dark).
  ink: 'var(--ink)',
  paper: 'var(--paper)',

  // Accents — same in both themes.
  accent: 'var(--accent)', // Eucalyptus CTA
  accentSecondary: 'var(--accent-secondary)', // Muted fig highlight

  // Tertiaries — same in both themes.
  sage: 'var(--sage)',
  blue: 'var(--info)',
  purple: 'var(--purple)',

  // Muted text — derived per theme via opacity utilities (text-surface/60).
  muted: 'var(--muted)',
};

const fontFamily = {
  // EN-first stacks; Arabic stacks are scoped via [lang="ar"] in CSS.
  display: ['var(--font-display)', '"Playfair Display"', 'Georgia', 'serif'],
  displayAr: ['var(--font-display-ar)', '"Cairo"', 'system-ui', 'sans-serif'],
  sans: ['var(--font-sans)', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
  sansAr: ['var(--font-sans-ar)', '"Noto Naskh Arabic"', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
};

const fontSize = {
  '2xs': ['0.6875rem', { lineHeight: '1rem' }],
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.875rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.5rem', { lineHeight: '1.1' }],
  '5xl': ['3.5rem', { lineHeight: '1.05' }],
  '6xl': ['4.5rem', { lineHeight: '1.02' }],
  '7xl': ['6rem', { lineHeight: '1' }],
};

const spacing = {
  18: '4.5rem',
  22: '5.5rem',
  26: '6.5rem',
  30: '7.5rem',
};

const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
};

const motion = {
  ease: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  duration: {
    fast: '120ms',
    base: '200ms',
    slow: '400ms',
    cinematic: '700ms',
  },
};

module.exports = {
  colors,
  fontFamily,
  fontSize,
  spacing,
  borderRadius,
  motion,
};
