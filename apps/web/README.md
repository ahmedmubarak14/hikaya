# @hikaya/web

Next.js 14 (App Router, TypeScript) frontend. Bilingual EN + AR with full RTL
mirroring, dark by default, editorial typography.

## Run

```bash
cp .env.example .env.local
pnpm --filter @hikaya/web dev
# → http://localhost:3000   (redirects to /en or /ar via next-intl middleware)
```

## Architecture

```
src/
├── app/
│   └── [locale]/        # all pages live under a locale segment
│       ├── layout.tsx   # next/font + dir + NextIntlClientProvider
│       ├── page.tsx     # landing
│       └── not-found.tsx
├── components/
│   ├── site-header.tsx  # nav + lang switcher
│   └── site-footer.tsx
├── i18n/
│   ├── config.ts        # locales, defaultLocale, isRtl
│   └── request.ts       # next-intl getRequestConfig
├── styles/
│   └── globals.css
└── middleware.ts        # next-intl localePrefix='always'

messages/
├── en.json
└── ar.json
```

## i18n + RTL — what to know

- Every page is under `/[locale]/...`. The middleware enforces a locale prefix.
- The locale is read from `params.locale` and applied to `<html lang dir>` in
  the layout. `dir="rtl"` is set when the locale is in `rtlLocales`.
- All UI strings are in `messages/<locale>.json` and consumed via
  `useTranslations()`. **Never hardcode user-facing strings.**
- Tailwind's `tailwindcss-rtl` plugin is active via the shared preset.
- Use **logical CSS utilities** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`,
  `end-*`, `border-s-*`, `border-e-*`) so layouts mirror automatically. Avoid
  `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`.
- Body text gets a small optical-size bump under `[lang=ar]` (~5–10%) and
  switches typeface to Noto Naskh Arabic; display headings switch to Cairo.

## Typography

`next/font` loads Playfair Display, Cairo, IBM Plex Sans, IBM Plex Mono, and
Noto Naskh Arabic and exposes them as CSS variables. The Tailwind preset's
`fontFamily` map references those variables, so `font-display`, `font-sans`,
`font-mono`, `font-displayAr`, `font-sansAr` all resolve correctly without
runtime FOUT.

## Adding a page

1. Create `src/app/[locale]/<route>/page.tsx`.
2. Add string keys to **both** `messages/en.json` and `messages/ar.json`.
3. If the page is async, accept `params: Promise<{ locale: Locale }>` and call
   `setRequestLocale(locale)` before any `useTranslations()`-using component.
4. Use `<Link href={\`/\${locale}/<route>\`}>` for navigation so language is
   preserved.
