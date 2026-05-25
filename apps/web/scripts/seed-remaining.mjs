#!/usr/bin/env node
/**
 * Seed Supabase with the remaining 6 domains: Messaging, Quotes, Contracts,
 * Store (Products), Spaces, and Studio.
 *
 * Usage:
 *   node apps/web/scripts/seed-remaining.mjs
 *
 * Prerequisites:
 *   - Creators must already be seeded (run seed-creators.mjs first).
 *   - Content must already be seeded (run seed-content.mjs first).
 *   - For Spaces: run the SQL migration in scripts/migrate-missing-tables.sql
 *     via the Supabase SQL Editor first. If the table doesn't exist, the
 *     spaces seed will be skipped gracefully.
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

/** Day offset with specific hour, used for session times. */
function dayOffset(days, hour = 14, minute = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const SAR = 100; // 1 SAR = 100 halalas

// IDs from seed-creators.mjs
const USER_NOOR = 'user_noor';
const USER_YARA = 'user_yara';
const CR_NOOR = 'cr_noor';
const USER_CLIENT = 'user_client_brand';

// Studio owner user — we create if not exists
const USER_STUDIO = 'user_studio_owner';

/**
 * Check if a table exists by attempting a lightweight select.
 * Returns true if the table exists, false otherwise.
 */
async function tableExists(tableName) {
  const { error } = await supabase
    .from(tableName)
    .select('id', { count: 'exact', head: true });

  if (error && (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache')))
  )) {
    return false;
  }
  return true;
}

// ===========================================================================
// 1. MESSAGING (Thread + Message)
// ===========================================================================

async function seedMessaging() {
  console.log('\n=== Seeding Messaging (Thread + Message) ===\n');

  const threadRows = [
    {
      id: 'thread_noor_client_001',
      type: 'GENERAL',
      creatorUserId: USER_NOOR,
      clientUserId: USER_CLIENT,
      lastMessageAt: daysAgo(0),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
    },
    {
      id: 'thread_yara_client_001',
      type: 'GENERAL',
      creatorUserId: USER_YARA,
      clientUserId: USER_CLIENT,
      lastMessageAt: daysAgo(1),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
  ];

  console.log(`Upserting ${threadRows.length} Thread rows...`);
  const { data: threadData, error: threadError } = await supabase
    .from('Thread')
    .upsert(threadRows, { onConflict: 'id' })
    .select('id');

  if (threadError) {
    console.error('Thread upsert error:', threadError);
    return;
  }
  console.log(`  -> ${threadData.length} Thread rows upserted`);

  const messageRows = [
    // Thread 1: Noor <-> Client
    {
      id: 'msg_001',
      threadId: 'thread_noor_client_001',
      senderId: USER_CLIENT,
      body: "Hi Noor — saw your wedding work, it's exactly the mood we want. Are you free March 14?",
      status: 'READ',
      readAt: daysAgo(1),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'msg_002',
      threadId: 'thread_noor_client_001',
      senderId: USER_NOOR,
      body: "Thanks for reaching out! March 14 is open. Where's the ceremony?",
      status: 'READ',
      readAt: daysAgo(1),
      createdAt: new Date(now.getTime() - 2 * 86400000 + 15 * 60000).toISOString(),
      updatedAt: daysAgo(1),
    },
    {
      id: 'msg_003',
      threadId: 'thread_noor_client_001',
      senderId: USER_CLIENT,
      body: 'A small private venue north of Riyadh, mostly outdoor. Around 200 guests. We love your warm tones — would love to keep that in our deliverables.',
      status: 'READ',
      readAt: daysAgo(0),
      createdAt: new Date(now.getTime() - 86400000 - 30 * 60000).toISOString(),
      updatedAt: daysAgo(0),
    },
    {
      id: 'msg_004',
      threadId: 'thread_noor_client_001',
      senderId: USER_NOOR,
      body: "Lovely. I'll send a quote later today — gallery delivery in 4 weeks, edited collection of around 400 images. Would you like me to bring a second photographer?",
      status: 'DELIVERED',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    // Thread 2: Yara <-> Client
    {
      id: 'msg_005',
      threadId: 'thread_yara_client_001',
      senderId: USER_CLIENT,
      body: 'Yara, we need a 60-second hero film for our waterfront launch in Jeddah. Are you available next month?',
      status: 'READ',
      readAt: daysAgo(2),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      id: 'msg_006',
      threadId: 'thread_yara_client_001',
      senderId: USER_YARA,
      body: "I'd love to take this on. I have my own Mavic 3 for the aerial sequences. Let me put together a treatment and budget by Thursday.",
      status: 'DELIVERED',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  console.log(`Upserting ${messageRows.length} Message rows...`);
  const { data: msgData, error: msgError } = await supabase
    .from('Message')
    .upsert(messageRows, { onConflict: 'id' })
    .select('id');

  if (msgError) {
    console.error('Message upsert error:', msgError);
    return;
  }
  console.log(`  -> ${msgData.length} Message rows upserted`);
}

// ===========================================================================
// 2. QUOTES (requires a Booking row for the FK)
// ===========================================================================

async function seedQuotes() {
  console.log('\n=== Seeding Quotes (Booking + Quote + QuoteLineItem) ===\n');

  // First ensure a ClientProfile exists for the client user
  const clientProfileRow = {
    id: 'cp_client_brand',
    userId: USER_CLIENT,
    isBusiness: true,
    companyName: 'Al-Asalah Studio',
    city: 'RIYADH',
    country: 'SA',
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  console.log('Upserting ClientProfile...');
  const { error: cpError } = await supabase
    .from('ClientProfile')
    .upsert([clientProfileRow], { onConflict: 'id' })
    .select('id');

  if (cpError) {
    console.error('ClientProfile upsert error:', cpError);
    return;
  }
  console.log('  -> ClientProfile upserted');

  // Create a Booking row for the quote to reference
  const bookingRow = {
    id: 'bk_seed_noor_sara',
    clientProfileId: 'cp_client_brand',
    creatorProfileId: CR_NOOR,
    discipline: 'WEDDING_PHOTOGRAPHY',
    status: 'QUOTED',
    sessionStart: inDays(14),
    sessionEnd: inDays(14),
    city: 'RIYADH',
    locationDetail: 'Private venue north of Riyadh',
    notes: 'Outdoor ceremony, 200 guests, golden-hour priority.',
    totalHalalas: 180_000 * SAR / 100,
    depositHalalas: 90_000 * SAR / 100,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  };

  console.log('Upserting Booking row...');
  const { error: bkError } = await supabase
    .from('Booking')
    .upsert([bookingRow], { onConflict: 'id' })
    .select('id');

  if (bkError) {
    console.error('Booking upsert error:', bkError);
    return;
  }
  console.log('  -> Booking upserted');

  // Quote row
  const quoteRow = {
    id: 'q_sara_001',
    bookingId: 'bk_seed_noor_sara',
    number: 'Q-2026-0001',
    status: 'SENT',
    expiresAt: inDays(7),
    notes: 'Includes raw files for the first dance only. Hard drive delivery in 4 weeks.',
    subtotalHalalas: 1_800_000,
    vatHalalas: 270_000,
    discountHalalas: 0,
    totalHalalas: 2_070_000,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  };

  console.log('Upserting 1 Quote row...');
  const { data: quoteData, error: quoteError } = await supabase
    .from('Quote')
    .upsert([quoteRow], { onConflict: 'id' })
    .select('id');

  if (quoteError) {
    console.error('Quote upsert error:', quoteError);
    return;
  }
  console.log(`  -> ${quoteData.length} Quote rows upserted`);

  // QuoteLineItem rows
  const lineItemRows = [
    {
      id: 'qli_sara_001_1',
      quoteId: 'q_sara_001',
      descriptionEn: 'Wedding day coverage (8 hours)',
      descriptionAr: 'تغطية يوم الزفاف (٨ ساعات)',
      quantity: 1,
      unitHalalas: 1_200_000,
      totalHalalas: 1_200_000,
      orderIndex: 0,
    },
    {
      id: 'qli_sara_001_2',
      quoteId: 'q_sara_001',
      descriptionEn: 'Second photographer',
      descriptionAr: 'مصوّر مساعد',
      quantity: 1,
      unitHalalas: 350_000,
      totalHalalas: 350_000,
      orderIndex: 1,
    },
    {
      id: 'qli_sara_001_3',
      quoteId: 'q_sara_001',
      descriptionEn: 'Edited gallery — 400 images',
      descriptionAr: 'معرض محرَّر — ٤٠٠ صورة',
      quantity: 1,
      unitHalalas: 250_000,
      totalHalalas: 250_000,
      orderIndex: 2,
    },
  ];

  console.log(`Upserting ${lineItemRows.length} QuoteLineItem rows...`);
  const { data: liData, error: liError } = await supabase
    .from('QuoteLineItem')
    .upsert(lineItemRows, { onConflict: 'id' })
    .select('id');

  if (liError) {
    console.error('QuoteLineItem upsert error:', liError);
    return;
  }
  console.log(`  -> ${liData.length} QuoteLineItem rows upserted`);
}

// ===========================================================================
// 3. CONTRACTS
// ===========================================================================

async function seedContracts() {
  console.log('\n=== Seeding Contracts ===\n');

  // Create a second booking that has progressed to CONTRACTED state
  const bookingRow = {
    id: 'bk_seed_noor_faisal',
    clientProfileId: 'cp_client_brand',
    creatorProfileId: CR_NOOR,
    discipline: 'COMMERCIAL_PHOTOGRAPHY',
    status: 'CONTRACTED',
    sessionStart: inDays(5),
    sessionEnd: inDays(5),
    city: 'RIYADH',
    notes: 'Product shoot for luxury perfume line.',
    totalHalalas: 450_000,
    depositHalalas: 0,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  };

  console.log('Upserting Booking row for contract...');
  const { error: bkError } = await supabase
    .from('Booking')
    .upsert([bookingRow], { onConflict: 'id' })
    .select('id');

  if (bkError) {
    console.error('Booking upsert error:', bkError);
    return;
  }

  const contractRow = {
    id: 'c_seed_noor_faisal',
    bookingId: 'bk_seed_noor_faisal',
    status: 'SENT',
    bodyHtml: '<p>Photography services agreement between Noor Al-Saadi and Al-Asalah Studio.</p>',
    scopeOfWork: 'The Photographer agrees to provide creative services as detailed in the attached quote, including pre-session planning, the session(s) listed therein, and post-production through digital delivery.',
    deliverables: 'Edited digital images delivered via a private Hikaya gallery within four (4) weeks of the session date. Originals (RAW) are not delivered unless explicitly listed in the quote.',
    paymentTerms: 'A 50% non-refundable retainer is due upon signature. The remaining balance is due no later than the day before the session. All payments are processed in SAR including 15% VAT where applicable.',
    cancellationPolicy: 'Cancellation by the Client more than 30 days before the session: retainer applied to a future booking within 12 months. Within 30 days: retainer is forfeit.',
    usageRights: 'The Client receives a personal-use license to all delivered images. Commercial use requires a separate written license. The Photographer retains copyright.',
    additionalTerms: "Either party may amend this agreement only in writing, signed by both. Disputes shall be resolved per Hikaya's published dispute-resolution policy.",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  };

  console.log('Upserting 1 Contract row...');
  const { data: contractData, error: contractError } = await supabase
    .from('Contract')
    .upsert([contractRow], { onConflict: 'id' })
    .select('id');

  if (contractError) {
    console.error('Contract upsert error:', contractError);
    return;
  }
  console.log(`  -> ${contractData.length} Contract rows upserted`);
}

// ===========================================================================
// 4. STORE (Product)
// ===========================================================================

async function seedProducts() {
  console.log('\n=== Seeding Store (Product) ===\n');

  const productRows = [
    {
      id: 'p_noor_warm_pack',
      creatorId: CR_NOOR,
      slug: 'warm-light-preset-pack',
      titleEn: 'Warm Light — Lightroom preset pack',
      titleAr: 'حزمة Lightroom — ضوء دافئ',
      descriptionEn: 'A 12-preset pack tuned for warm, natural-light portraits and weddings. Built on Lightroom Classic 13+, ports cleanly to mobile.',
      descriptionAr: 'حزمة من ١٢ بريسِت موجَّهة لبورتريهات وأعراس بضوء طبيعيّ دافئ.',
      category: 'PRESET',
      status: 'ACTIVE',
      priceHalalas: 149 * SAR,
      freeSampleUrl: 'https://files.example.com/warm-light-sample.xmp',
      fileUrls: ['https://files.example.com/warm-light-preset-pack.zip'],
      previewImageUrls: [pic('warm-1', 1200, 800), pic('warm-2', 1200, 800), pic('warm-3', 1200, 800)],
      compatibleSoftware: ['Lightroom Classic', 'Lightroom Mobile'],
      salesCount: 142,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5),
    },
    {
      id: 'p_noor_golden_lut',
      creatorId: CR_NOOR,
      slug: 'golden-hour-lut',
      titleEn: 'Golden Hour — Cinema LUT',
      titleAr: 'الساعة الذهبيّة — LUT سينمائي',
      descriptionEn: "A single .cube LUT at 33x33 — built for Sony S-Log3 footage but works on Rec.709 with a slight reduction.",
      descriptionAr: 'ملف .cube مفرد بدقّة ٣٣×٣٣ — مصنوع لمواد Sony S-Log3.',
      category: 'LUT',
      status: 'ACTIVE',
      priceHalalas: 89 * SAR,
      fileUrls: ['https://files.example.com/golden-hour.cube'],
      previewImageUrls: [pic('lut-1', 1400, 800), pic('lut-2', 1400, 800)],
      compatibleSoftware: ['DaVinci Resolve', 'Premiere Pro', 'Final Cut Pro'],
      salesCount: 87,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(10),
    },
    {
      id: 'p_noor_invitation_template',
      creatorId: CR_NOOR,
      slug: 'editorial-invitation-template',
      titleEn: 'Editorial — Wedding invitation template',
      titleAr: 'قالب دعوة زفاف — تحريريّ',
      descriptionEn: 'A six-page wedding invitation suite. Editable on Canva — bilingual EN+AR layouts included.',
      descriptionAr: 'مجموعة دعوة زفاف من ٦ صفحات. قابل للتعديل على Canva.',
      category: 'TEMPLATE',
      status: 'ACTIVE',
      priceHalalas: 220 * SAR,
      fileUrls: ['https://files.example.com/editorial-invitation.zip'],
      previewImageUrls: [pic('inv-1', 900, 1200), pic('inv-2', 900, 1200), pic('inv-3', 900, 1200)],
      compatibleSoftware: ['Canva', 'Adobe InDesign'],
      salesCount: 31,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(20),
    },
    {
      id: 'p_noor_overlay_pack',
      creatorId: CR_NOOR,
      slug: 'film-grain-overlay-pack',
      titleEn: 'Film grain — overlay pack',
      titleAr: 'حبيبات أفلام — حزمة طبقات',
      descriptionEn: 'Twelve high-resolution film-grain overlays (4K PNG, transparent).',
      descriptionAr: 'اثنتا عشرة طبقة حبيبات أفلام بدقّة عالية.',
      category: 'OVERLAY',
      status: 'ACTIVE',
      priceHalalas: 65 * SAR,
      fileUrls: ['https://files.example.com/film-grain.zip'],
      previewImageUrls: [pic('grain-1', 1200, 1200)],
      compatibleSoftware: ['Photoshop', 'Affinity Photo'],
      salesCount: 56,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(15),
    },
    {
      id: 'p_noor_workflow_guide',
      creatorId: CR_NOOR,
      slug: 'wedding-workflow-guide',
      titleEn: 'Wedding workflow — 80-page PDF guide',
      titleAr: 'سير عمل الأعراس — دليل PDF من ٨٠ صفحة',
      descriptionEn: 'Everything I learned in seven years of shooting weddings.',
      descriptionAr: 'كلّ ما تعلّمته في ٧ سنوات من تصوير الأعراس.',
      category: 'GUIDE',
      status: 'ACTIVE',
      priceHalalas: 350 * SAR,
      fileUrls: ['https://files.example.com/wedding-workflow.pdf'],
      previewImageUrls: [pic('guide-1', 1200, 800)],
      compatibleSoftware: [],
      salesCount: 24,
      createdAt: daysAgo(120),
      updatedAt: daysAgo(30),
    },
    {
      id: 'p_noor_oud_lut',
      creatorId: CR_NOOR,
      slug: 'oud-warm-lut',
      titleEn: 'Oud — warm interior LUT',
      titleAr: 'عود — LUT داخليّ دافئ',
      descriptionEn: 'Tuned for warm interior light (oud, candles, ambient lamps).',
      descriptionAr: 'موجَّه للضوء الداخليّ الدافئ.',
      category: 'LUT',
      status: 'DRAFT',
      priceHalalas: 79 * SAR,
      fileUrls: ['https://files.example.com/oud-warm.cube'],
      previewImageUrls: [pic('oud-1', 1400, 800)],
      compatibleSoftware: ['DaVinci Resolve', 'Premiere Pro'],
      salesCount: 0,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  ];

  console.log(`Upserting ${productRows.length} Product rows...`);
  const { data: productData, error: productError } = await supabase
    .from('Product')
    .upsert(productRows, { onConflict: 'id' })
    .select('id');

  if (productError) {
    console.error('Product upsert error:', productError);
    return;
  }
  console.log(`  -> ${productData.length} Product rows upserted`);
}

// ===========================================================================
// 5. SPACES (Space + SpaceBooking — tables may not exist)
// ===========================================================================

async function seedSpaces() {
  console.log('\n=== Seeding Spaces (Space + SpaceBooking) ===\n');

  const exists = await tableExists('Space');
  if (!exists) {
    console.log('  SKIPPED — "Space" table does not exist.');
    console.log('  Run the SQL migration in scripts/migrate-missing-tables.sql first.');
    return;
  }

  const spaceRows = [
    {
      id: 'sp_noor_cyc_riyadh',
      ownerId: USER_NOOR,
      name: 'Cyc Wall Studio — Olaya',
      description: 'A 90sqm shooting bay with a seamless white cyclorama, 4m ceilings, and three Profoto B10X heads on stands.',
      address: 'King Fahd Road, Olaya',
      city: 'RIYADH',
      capacity: 12,
      hourlyHalalas: 250 * SAR,
      dailyHalalas: 1800 * SAR,
      equipmentIncluded: ['Cyclorama', 'Profoto B10X x3', 'Backdrops', 'C-stands'],
      photos: [pic('cyc-1', 1600, 1067), pic('cyc-2', 1600, 1067), pic('cyc-3', 1600, 1067)],
      status: 'ACTIVE',
      createdAt: daysAgo(60),
      updatedAt: daysAgo(5),
    },
    {
      id: 'sp_noor_daylight_jeddah',
      ownerId: USER_NOOR,
      name: 'North-Facing Daylight Loft — Al Hamra',
      description: 'Quiet 6th-floor loft with north-facing floor-to-ceiling windows. Soft daylight from 9am to 4pm year-round.',
      address: 'Al Hamra District',
      city: 'JEDDAH',
      capacity: 8,
      hourlyHalalas: 180 * SAR,
      dailyHalalas: 1200 * SAR,
      equipmentIncluded: ['Diffusion frames', 'Reflectors', 'Wardrobe rack', 'Kitchenette'],
      photos: [pic('daylight-1', 1600, 1067), pic('daylight-2', 1600, 1067), pic('daylight-3', 1600, 1067)],
      status: 'ACTIVE',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(10),
    },
    {
      id: 'sp_noor_podcast_riyadh',
      ownerId: USER_NOOR,
      name: 'Three-Camera Podcast Studio — Diplomatic Quarter',
      description: 'Pre-lit four-seat podcast set with three Sony FX3 cameras, Shure SM7B mics, and a Rodecaster Pro II.',
      address: 'Diplomatic Quarter',
      city: 'RIYADH',
      capacity: 6,
      hourlyHalalas: 350 * SAR,
      dailyHalalas: 2400 * SAR,
      equipmentIncluded: ['Sony FX3 x3', 'Shure SM7B x4', 'Rodecaster Pro II', 'Engineer included'],
      photos: [pic('podcast-1', 1600, 1067), pic('podcast-2', 1600, 1067)],
      status: 'ACTIVE',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(8),
    },
    {
      id: 'sp_noor_rooftop_khobar',
      ownerId: USER_NOOR,
      name: 'Corniche Rooftop — Golden Hour',
      description: 'Open-air rooftop on the Khobar Corniche with unobstructed Gulf views.',
      address: 'Corniche Road',
      city: 'KHOBAR',
      capacity: 20,
      hourlyHalalas: 220 * SAR,
      dailyHalalas: 1500 * SAR,
      equipmentIncluded: ['Power drops', 'Shade canopy', 'Loading lift'],
      photos: [pic('rooftop-1', 1600, 1067), pic('rooftop-2', 1600, 1067)],
      status: 'ACTIVE',
      createdAt: daysAgo(25),
      updatedAt: daysAgo(3),
    },
    {
      id: 'sp_noor_blackbox_jeddah',
      ownerId: USER_NOOR,
      name: 'Blackbox Stage — Andalus',
      description: 'Light-tight 120sqm blackbox with a 6x6m green-screen drop and dimmable Aputure 1200d.',
      address: 'Andalus District',
      city: 'JEDDAH',
      capacity: 15,
      hourlyHalalas: 280 * SAR,
      dailyHalalas: 1950 * SAR,
      equipmentIncluded: ['Green screen', 'Aputure 1200d', 'C-stands', 'Sound dampening'],
      photos: [pic('blackbox-1', 1600, 1067), pic('blackbox-2', 1600, 1067), pic('blackbox-3', 1600, 1067)],
      status: 'ACTIVE',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(2),
    },
    {
      id: 'sp_noor_lounge_riyadh',
      ownerId: USER_NOOR,
      name: 'Lounge Set — Diriyah',
      description: 'Furnished majlis-style lounge set with warm practical lighting.',
      address: 'Diriyah',
      city: 'RIYADH',
      capacity: 10,
      hourlyHalalas: 200 * SAR,
      dailyHalalas: 1400 * SAR,
      equipmentIncluded: ['Practical lights', 'Props library', 'Wardrobe room'],
      photos: [pic('lounge-1', 1600, 1067), pic('lounge-2', 1600, 1067)],
      status: 'ACTIVE',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(1),
    },
  ];

  console.log(`Upserting ${spaceRows.length} Space rows...`);
  const { data: spaceData, error: spaceError } = await supabase
    .from('Space')
    .upsert(spaceRows, { onConflict: 'id' })
    .select('id');

  if (spaceError) {
    console.error('Space upsert error:', spaceError);
    return;
  }
  console.log(`  -> ${spaceData.length} Space rows upserted`);

  // SpaceBooking rows
  const bookingRows = [
    {
      id: 'sb_seed_1',
      spaceId: 'sp_noor_cyc_riyadh',
      renterId: USER_CLIENT,
      startISO: dayOffset(5, 9),
      endISO: dayOffset(5, 18),
      durationKind: 'DAILY',
      totalHalalas: 1800 * SAR,
      status: 'CONFIRMED',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: 'sb_seed_2',
      spaceId: 'sp_noor_podcast_riyadh',
      renterId: USER_CLIENT,
      startISO: dayOffset(12, 14),
      endISO: dayOffset(12, 18),
      durationKind: 'HOURLY',
      totalHalalas: 4 * 350 * SAR,
      status: 'PENDING',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  console.log(`Upserting ${bookingRows.length} SpaceBooking rows...`);
  const { data: sbData, error: sbError } = await supabase
    .from('SpaceBooking')
    .upsert(bookingRows, { onConflict: 'id' })
    .select('id');

  if (sbError) {
    console.error('SpaceBooking upsert error:', sbError);
    return;
  }
  console.log(`  -> ${sbData.length} SpaceBooking rows upserted`);
}

// ===========================================================================
// 6. STUDIO (StudioProfile + StudioMember + Booking as CRM data)
// ===========================================================================

async function seedStudio() {
  console.log('\n=== Seeding Studio (StudioProfile + StudioMember + Bookings) ===\n');

  // Ensure the studio owner user exists
  const studioUserRow = {
    id: USER_STUDIO,
    email: 'studio@hikaya.sa',
    displayName: 'Crescent Studio',
    locale: 'EN',
    roles: ['STUDIO_OWNER'],
    activeRole: 'STUDIO_OWNER',
    authProvider: 'EMAIL',
    isSuspended: false,
    updatedAt: isoNow,
    createdAt: isoNow,
  };

  console.log('Upserting studio owner User row...');
  const { error: userError } = await supabase
    .from('User')
    .upsert([studioUserRow], { onConflict: 'id' })
    .select('id');

  if (userError) {
    console.error('Studio User upsert error:', userError);
    return;
  }
  console.log('  -> Studio owner user upserted');

  // Studio profile
  const studioProfileRow = {
    id: 'studio_crescent',
    userId: USER_STUDIO,
    slug: 'crescent-studio',
    nameEn: 'Crescent Studio',
    nameAr: 'استوديو الهلال',
    logoUrl: 'https://picsum.photos/seed/crescent-logo/200/200',
    coverUrl: 'https://picsum.photos/seed/crescent-cover/1800/800',
    city: 'RIYADH',
    country: 'SA',
    address: 'King Fahd Rd, Riyadh',
    descriptionEn: 'A boutique production studio in Riyadh focused on weddings, portraiture, and brand films.',
    descriptionAr: 'استوديو إنتاج بوتيكي في الرياض يركز على الأعراس والصور الشخصية والأفلام التجارية.',
    specialties: ['WEDDING_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY', 'COMMERCIAL_PHOTOGRAPHY'],
    capacity: 3,
    isVerified: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5),
  };

  console.log('Upserting StudioProfile...');
  const { data: spData, error: spError } = await supabase
    .from('StudioProfile')
    .upsert([studioProfileRow], { onConflict: 'id' })
    .select('id');

  if (spError) {
    console.error('StudioProfile upsert error:', spError);
    return;
  }
  console.log(`  -> ${spData.length} StudioProfile rows upserted`);

  // Studio member (Noor is a member of Crescent Studio)
  const memberRow = {
    id: 'sm_noor_crescent',
    studioId: 'studio_crescent',
    userId: USER_NOOR,
    creatorProfileId: CR_NOOR,
    isAdmin: false,
    joinedAt: daysAgo(60),
  };

  console.log('Upserting StudioMember...');
  const { data: smData, error: smError } = await supabase
    .from('StudioMember')
    .upsert([memberRow], { onConflict: 'id' })
    .select('id');

  if (smError) {
    console.error('StudioMember upsert error:', smError);
    return;
  }
  console.log(`  -> ${smData.length} StudioMember rows upserted`);

  // Create client users for studio CRM bookings
  const clientUsers = [
    { id: 'user_cl_aldosari', email: 'reem@example.com', displayName: 'Reem Al-Dosari' },
    { id: 'user_cl_alharbi', email: 'sara@example.com', displayName: 'Sara Al-Harbi' },
    { id: 'user_cl_almutlaq', email: 'faisal@brand.sa', displayName: 'Faisal Al-Mutlaq' },
    { id: 'user_cl_lina', email: 'lina@example.com', displayName: 'Lina Al-Otaibi' },
    { id: 'user_cl_arwa', email: 'arwa@studio.sa', displayName: 'Arwa Hassan' },
  ];

  const clientUserRows = clientUsers.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    locale: 'EN',
    roles: ['CLIENT'],
    activeRole: 'CLIENT',
    authProvider: 'EMAIL',
    isSuspended: false,
    updatedAt: isoNow,
    createdAt: isoNow,
  }));

  console.log(`Upserting ${clientUserRows.length} client User rows...`);
  const { error: cuError } = await supabase
    .from('User')
    .upsert(clientUserRows, { onConflict: 'id' })
    .select('id');

  if (cuError) {
    console.error('Client User upsert error:', cuError);
    return;
  }
  console.log('  -> Client users upserted');

  // Client profiles
  const clientProfileRows = [
    { id: 'cp_aldosari', userId: 'user_cl_aldosari', isBusiness: false, city: 'RIYADH', country: 'SA', createdAt: isoNow, updatedAt: isoNow },
    { id: 'cp_alharbi', userId: 'user_cl_alharbi', isBusiness: false, city: 'RIYADH', country: 'SA', createdAt: isoNow, updatedAt: isoNow },
    { id: 'cp_almutlaq', userId: 'user_cl_almutlaq', isBusiness: true, companyName: 'Faisal Brand Co.', city: 'RIYADH', country: 'SA', createdAt: isoNow, updatedAt: isoNow },
    { id: 'cp_lina', userId: 'user_cl_lina', isBusiness: false, city: 'RIYADH', country: 'SA', createdAt: isoNow, updatedAt: isoNow },
    { id: 'cp_arwa', userId: 'user_cl_arwa', isBusiness: true, companyName: 'Arwa Studio', city: 'RIYADH', country: 'SA', createdAt: isoNow, updatedAt: isoNow },
  ];

  console.log(`Upserting ${clientProfileRows.length} ClientProfile rows...`);
  const { error: cpError } = await supabase
    .from('ClientProfile')
    .upsert(clientProfileRows, { onConflict: 'id' })
    .select('id');

  if (cpError) {
    console.error('ClientProfile upsert error:', cpError);
    return;
  }
  console.log('  -> Client profiles upserted');

  // Studio CRM bookings — these reference StudioProfile and use Booking table
  const studioBookingRows = [
    {
      id: 'bk_studio_001',
      clientProfileId: 'cp_alharbi',
      creatorProfileId: CR_NOOR,
      studioProfileId: 'studio_crescent',
      discipline: 'WEDDING_PHOTOGRAPHY',
      status: 'CONFIRMED',
      sessionStart: dayOffset(2, 17, 0),
      sessionEnd: dayOffset(2, 23, 0),
      city: 'RIYADH',
      notes: 'Outdoor ceremony, 200 guests, golden-hour priority.',
      totalHalalas: 1_200_000,
      depositHalalas: 600_000,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(7),
    },
    {
      id: 'bk_studio_002',
      clientProfileId: 'cp_almutlaq',
      creatorProfileId: CR_NOOR,
      studioProfileId: 'studio_crescent',
      discipline: 'COMMERCIAL_PHOTOGRAPHY',
      status: 'CONTRACTED',
      sessionStart: dayOffset(5, 10, 0),
      sessionEnd: dayOffset(5, 14, 0),
      city: 'RIYADH',
      totalHalalas: 450_000,
      depositHalalas: 0,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(5),
    },
    {
      id: 'bk_studio_003',
      clientProfileId: 'cp_aldosari',
      creatorProfileId: CR_NOOR,
      studioProfileId: 'studio_crescent',
      discipline: 'PORTRAIT_PHOTOGRAPHY',
      status: 'QUOTED',
      sessionStart: dayOffset(9, 16, 0),
      sessionEnd: dayOffset(9, 18, 0),
      city: 'RIYADH',
      totalHalalas: 180_000,
      depositHalalas: 0,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      id: 'bk_studio_004',
      clientProfileId: 'cp_lina',
      creatorProfileId: CR_NOOR,
      studioProfileId: 'studio_crescent',
      discipline: 'WEDDING_PHOTOGRAPHY',
      status: 'CONFIRMED',
      sessionStart: dayOffset(14, 18, 0),
      sessionEnd: dayOffset(15, 2, 0),
      city: 'RIYADH',
      totalHalalas: 1_650_000,
      depositHalalas: 825_000,
      createdAt: daysAgo(21),
      updatedAt: daysAgo(10),
    },
    {
      id: 'bk_studio_005',
      clientProfileId: 'cp_aldosari',
      creatorProfileId: CR_NOOR,
      studioProfileId: 'studio_crescent',
      discipline: 'PRODUCT_PHOTOGRAPHY',
      status: 'COMPLETED',
      sessionStart: dayOffset(-12, 11, 0),
      sessionEnd: dayOffset(-12, 14, 0),
      city: 'RIYADH',
      totalHalalas: 220_000,
      depositHalalas: 220_000,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(12),
    },
    {
      id: 'bk_studio_006',
      clientProfileId: 'cp_arwa',
      creatorProfileId: CR_NOOR,
      studioProfileId: 'studio_crescent',
      discipline: 'EVENT_PHOTOGRAPHY',
      status: 'DELIVERED',
      sessionStart: dayOffset(-5, 19, 0),
      sessionEnd: dayOffset(-5, 23, 0),
      city: 'RIYADH',
      totalHalalas: 380_000,
      depositHalalas: 190_000,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(5),
    },
  ];

  console.log(`Upserting ${studioBookingRows.length} studio Booking rows...`);
  const { data: bkData, error: bkError } = await supabase
    .from('Booking')
    .upsert(studioBookingRows, { onConflict: 'id' })
    .select('id');

  if (bkError) {
    console.error('Studio Booking upsert error:', bkError);
    return;
  }
  console.log(`  -> ${bkData.length} studio Booking rows upserted`);
}

// ===========================================================================
// Main
// ===========================================================================

async function seed() {
  console.log('Seeding remaining 6 domains into Supabase...');
  console.log('(Requires seed-creators.mjs + seed-content.mjs to have run first.)\n');

  await seedMessaging();
  await seedQuotes();
  await seedContracts();
  await seedProducts();
  await seedSpaces();
  await seedStudio();

  // ---------------------------------------------------------------------------
  // Verify counts
  // ---------------------------------------------------------------------------
  console.log('\n=== Final Counts ===\n');

  const tables = [
    'Thread', 'Message',
    'Booking', 'Quote', 'QuoteLineItem',
    'Contract',
    'Product',
    'StudioProfile', 'StudioMember',
    'ClientProfile',
  ];

  for (const table of tables) {
    try {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`  ${table.padEnd(20)} ${count}`);
    } catch {
      console.log(`  ${table.padEnd(20)} (error)`);
    }
  }

  // Space tables may not exist
  for (const table of ['Space', 'SpaceBooking']) {
    const exists = await tableExists(table);
    if (exists) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`  ${table.padEnd(20)} ${count}`);
    } else {
      console.log(`  ${table.padEnd(20)} (table does not exist — run migrate-missing-tables.sql)`);
    }
  }

  console.log('\nSeed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
