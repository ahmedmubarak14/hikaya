# Hikaya — حكاية

> Tell your story. — احكِ قصتك

All-in-one creative professional platform for the Gulf market. One login to
showcase work, get hired, manage a studio business, deliver client work, sell
products, and grow an audience.

## Live preview

A static preview of the design is published to GitHub Pages on every push to
`main`:

**→ https://ahmedmubarak14.github.io/hikaya/en/**

Demo accounts (mock auth — only meaningful on a real server, e.g. local dev):

- `noor@hikaya.sa` / `password123` → creator view
- `client@hikaya.sa` / `password123` → client view

## Run locally

```bash
# Prerequisites: Node 20+, pnpm 10+
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @hikaya/web dev
# → http://localhost:3000
```

## License

Proprietary. © Hikaya.
