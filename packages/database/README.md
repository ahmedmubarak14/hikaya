# @hikaya/database

Prisma schema and generated client. The single source of truth for the data
model. Both the API and (read-only patterns in) the web app import from here.

## Usage

```ts
import { prisma, type CreatorProfile } from '@hikaya/database';

const profile: CreatorProfile | null = await prisma.creatorProfile.findUnique({
  where: { username: 'noor' },
});
```

## Workflow

```bash
# Generate the client after schema changes
pnpm --filter @hikaya/database db:generate

# Create a new migration in dev
pnpm --filter @hikaya/database db:migrate

# Apply pending migrations in production
pnpm --filter @hikaya/database db:migrate:deploy

# Open Prisma Studio
pnpm --filter @hikaya/database db:studio

# Seed dev data
pnpm --filter @hikaya/database db:seed
```

## Conventions

- **IDs**: cuid.
- **Money**: integer SAR halalas (1 SAR = 100 halalas). Helpers in
  `@hikaya/types/money` convert at the boundary.
- **Timestamps**: `createdAt` + `updatedAt` on every entity.
- **Soft delete**: avoided in Phase 1. Cascade where the relationship justifies
  it; otherwise prefer status enums.
- **Phase 2/3** entities are sketched as commented blocks at the bottom of
  `schema.prisma` so the data model evolves predictably.
