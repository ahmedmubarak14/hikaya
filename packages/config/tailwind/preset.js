const tokens = require('./tokens');

/**
 * Hikaya Tailwind preset.
 *
 * Apps extend this preset to get brand colors, typography, spacing, motion,
 * and the @tailwindcss/rtl plugin. Per the PRD, all components must mirror
 * cleanly between LTR/RTL — this preset wires that up at the foundation.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: tokens.colors.bg,
        surface: tokens.colors.surface,
        ink: tokens.colors.ink,
        paper: tokens.colors.paper,
        accent: {
          DEFAULT: tokens.colors.accent,
          secondary: tokens.colors.accentSecondary,
        },
        muted: tokens.colors.muted,
        line: tokens.colors.line,
        sage: tokens.colors.sage,
        info: tokens.colors.blue,
        purple: tokens.colors.purple,
        orange: tokens.colors.orange,
      },
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      transitionTimingFunction: {
        out: tokens.motion.ease.out,
        'in-out': tokens.motion.ease.inOut,
      },
      transitionDuration: {
        fast: tokens.motion.duration.fast.replace('ms', ''),
        DEFAULT: tokens.motion.duration.base.replace('ms', ''),
        slow: tokens.motion.duration.slow.replace('ms', ''),
        cinematic: tokens.motion.duration.cinematic.replace('ms', ''),
      },
      maxWidth: {
        prose: '68ch',
        '8xl': '88rem',
      },
    },
  },
  plugins: [
    // RTL plugin — produces ltr:/rtl: variants and mirrors logical utilities.
    require('tailwindcss-rtl'),
  ],
};
