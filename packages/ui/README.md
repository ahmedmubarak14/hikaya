# @hikaya/ui

Shared UI primitives. Tailwind-based, RTL-aware, dark-default. Consumers must
extend the `@hikaya/config/tailwind/preset` so brand tokens resolve.

## Components (Phase 1)

- `Button` — primary / secondary / ghost / outline / destructive · sm / md / lg
- `Input` — labelled, with error / hint, leading / trailing icons
- `Card` + `CardHeader` / `CardBody` / `CardFooter` — interactive variant lifts on hover
- `Badge` — neutral / accent / sage / info / purple / warning tones
- `Logo` — type-set wordmark, EN italic / AR Cairo

## RTL

Components use logical Tailwind utilities (e.g. `ms-*`, `me-*`) so they mirror
under `dir="rtl"` automatically. A `[lang=ar]:` modifier is applied to body
text so Arabic gets its own typeface (`fontFamily.sansAr`) and a small optical-
size bump (`text-[1.05em]`) per the PRD.

## Adding a component

1. Build it under `src/components/`.
2. Re-export from `src/index.ts`.
3. If it has variants, use `class-variance-authority`.
4. Always merge classes via the `cn` helper.
5. Use logical CSS properties — never `pl-`/`pr-`/`ml-`/`mr-`. Use `ps-`/`pe-`
   and `ms-`/`me-` instead.
