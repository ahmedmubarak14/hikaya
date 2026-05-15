# @hikaya/config

Shared configuration consumed by every app and package.

## Exports

| Path                                   | Use                               |
| -------------------------------------- | --------------------------------- |
| `@hikaya/config/tsconfig/base.json`    | Root preset, all packages extend  |
| `@hikaya/config/tsconfig/library.json` | TS libraries (UI, types)          |
| `@hikaya/config/tsconfig/next.json`    | Next.js apps                      |
| `@hikaya/config/tsconfig/nest.json`    | NestJS apps                       |
| `@hikaya/config/eslint/base`           | Base TS rules                     |
| `@hikaya/config/eslint/next`           | Next + a11y                       |
| `@hikaya/config/eslint/nest`           | Node-flavored loosened rules      |
| `@hikaya/config/tailwind/preset`       | Brand-aware Tailwind preset       |
| `@hikaya/config/tailwind/tokens`       | Raw token JS for non-Tailwind use |

## Tokens

`tailwind/tokens.js` is the single source of truth for the brand. The Tailwind
preset reads from it; the web app's `globals.css` mirrors the same values into
CSS custom properties. Edit one place, both update.
