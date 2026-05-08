# Hikaya — حكاية

> Tell your story. — احكِ قصتك

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ahmedmubarak14/hikaya)

All-in-one creative professional platform for the Gulf market. One login to
showcase work, get hired, manage a studio business, deliver client work, sell
products, and grow an audience.

## Live demo

Click **Deploy to Render** above. Render reads `render.yaml`, provisions the
service on the free tier (no credit card), and gives you a public
`https://<your-name>.onrender.com` URL in ~3 minutes. The free instance
spins down after 15 min of idle and cold-starts on the next request.

After the first deploy, set `NEXT_PUBLIC_APP_URL` in Render → Environment to
your assigned `*.onrender.com` URL so the share-link copy buttons (gallery,
quote, contract pages) paste the right hostname.

Demo accounts (mock auth — data resets when Render redeploys or sleeps):

- `noor@hikaya.sa` / `password123` → creator view
- `client@hikaya.sa` / `password123` → client view

This repository is the **Phase 1 monorepo scaffold**. It establishes the
toolchain, design system, database schema, and app skeletons so feature work
can begin against a stable base.

## Structure

```
hikaya/
├── apps/
│   ├── web/          # Next.js 14 (App Router, TS, Tailwind, EN+AR/RTL)
│   └── api/          # NestJS (TS, Prisma, JWT)
├── packages/
│   ├── ui/           # Shared component primitives + design tokens
│   ├── database/     # Prisma schema + generated client
│   ├── config/       # Shared eslint, tsconfig, tailwind, prettier configs
│   └── types/        # Shared TypeScript types and zod schemas
├── .github/workflows # CI: lint, typecheck, build
├── turbo.json        # Turborepo task graph
└── pnpm-workspace.yaml
```

## Tech stack

**Frontend** — Next.js 14 (App Router) · TypeScript · Tailwind CSS + RTL plugin
· Framer Motion · next-intl (EN/AR) · Zustand · React Hook Form + Zod

**Backend** — NestJS · TypeScript · PostgreSQL · Prisma · Redis · Socket.io ·
JWT auth · Algolia search

**Infra** — AWS me-central-1 (Riyadh) · Cloudflare CDN · Cloudinary · Cloudflare
Stream · Resend · Moyasar (payments) · DocuSeal (e-signature)

## Getting started

```bash
# Prerequisites: Node 20+, pnpm 10+, PostgreSQL 15+, Redis 7+
pnpm install

# Copy and fill env
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Generate Prisma client and run migrations (requires DATABASE_URL)
pnpm db:generate
pnpm db:migrate

# Run everything (web on :3000, api on :4000)
pnpm dev
```

## Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Run all apps and packages in dev mode        |
| `pnpm build`       | Build all apps and packages                  |
| `pnpm lint`        | ESLint across the workspace                  |
| `pnpm typecheck`   | TypeScript across the workspace              |
| `pnpm test`        | Run all tests                                |
| `pnpm format`      | Prettier write                               |
| `pnpm db:generate` | Regenerate the Prisma client                 |
| `pnpm db:migrate`  | Apply pending Prisma migrations              |
| `pnpm db:studio`   | Open Prisma Studio                           |

## Internationalization

Hikaya ships bilingual from day one. Every UI string lives behind a
translation key (`apps/web/messages/en.json`, `messages/ar.json`). The web app
mirrors layout via `dir="rtl"` and Tailwind's RTL plugin — components use
**logical CSS properties** (`margin-inline-start`, etc.) so they Just Work in
both directions. Arabic body text uses Noto Naskh Arabic; Arabic display uses
Cairo. See [`apps/web/README.md`](apps/web/README.md) for details.

## Brand

| Token                | Value     | Use                                    |
| -------------------- | --------- | -------------------------------------- |
| `--bg`               | `#080808` | Primary background (dark default)      |
| `--surface`          | `#f8f6f1` | Off-white, light mode / contrast       |
| `--accent`           | `#e8ff47` | Electric yellow-green CTA              |
| `--accent-secondary` | `#ff6b35` | Orange highlight                       |
| `--muted`            | `#888580` | Muted body text                        |
| `--sage`             | `#4a7a5a` | Tertiary accent                        |
| `--blue`             | `#3a6fd8` | Tertiary accent                        |
| `--purple`           | `#7c52c8` | Tertiary accent                        |

Display fonts: Playfair Display (EN), Cairo (AR). Body: IBM Plex Sans (EN),
Noto Naskh Arabic (AR). Mono: IBM Plex Mono.

## License

Proprietary. © Hikaya.
