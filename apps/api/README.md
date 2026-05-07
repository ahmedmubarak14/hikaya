# @hikaya/api

NestJS backend for the Hikaya platform.

## Run

```bash
cp .env.example .env
pnpm --filter @hikaya/api dev
# → http://localhost:4000/api
# → http://localhost:4000/api/docs (Swagger, dev only)
```

## Structure

```
src/
├── main.ts             # bootstrap (helmet, CORS, validation, swagger)
├── app.module.ts       # module wiring
├── common/
│   ├── config/         # zod-validated env schema
│   └── prisma/         # Prisma module + service
└── modules/
    ├── auth/           # email + password, JWT, passport strategy
    ├── users/          # /users/me
    ├── health/         # /health
    ├── creators/       # ← Phase 1 stub, TODO
    ├── studios/        # ← stub
    ├── portfolios/     # ← stub
    ├── inquiries/      # ← stub
    ├── jobs/           # ← stub
    ├── bookings/       # ← stub
    ├── messages/       # ← stub (will host Socket.io gateway)
    ├── collections/    # ← stub (client galleries)
    ├── quotes/         # ← stub
    ├── contracts/      # ← stub
    ├── payments/       # ← stub (Moyasar in Phase 2)
    ├── products/       # ← stub (creator store)
    ├── reviews/        # ← stub
    └── notifications/  # ← stub
```

## Design notes

- **Validation**: every DTO is `class-validator` decorated AND has a parallel
  zod schema in `@hikaya/types` for shared client/server types.
- **Money**: `amountHalalas: number` everywhere on the wire. Convert at the UI.
- **Error model**: rely on Nest's built-in `HttpException` family. Add a
  global exception filter once we have a clear error vocab.
- **Rate limiting**: ThrottlerModule applied globally (120 req/min). Tighten
  for `auth/*` and write endpoints when those land.
- **CORS**: only the configured `CORS_ORIGIN` is allowed; credentials are on so
  the web app can use httpOnly cookies once we move off bearer tokens.
