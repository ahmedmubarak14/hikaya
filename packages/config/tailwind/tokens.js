/**
 * Hikaya design tokens — single source of truth.
 *
 * Consumed by:
 *   - Tailwind preset (./preset.js) to generate utility classes.
 *   - The `:root` CSS custom properties in apps/web/src/styles/globals.css.
 *   - Documentation and tooling.
 *
 * Edit values here; everything downstream picks them up.
 */

/** @type {const} */
const colors = {
  // Brand neutrals
  bg: '#080808',
  surface: '#f8f6f1',
  ink: '#080808',
  paper: '#f8f6f1',

  // Accents
  accent: '#e8ff47',         // Electric yellow-green CTA
  accentSecondary: '#ff6b35', // Orange highlight

  // Tertiaries
  sage: '#4a7a5a',
  blue: '#3a6fd8',
  purple: '#7c52c8',

  // Neutrals
  muted: '#888580',
  line: '#1a1a1a',
};

const fontFamily = {
  // EN-first stacks; Arabic stacks are scoped via [lang="ar"] in CSS.
  // CSS variables are populated by `next/font` in apps/web/src/app/[locale]/layout.tsx.
  // Fallbacks ensure tools like Storybook (without next/font) still render.
  display: ['var(--font-display)', '"Playfair Display"', 'Georgia', 'serif'],
  displayAr: ['var(--font-display-ar)', '"Cairo"', 'system-ui', 'sans-serif'],
  sans: ['var(--font-sans)', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
  sansAr: ['var(--font-sans-ar)', '"Noto Naskh Arabic"', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
};

const fontSize = {
  // Editorial scale — tuned for dark, photography-forward layouts.
  '2xs': ['0.6875rem', { lineHeight: '1rem' }],   // 11px
  xs: ['0.75rem', { lineHeight: '1rem' }],         // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],        // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],     // 18px
  xl: ['1.25rem', { lineHeight: '1.875rem' }],     // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
  '4xl': ['2.5rem', { lineHeight: '1.1' }],        // 40px
  '5xl': ['3.5rem', { lineHeight: '1.05' }],       // 56px
  '6xl': ['4.5rem', { lineHeight: '1.02' }],       // 72px
  '7xl': ['6rem', { lineHeight: '1' }],            // 96px
};

const spacing = {
  // Generous editorial spacing extras on top of Tailwind defaults.
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
  /** Standard cubic-bezier curves used across the product. */
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
