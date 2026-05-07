import { type SVGAttributes } from 'react';

import { cn } from '../utils/cn';

interface LogoProps extends SVGAttributes<SVGSVGElement> {
  /** Render the Arabic mark (حكاية) instead of the Latin one. */
  arabic?: boolean;
}

/**
 * Hikaya wordmark. Editorial italic in EN, Cairo bold in AR.
 *
 * The mark is intentionally type-set rather than image-based so it inherits
 * `currentColor` and respects the current language's typeface.
 */
export function Logo({ className, arabic, ...rest }: LogoProps) {
  return (
    <svg
      viewBox="0 0 200 48"
      role="img"
      aria-label={arabic ? 'حكاية' : 'Hikaya'}
      className={cn('h-8 w-auto', className)}
      {...rest}
    >
      <text
        x="0"
        y="34"
        fill="currentColor"
        fontFamily={arabic ? 'Cairo, system-ui, sans-serif' : 'Playfair Display, Georgia, serif'}
        fontSize="32"
        fontStyle={arabic ? 'normal' : 'italic'}
        fontWeight="700"
      >
        {arabic ? 'حكاية' : 'Hikaya'}
      </text>
    </svg>
  );
}
