#!/usr/bin/env node
/**
 * Seed Supabase with creator profiles + portfolio items from mock data.
 *
 * Usage:
 *   node apps/web/scripts/seed-creators.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env or
 * in apps/web/.env.local.
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
    // Strip surrounding quotes
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
// Reproduce mock-data helpers inline (this script runs outside Next.js)
// ---------------------------------------------------------------------------
const pic = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const portrait = (seed) => ({ url: pic(seed, 800, 1100), width: 800, height: 1100 });
const landscape = (seed) => ({ url: pic(seed, 1200, 800), width: 1200, height: 800 });
const square = (seed) => ({ url: pic(seed, 900, 900), width: 900, height: 900 });

function makePortfolio(prefix, mix) {
  return mix.map((shape, i) => {
    const seed = `${prefix}-${i}`;
    const dim = shape === 'p' ? portrait(seed) : shape === 'l' ? landscape(seed) : square(seed);
    return { id: `${prefix}-${i}`, ...dim };
  });
}

const CREATORS = [
  {
    id: 'cr_noor',
    username: 'noor',
    ownerEmail: 'noor@hikaya.sa',
    displayNameEn: 'Noor Al-Saadi',
    displayNameAr: 'نور السعدي',
    bioEn: 'Wedding & editorial photographer based in Riyadh. Soft, warm light is the whole game.',
    bioAr: 'مصوّرة أعراس وتحرير في الرياض. الضوء الدافئ الناعم هو كلّ القصّة.',
    avatarUrl: pic('avatar-noor', 200, 200),
    coverUrl: pic('cover-noor', 1800, 800),
    disciplines: ['WEDDING_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY'],
    city: 'RIYADH',
    startingPriceSar: 4500,
    yearsExperience: 7,
    languages: ['EN', 'AR'],
    availability: 'AVAILABLE',
    preferredLayout: 'EDITORIAL',
    reviewScore: 4.9,
    reviewCount: 38,
    isVerified: true,
    socialLinks: { instagram: 'https://instagram.com/_noor', website: 'https://noor.studio' },
    portfolio: makePortfolio('noor', ['l', 'p', 's', 'p', 'l', 's', 'p', 'l', 's']),
  },
  {
    id: 'cr_yara',
    username: 'yara',
    ownerEmail: 'yara@hikaya.sa',
    displayNameEn: 'Yara Hejazi',
    displayNameAr: 'يارا الحجازي',
    bioEn: 'Commercial videographer. Brand films for the way the Gulf actually feels — slow, considered, cinematic.',
    bioAr: 'صانعة فيديو تجاري. أفلام علامات تجاريّة بإيقاع الخليج الحقيقي — متأنّي، سينمائي.',
    avatarUrl: pic('avatar-yara', 200, 200),
    coverUrl: pic('cover-yara', 1800, 800),
    disciplines: ['COMMERCIAL_VIDEO', 'DOCUMENTARY'],
    city: 'JEDDAH',
    startingPriceSar: 12000,
    yearsExperience: 9,
    languages: ['EN', 'AR'],
    availability: 'BUSY',
    preferredLayout: 'REEL',
    reviewScore: 5.0,
    reviewCount: 21,
    isVerified: true,
    socialLinks: { instagram: 'https://instagram.com/yara.films' },
    portfolio: makePortfolio('yara', ['l', 'l', 's', 'l', 's', 'l']),
  },
  {
    id: 'cr_majed',
    username: 'majed',
    ownerEmail: 'majed@hikaya.sa',
    displayNameEn: 'Majed Al-Otaibi',
    displayNameAr: 'ماجد العتيبي',
    bioEn: 'Product & still life. Studio in Khobar. I shoot perfume, gold, and oud at scale.',
    bioAr: 'منتجات وحياة ساكنة. استوديو في الخبر. أصوّر العطور والذهب والعود بحجم تجاري.',
    avatarUrl: pic('avatar-majed', 200, 200),
    coverUrl: pic('cover-majed', 1800, 800),
    disciplines: ['PRODUCT_PHOTOGRAPHY', 'COMMERCIAL_PHOTOGRAPHY'],
    city: 'KHOBAR',
    startingPriceSar: 2800,
    yearsExperience: 5,
    languages: ['EN', 'AR'],
    availability: 'AVAILABLE',
    preferredLayout: 'MASONRY',
    reviewScore: 4.8,
    reviewCount: 54,
    isVerified: true,
    socialLinks: { instagram: 'https://instagram.com/majed.shoots' },
    portfolio: makePortfolio('majed', ['s', 's', 'p', 's', 's', 'p', 's', 's']),
  },
  {
    id: 'cr_layla',
    username: 'layla',
    ownerEmail: 'layla@hikaya.sa',
    displayNameEn: 'Layla Bin Hamad',
    displayNameAr: 'ليلى بن حمد',
    bioEn: 'Brand identity & art direction. I work with founders who care about typography.',
    bioAr: 'هويّة بصريّة وإدارة فنّية. أعمل مع مؤسّسين يهتمّون بالطباعة والحرف.',
    avatarUrl: pic('avatar-layla', 200, 200),
    coverUrl: pic('cover-layla', 1800, 800),
    disciplines: ['BRAND_IDENTITY', 'GRAPHIC_DESIGN'],
    city: 'RIYADH',
    startingPriceSar: 6500,
    yearsExperience: 6,
    languages: ['EN', 'AR'],
    availability: 'AVAILABLE',
    preferredLayout: 'MASONRY',
    reviewScore: 4.95,
    reviewCount: 27,
    isVerified: true,
    socialLinks: { website: 'https://layla.design' },
    portfolio: makePortfolio('layla', ['s', 'l', 's', 's', 'p', 's', 'l', 's']),
  },
  {
    id: 'cr_omar',
    username: 'omar',
    ownerEmail: 'omar@hikaya.sa',
    displayNameEn: 'Omar Saif',
    displayNameAr: 'عمر سيف',
    bioEn: 'Wedding videos that play like short films. Available across the Kingdom.',
    bioAr: 'فيديوهات أعراس تُعرض كأفلام قصيرة. متاح في كلّ المملكة.',
    avatarUrl: pic('avatar-omar', 200, 200),
    coverUrl: pic('cover-omar', 1800, 800),
    disciplines: ['WEDDING_VIDEO', 'EVENT_VIDEO'],
    city: 'JEDDAH',
    startingPriceSar: 9500,
    yearsExperience: 4,
    languages: ['AR', 'EN'],
    availability: 'AVAILABLE',
    preferredLayout: 'REEL',
    reviewScore: 4.85,
    reviewCount: 19,
    isVerified: false,
    socialLinks: { instagram: 'https://instagram.com/omar.frames' },
    portfolio: makePortfolio('omar', ['l', 'l', 's', 'l', 'p', 'l', 's']),
  },
  {
    id: 'cr_huda',
    username: 'huda',
    ownerEmail: 'huda@hikaya.sa',
    displayNameEn: 'Huda Al-Mutairi',
    displayNameAr: 'هدى المطيري',
    bioEn: 'Fashion & editorial. Shooting for Riyadh Fashion Week and a few quiet labels you should know.',
    bioAr: 'موضة وتحرير. أصوّر لأسبوع الرياض للموضة وعدد من الماركات الهادئة التي يجب أن تعرفها.',
    avatarUrl: pic('avatar-huda', 200, 200),
    coverUrl: pic('cover-huda', 1800, 800),
    disciplines: ['FASHION_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY'],
    city: 'RIYADH',
    startingPriceSar: 7500,
    yearsExperience: 8,
    languages: ['EN', 'AR'],
    availability: 'ON_VACATION',
    preferredLayout: 'EDITORIAL',
    reviewScore: 4.92,
    reviewCount: 33,
    isVerified: true,
    socialLinks: { instagram: 'https://instagram.com/huda.studio', website: 'https://huda.photo' },
    portfolio: makePortfolio('huda', ['p', 'p', 'l', 's', 'p', 'l', 'p', 's']),
  },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding creators + portfolios into Supabase...\n');

  // 1. Upsert User rows (CreatorProfile.userId references User.id)
  const userRows = CREATORS.map((c) => ({
    id: `user_${c.username}`,
    email: c.ownerEmail || `${c.username}@hikaya.sa`,
    displayName: c.displayNameEn,
    locale: 'EN',
    avatarUrl: c.avatarUrl,
    roles: ['CREATOR'],
    activeRole: 'CREATOR',
    authProvider: 'EMAIL',
    isSuspended: false,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));

  console.log(`Upserting ${userRows.length} User rows...`);
  const { data: userData, error: userError } = await supabase
    .from('User')
    .upsert(userRows, { onConflict: 'id' })
    .select('id');

  if (userError) {
    console.error('User upsert error:', userError);
    process.exit(1);
  }
  console.log(`  -> ${userData.length} User rows upserted`);

  // 2. Upsert CreatorProfile rows
  const profileRows = CREATORS.map((c) => ({
    id: c.id,
    userId: `user_${c.username}`,
    username: c.username,
    displayNameEn: c.displayNameEn,
    displayNameAr: c.displayNameAr,
    bioEn: c.bioEn,
    bioAr: c.bioAr,
    avatarUrl: c.avatarUrl,
    coverUrl: c.coverUrl,
    disciplines: c.disciplines,
    city: c.city,
    country: 'SA',
    startingPriceSar: c.startingPriceSar,
    yearsExperience: c.yearsExperience,
    languages: c.languages,
    availability: c.availability,
    socialLinks: c.socialLinks,
    isVerified: c.isVerified,
    reviewScore: c.reviewScore,
    reviewCount: c.reviewCount,
    preferredLayout: c.preferredLayout,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));

  console.log(`Upserting ${profileRows.length} CreatorProfile rows...`);
  const { data: profileData, error: profileError } = await supabase
    .from('CreatorProfile')
    .upsert(profileRows, { onConflict: 'id' })
    .select('id');

  if (profileError) {
    console.error('CreatorProfile upsert error:', profileError);
    process.exit(1);
  }
  console.log(`  -> ${profileData.length} CreatorProfile rows upserted`);

  // 3. Upsert PortfolioItem rows
  const portfolioRows = [];
  for (const c of CREATORS) {
    for (let i = 0; i < c.portfolio.length; i++) {
      const item = c.portfolio[i];
      portfolioRows.push({
        id: `pi_${c.username}_${i}`,
        creatorId: c.id,
        type: 'PHOTO',
        titleEn: item.titleEn || null,
        url: item.url,
        thumbnailUrl: item.url, // same for mock data
        width: item.width,
        height: item.height,
        orderIndex: i,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  }

  console.log(`Upserting ${portfolioRows.length} PortfolioItem rows...`);
  const { data: portfolioData, error: portfolioError } = await supabase
    .from('PortfolioItem')
    .upsert(portfolioRows, { onConflict: 'id' })
    .select('id');

  if (portfolioError) {
    console.error('PortfolioItem upsert error:', portfolioError);
    process.exit(1);
  }
  console.log(`  -> ${portfolioData.length} PortfolioItem rows upserted`);

  // 4. Verify counts
  const { count: userCount } = await supabase.from('User').select('*', { count: 'exact', head: true });
  const { count: profileCount } = await supabase.from('CreatorProfile').select('*', { count: 'exact', head: true });
  const { count: portfolioCount } = await supabase.from('PortfolioItem').select('*', { count: 'exact', head: true });

  console.log('\nFinal counts:');
  console.log(`  User:           ${userCount}`);
  console.log(`  CreatorProfile: ${profileCount}`);
  console.log(`  PortfolioItem:  ${portfolioCount}`);
  console.log('\nSeed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
