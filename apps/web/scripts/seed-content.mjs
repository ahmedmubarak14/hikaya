#!/usr/bin/env node
/**
 * Seed Supabase with galleries, jobs, and blog posts from mock data.
 *
 * Usage:
 *   node apps/web/scripts/seed-content.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env or
 * in apps/web/.env.local.
 *
 * Prerequisites:
 *   - Creators must already be seeded (run seed-creators.mjs first).
 *   - The BlogPost table must exist. If it does not, run the SQL migration
 *     printed by this script with --print-blog-sql, or let the script create
 *     it automatically via rpc('') — see the ensureBlogPostTable() function.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load env vars from .env.local if not already set
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local not found — rely on env vars being set externally
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const pic = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const now = new Date();
const isoNow = now.toISOString();
const inDays = (d) => {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  return date.toISOString();
};
const daysAgo = (d) => inDays(-d);

// ---------------------------------------------------------------------------
// Creator / User ID references (must match seed-creators.mjs)
// ---------------------------------------------------------------------------
// seed-creators.mjs uses: user id = `user_${username}`, creator id = `cr_${username}`
const CR_NOOR = 'cr_noor';
const USER_NOOR = 'user_noor';

// For jobs: poster is a client user. We create a synthetic client user.
const USER_CLIENT = 'user_client_brand';
const CLIENT_NAME = 'Lina Saqr';
const CLIENT_COMPANY = 'Al-Asalah Studio';

// ---------------------------------------------------------------------------
// BlogPost SQL migration (needed if table doesn't exist)
// ---------------------------------------------------------------------------
const BLOGPOST_MIGRATION_SQL = `
-- BlogPost table for creator journals / blog
-- Matches the BlogPost type from apps/web/src/lib/blog/mock-data.ts

CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id"          TEXT PRIMARY KEY,
  "creatorId"   TEXT NOT NULL REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
  "slug"        TEXT NOT NULL,
  "titleEn"     TEXT NOT NULL,
  "titleAr"     TEXT,
  "coverUrl"    TEXT,
  "bodyEn"      TEXT NOT NULL,
  "bodyAr"      TEXT,
  "tags"        TEXT[] DEFAULT '{}',
  "status"      "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_creator_slug_key" ON "BlogPost"("creatorId", "slug");
CREATE INDEX IF NOT EXISTS "BlogPost_creatorId_idx" ON "BlogPost"("creatorId");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
`;

// ---------------------------------------------------------------------------
// Print SQL migration and exit (if --print-blog-sql flag)
// ---------------------------------------------------------------------------
if (process.argv.includes('--print-blog-sql')) {
  console.log(BLOGPOST_MIGRATION_SQL);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 1. GALLERIES (Collection + CollectionImage)
// ---------------------------------------------------------------------------

function buildImages(prefix, count) {
  const shapes = ['p', 'l', 's', 'p', 'l'];
  const out = [];
  for (let i = 0; i < count; i++) {
    const shape = shapes[i % shapes.length];
    const w = shape === 'l' ? 1400 : shape === 's' ? 1100 : 900;
    const h = shape === 'l' ? 900 : shape === 's' ? 1100 : 1300;
    out.push({ id: `${prefix}-img-${i}`, url: pic(`${prefix}-${i}`, w, h), width: w, height: h });
  }
  return out;
}

const GALLERIES = [
  {
    id: 'gl_sara_hassan',
    shareSlug: 'sara-hassan-wedding',
    creatorId: CR_NOOR,
    titleEn: 'Sara & Hassan — Wedding Day',
    titleAr: 'سارة وحسن — يوم الزفاف',
    coverUrl: pic('sara-cover', 1800, 900),
    message: "Sara — favorites for the album spread by Friday, and let me know which two go on the parents' wall.",
    access: 'OPEN_LINK',
    allowDownloads: true,
    watermarkPreviews: false,
    expiresAt: inDays(45),
    publishedAt: isoNow,
    images: buildImages('sara-hassan', 18),
  },
  {
    id: 'gl_reem_portraits',
    shareSlug: 'reem-portraits',
    creatorId: CR_NOOR,
    titleEn: 'Reem — Brand portraits',
    titleAr: 'ريم — بورتريه العلامة',
    coverUrl: pic('reem-cover', 1800, 900),
    message: 'Reem — the natural-light selects are first; studio at the bottom. Heart your top six.',
    access: 'OPEN_LINK',
    allowDownloads: false,
    watermarkPreviews: true,
    expiresAt: inDays(20),
    publishedAt: isoNow,
    images: buildImages('reem-portraits', 14),
  },
];

async function seedGalleries() {
  console.log('\n=== Seeding Galleries ===\n');

  // Upsert Collection rows
  const collectionRows = GALLERIES.map((g) => ({
    id: g.id,
    creatorId: g.creatorId,
    shareSlug: g.shareSlug,
    titleEn: g.titleEn,
    titleAr: g.titleAr || null,
    coverUrl: g.coverUrl,
    message: g.message || null,
    access: g.access,
    allowDownloads: g.allowDownloads,
    watermarkPreviews: g.watermarkPreviews,
    expiresAt: g.expiresAt || null,
    publishedAt: g.publishedAt,
    createdAt: isoNow,
    updatedAt: isoNow,
  }));

  console.log(`Upserting ${collectionRows.length} Collection rows...`);
  const { data: collData, error: collError } = await supabase
    .from('Collection')
    .upsert(collectionRows, { onConflict: 'id' })
    .select('id');

  if (collError) {
    console.error('Collection upsert error:', collError);
    process.exit(1);
  }
  console.log(`  -> ${collData.length} Collection rows upserted`);

  // Upsert CollectionImage rows
  const imageRows = [];
  for (const g of GALLERIES) {
    for (let i = 0; i < g.images.length; i++) {
      const img = g.images[i];
      imageRows.push({
        id: `ci_${g.id}_${i}`,
        collectionId: g.id,
        url: img.url,
        thumbnailUrl: img.url,
        width: img.width,
        height: img.height,
        orderIndex: i,
        createdAt: isoNow,
      });
    }
  }

  console.log(`Upserting ${imageRows.length} CollectionImage rows...`);
  const { data: imgData, error: imgError } = await supabase
    .from('CollectionImage')
    .upsert(imageRows, { onConflict: 'id' })
    .select('id');

  if (imgError) {
    console.error('CollectionImage upsert error:', imgError);
    process.exit(1);
  }
  console.log(`  -> ${imgData.length} CollectionImage rows upserted`);
}

// ---------------------------------------------------------------------------
// 2. JOBS (Job + JobApplication)
// ---------------------------------------------------------------------------

const JOBS = [
  {
    id: 'job_seed_001',
    postedById: USER_CLIENT,
    title: 'Brand campaign — modest fashion editorial',
    discipline: 'FASHION_PHOTOGRAPHY',
    city: 'RIYADH',
    description:
      "We're launching the AW collection in early March and need a photographer for a one-day editorial shoot. Indoor location confirmed (Diriyah). Looking for warm, soft-light energy with strong portrait fundamentals. Hair + makeup provided. Final delivery: 35–50 retouched images within 10 days.",
    budgetHalalas: 4_500_000,
    budgetIsOpen: false,
    creatorsNeeded: 1,
    deadline: inDays(21),
    expiresAt: inDays(28),
    status: 'OPEN',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'job_seed_002',
    postedById: USER_CLIENT,
    title: 'Drone + commercial video for new development reveal',
    discipline: 'COMMERCIAL_VIDEO',
    city: 'JEDDAH',
    description:
      'Two-day shoot for the launch of our new waterfront development. We need aerial drone footage (DJI Mavic 3 minimum) plus on-site cinematic interviews with the architect. Final deliverables: 60-second hero film + 3 social cutdowns. Open to proposals on price.',
    budgetHalalas: null,
    budgetIsOpen: true,
    creatorsNeeded: 1,
    deadline: inDays(14),
    expiresAt: inDays(28),
    status: 'OPEN',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'job_seed_003',
    postedById: USER_CLIENT,
    title: 'Wedding day coverage — March 14',
    discipline: 'WEDDING_PHOTOGRAPHY',
    city: 'RIYADH',
    description:
      'Looking for a primary photographer (and optional second shooter) for a 200-guest wedding outside Riyadh. Outdoor ceremony, golden hour priority. Edited gallery within 4 weeks; raw files for the first dance only.',
    budgetHalalas: 1_500_000,
    budgetIsOpen: false,
    creatorsNeeded: 2,
    deadline: inDays(35),
    expiresAt: inDays(28),
    status: 'OPEN',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
];

async function seedJobs() {
  console.log('\n=== Seeding Jobs ===\n');

  // First, ensure the client user exists
  const clientUser = {
    id: USER_CLIENT,
    email: 'lina@alasalah.sa',
    displayName: CLIENT_NAME,
    locale: 'EN',
    roles: ['CLIENT'],
    activeRole: 'CLIENT',
    authProvider: 'EMAIL',
    isSuspended: false,
    updatedAt: isoNow,
    createdAt: isoNow,
  };

  console.log('Upserting client User row...');
  const { error: userError } = await supabase
    .from('User')
    .upsert([clientUser], { onConflict: 'id' })
    .select('id');

  if (userError) {
    console.error('Client User upsert error:', userError);
    process.exit(1);
  }
  console.log('  -> Client user upserted');

  // Upsert Job rows
  const jobRows = JOBS.map((j) => ({
    id: j.id,
    postedById: j.postedById,
    title: j.title,
    discipline: j.discipline,
    city: j.city,
    description: j.description,
    budgetHalalas: j.budgetHalalas,
    budgetIsOpen: j.budgetIsOpen,
    creatorsNeeded: j.creatorsNeeded,
    deadline: j.deadline,
    expiresAt: j.expiresAt,
    status: j.status,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  }));

  console.log(`Upserting ${jobRows.length} Job rows...`);
  const { data: jobData, error: jobError } = await supabase
    .from('Job')
    .upsert(jobRows, { onConflict: 'id' })
    .select('id');

  if (jobError) {
    console.error('Job upsert error:', jobError);
    process.exit(1);
  }
  console.log(`  -> ${jobData.length} Job rows upserted`);

  // Seed a couple of sample applications so the data is realistic
  const applicationRows = [
    {
      id: 'ja_noor_001',
      jobId: 'job_seed_001',
      applicantUserId: USER_NOOR,
      creatorProfileId: CR_NOOR,
      coverNote: 'I specialize in soft, warm editorial lighting — exactly the look described. Diriyah is one of my favorite locations; I have shot there six times. Available on the proposed dates.',
      proposedRateHalalas: 4_500_000,
      status: 'SUBMITTED',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ja_yara_002',
      jobId: 'job_seed_002',
      applicantUserId: 'user_yara',
      creatorProfileId: 'cr_yara',
      coverNote: 'Commercial video is my core discipline. I own a DJI Mavic 3 Pro and have directed multiple real-estate launch films in Jeddah. Happy to share the reel.',
      proposedRateHalalas: 8_000_000,
      status: 'SUBMITTED',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
  ];

  console.log(`Upserting ${applicationRows.length} JobApplication rows...`);
  const { data: appData, error: appError } = await supabase
    .from('JobApplication')
    .upsert(applicationRows, { onConflict: 'id' })
    .select('id');

  if (appError) {
    console.error('JobApplication upsert error:', appError);
    process.exit(1);
  }
  console.log(`  -> ${appData.length} JobApplication rows upserted`);
}

// ---------------------------------------------------------------------------
// 3. BLOG (BlogPost — table may need to be created first)
// ---------------------------------------------------------------------------

const BLOG_POSTS = [
  {
    id: 'bp_noor_one_strobe',
    creatorId: CR_NOOR,
    slug: 'one-strobe-wedding-lighting',
    titleEn: 'How I light wedding ceremonies with one strobe',
    titleAr: 'كيف أُضيء حفلات الزفاف بـ"ستروب" واحد',
    coverUrl: pic('blog-one-strobe', 1600, 900),
    bodyEn: [
      'Most wedding photographers I meet carry too much light. Two on stands, one off-camera, and a backup nobody knew was in the trunk. After seven years of shooting in Riyadh ballrooms, I shoot with one strobe and a small mod. It is faster, less invasive, and the pictures look closer to what the bride actually saw on her day.',
      'My setup is one Godox AD200 inside a 36" octa, mounted on a C-stand with a sandbag. The light goes camera-left at roughly 45 degrees, feathered toward the back of the room.',
      'I trigger with an XPro on top of the camera so I can dial power without leaving my position. For a Saudi ceremony in a typical Riyadh ballroom, I start at 1/8 power, ISO 800, f/2.8, 1/200s.',
      'The hard part is not the light. It is the geometry. A ceremony moves: the procession, the readings, the rings, the kiss.',
      'If you remember nothing else: one good light, placed deliberately, beats three bad ones placed anywhere. Buy a sandbag. Use it.',
    ].join('\n\n'),
    bodyAr: 'كثير من مصوّري الأعراس يحملون أكثر مما يلزم من الإضاءة. بعد سبع سنين، صرتُ أُصوّر بستروب واحد ومُعدِّل صغير.',
    tags: ['lighting', 'weddings', 'gear'],
    status: 'PUBLISHED',
    publishedAt: daysAgo(4),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
  },
  {
    id: 'bp_noor_riyadh_season',
    creatorId: CR_NOOR,
    slug: 'five-lessons-riyadh-season-2025',
    titleEn: 'Five lessons from shooting Riyadh Season 2025',
    titleAr: 'خمسة دروس من تغطية موسم الرياض ٢٠٢٥',
    coverUrl: pic('blog-riyadh-season', 1600, 900),
    bodyEn: [
      'I shot 14 days of Riyadh Season this year, across Boulevard, the Zone, and one private event at Diriyah.',
      'One — the brief is never the brief. Every brand who hired me asked for "candid energy" and then asked me to retake the staged hero shot four times.',
      'Two — manage your dust. Boulevard kicks up an astonishing amount of it after 10 p.m.',
      'Three — Arabic captions matter more than English ones.',
      'Four — the talent does not want your direction.',
      'Five — do not over-edit. The Season look is warm, slightly grainy, contrasty in the shadows but never crushed.',
    ].join('\n\n'),
    bodyAr: 'صوَّرت ١٤ يوماً من موسم الرياض هذا العام. هذه الدروس التي أحملها معي.',
    tags: ['riyadh-season', 'events', 'workflow'],
    status: 'PUBLISHED',
    publishedAt: daysAgo(18),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
  },
  {
    id: 'bp_noor_color_grading',
    creatorId: CR_NOOR,
    slug: 'my-color-grading-workflow-lightroom',
    titleEn: 'My color grading workflow in Lightroom',
    titleAr: 'سير عملي في تدرّج الألوان داخل Lightroom',
    coverUrl: pic('blog-color-grading', 1600, 900),
    bodyEn: [
      'I keep getting asked how I get a consistent grade across a wedding without spending six hours in front of the screen. The answer is unsexy: it is a fixed sequence applied to every photograph.',
      'I shoot in flat picture style on the Sony A7IV — neutral with -3 contrast and -2 saturation in-camera.',
      'Import goes through Photo Mechanic for culling. I never cull inside Lightroom.',
      'Per-image work is then only three things: exposure correction, a crop, and if the subject is dark-skinned I lift the orange luminance by +5 to +8.',
      'Export at 3000px on the long edge, sRGB, 80% quality. JPEGs only.',
    ].join('\n\n'),
    bodyAr: 'يسألني الناس كثيراً كيف أحصل على تدرّج لون متّسق في عرس كامل. الجواب: تسلسل ثابت يُطبَّق على كلّ صورة.',
    tags: ['color', 'lightroom', 'workflow'],
    status: 'PUBLISHED',
    publishedAt: daysAgo(35),
    createdAt: daysAgo(40),
    updatedAt: daysAgo(35),
  },
  {
    id: 'bp_noor_saudi_brides_draft',
    creatorId: CR_NOOR,
    slug: 'working-with-saudi-brides-cultural-notes',
    titleEn: 'Working with Saudi brides: cultural notes for new photographers',
    titleAr: 'العمل مع العرائس السعوديّات: ملاحظات ثقافيّة للمصوّرين الجدد',
    coverUrl: null,
    bodyEn: [
      'A draft I have been sitting on. Posting this once a few friends have read it.',
      'The biggest single shift is that the bride is on display for the first time in front of women who have never seen her without abaya.',
      'I will fill this out — sections on second shooters, gift portrait sessions, timeline negotiation, and the unwritten rule about not photographing aunts in the wide shots.',
    ].join('\n\n'),
    bodyAr: 'مسوّدة أحتفظ بها منذ مدّة. سأنشرها بعد أن يقرأها بعض الأصدقاء.',
    tags: ['weddings', 'culture', 'process'],
    status: 'DRAFT',
    publishedAt: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];

async function ensureBlogPostTable() {
  // Check if the BlogPost table exists by trying a lightweight select.
  const { error } = await supabase
    .from('BlogPost')
    .select('id', { count: 'exact', head: true });

  if (error && (error.code === '42P01' || error.code === 'PGRST205' ||
      (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache'))))) {
    return false;
  }

  // Table exists or some other situation — we'll catch insert errors downstream
  return !error;
}

async function seedBlog() {
  console.log('\n=== Seeding Blog Posts ===\n');

  const exists = await ensureBlogPostTable();
  if (!exists) {
    console.log('Skipping blog seed — table may not exist. Attempting upsert anyway...');
  }

  const postRows = BLOG_POSTS.map((p) => ({
    id: p.id,
    creatorId: p.creatorId,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr || null,
    coverUrl: p.coverUrl || null,
    bodyEn: p.bodyEn,
    bodyAr: p.bodyAr || null,
    tags: p.tags,
    status: p.status,
    publishedAt: p.publishedAt || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  console.log(`Upserting ${postRows.length} BlogPost rows...`);
  const { data: postData, error: postError } = await supabase
    .from('BlogPost')
    .upsert(postRows, { onConflict: 'id' })
    .select('id');

  if (postError) {
    if (postError.code === '42P01' || postError.code === 'PGRST205' ||
        (postError.message && (postError.message.includes('does not exist') || postError.message.includes('schema cache')))) {
      console.error('\n  BlogPost table does not exist.');
      console.error('  Run the SQL migration in apps/web/scripts/migrate-blog-post.sql');
      console.error('  via the Supabase SQL Editor, then re-run this script.\n');
      console.log('  SQL migration:\n');
      console.log(BLOGPOST_MIGRATION_SQL);
      // Don't exit — galleries and jobs are already seeded.
      return;
    }
    console.error('BlogPost upsert error:', postError);
    process.exit(1);
  }
  console.log(`  -> ${postData.length} BlogPost rows upserted`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding content (galleries + jobs + blog) into Supabase...');

  await seedGalleries();
  await seedJobs();
  await seedBlog();

  // Verify counts
  const { count: collCount } = await supabase.from('Collection').select('*', { count: 'exact', head: true });
  const { count: imgCount } = await supabase.from('CollectionImage').select('*', { count: 'exact', head: true });
  const { count: jobCount } = await supabase.from('Job').select('*', { count: 'exact', head: true });
  const { count: appCount } = await supabase.from('JobApplication').select('*', { count: 'exact', head: true });

  console.log('\nFinal counts:');
  console.log(`  Collection:        ${collCount}`);
  console.log(`  CollectionImage:   ${imgCount}`);
  console.log(`  Job:               ${jobCount}`);
  console.log(`  JobApplication:    ${appCount}`);

  // BlogPost count — may fail if table doesn't exist
  try {
    const { count: blogCount } = await supabase.from('BlogPost').select('*', { count: 'exact', head: true });
    console.log(`  BlogPost:          ${blogCount}`);
  } catch {
    console.log('  BlogPost:          (table may not exist)');
  }

  console.log('\nSeed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
