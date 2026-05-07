/**
 * Hikaya seed script.
 *
 * Creates a minimal but realistic dataset so devs can land in a populated
 * product on first `pnpm dev`. Idempotent — safe to run repeatedly.
 *
 * Run with: pnpm --filter @hikaya/database db:seed
 */
import { PrismaClient, UserRole, City, Discipline, Locale } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Platform admin
  await prisma.user.upsert({
    where: { email: 'admin@hikaya.sa' },
    update: {},
    create: {
      email: 'admin@hikaya.sa',
      displayName: 'Hikaya Admin',
      roles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
      locale: Locale.EN,
    },
  });

  // Sample creator
  const creator = await prisma.user.upsert({
    where: { email: 'noor@hikaya.sa' },
    update: {},
    create: {
      email: 'noor@hikaya.sa',
      displayName: 'Noor Al-Saadi',
      roles: [UserRole.CREATOR],
      activeRole: UserRole.CREATOR,
      locale: Locale.EN,
    },
  });

  await prisma.creatorProfile.upsert({
    where: { userId: creator.id },
    update: {},
    create: {
      userId: creator.id,
      username: 'noor',
      displayNameEn: 'Noor Al-Saadi',
      displayNameAr: 'نور السعدي',
      bioEn: 'Wedding & editorial photographer based in Riyadh.',
      bioAr: 'مصوّرة أعراس وتحرير في الرياض.',
      disciplines: [Discipline.WEDDING_PHOTOGRAPHY, Discipline.PORTRAIT_PHOTOGRAPHY],
      city: City.RIYADH,
      languages: [Locale.EN, Locale.AR],
      startingPriceSar: 4500,
      yearsExperience: 7,
    },
  });

  // Sample client
  await prisma.user.upsert({
    where: { email: 'client@hikaya.sa' },
    update: {},
    create: {
      email: 'client@hikaya.sa',
      displayName: 'Sample Client',
      roles: [UserRole.CLIENT],
      activeRole: UserRole.CLIENT,
      clientProfile: { create: { isBusiness: false } },
    },
  });

  // eslint-disable-next-line no-console
  console.info('Seed complete.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
