import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with Tailwind-aware deduplication.
 *
 *   cn('px-4 py-2', condition && 'bg-accent', extraClass);
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
