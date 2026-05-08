/**
 * Single source of truth for supported locales. Imported by middleware,
 * the request handler, the layout, and the language switcher.
 */
export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Locales that flow right-to-left. Drives <html dir="rtl"> on the layout. */
export const rtlLocales: ReadonlySet<Locale> = new Set(['ar']);

export const localeMeta: Record<
  Locale,
  { label: string; nativeLabel: string; htmlLang: string }
> = {
  en: { label: 'English', nativeLabel: 'English', htmlLang: 'en' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', htmlLang: 'ar' },
};

export const isRtl = (locale: Locale): boolean => rtlLocales.has(locale);
