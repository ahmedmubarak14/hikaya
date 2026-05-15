/**
 * Pure helpers for the blog feature — safe to import from server or client.
 */

/**
 * URL-safe slug: lowercase, ASCII-only, dashes between words. Trims to 80
 * characters so the eventual database constraint never fails on a weird
 * paste. Best-effort transliteration — non-ASCII characters are dropped.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    // Strip combining marks left by the NFKD pass.
    .replace(/[̀-ͯ]/g, '')
    // Anything else non-ASCII (Arabic, emoji) gets dropped — the eventual
    // server-side slug-generator will fall back to a random suffix for posts
    // titled entirely in Arabic.
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Naive reading-time estimate at 200 words per minute. Whitespace-split on
 * the rendered body — close enough for a "5 min read" label.
 */
export function estimateReadingMinutes(body: string): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Split a body into paragraphs. Bodies are plain text with blank lines
 * between paragraphs (the only structure the editor accepts). Trims each
 * paragraph and drops empties so trailing blank lines don't render boxes.
 */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
