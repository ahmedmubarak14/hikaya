/**
 * Creator-store shapes — mirror the Prisma `Product`, `Order`, and
 * `OrderItem` models. Money in halalas; the PRD specifies a 12% platform
 * commission on every sale, settled instantly (no escrow for digital
 * products). The mock honors all of that on the server side.
 */

export type ProductCategory = 'PRESET' | 'LUT' | 'TEMPLATE' | 'OVERLAY' | 'GUIDE' | 'BUNDLE' | 'OTHER';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Product {
  id: string;
  /** CreatorProfile.id of the seller. */
  creatorId: string;
  slug: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn: string;
  descriptionAr?: string;
  category: ProductCategory;
  status: ProductStatus;
  priceHalalas: number;
  /** 1–10 preview image URLs. First is the cover. */
  previewImageUrls: string[];
  /** Pretend file URL — the eventual flow signs a Cloudinary download. */
  fileUrl: string;
  /** Optional free sample URL the creator can publish. */
  freeSampleUrl?: string;
  /** Software tags surfaced as pills on the product page. */
  compatibleSoftware: string[];
  /** IDs of products included in a BUNDLE. Empty for non-bundle products. */
  bundleItems: string[];
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productTitleEn: string;
  unitHalalas: number;
  /** Platform's 12% slice, recorded at sale time. */
  commissionHalalas: number;
  /** Random opaque token gates the download URL. */
  downloadToken: string;
  /** ISO — link expires after 7 days per the PRD. Account access is indefinite. */
  downloadExpiresAt: string;
}

export interface Order {
  id: string;
  /** mock-auth user id of the buyer. */
  buyerUserId: string;
  buyerName: string;
  totalHalalas: number;
  items: OrderItem[];
  createdAt: string;
}

/* --------------------------- pricing helpers --------------------------- */

export const PLATFORM_COMMISSION_RATE = 0.12 as const;

export function commissionFor(halalas: number): number {
  return Math.round(halalas * PLATFORM_COMMISSION_RATE);
}

export function creatorTakeFor(halalas: number): number {
  return halalas - commissionFor(halalas);
}

/* -------------------------------- seed --------------------------------- */

const pic = (seed: string, w: number, h: number): string =>
  `https://picsum.photos/seed/store-${seed}/${w}/${h}`;

const now = new Date().toISOString();
const SAR = 100;

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'p_noor_warm_pack',
    creatorId: 'cr_noor',
    slug: 'warm-light-preset-pack',
    titleEn: 'Warm Light — Lightroom preset pack',
    titleAr: 'حزمة Lightroom — ضوء دافئ',
    descriptionEn:
      'A 12-preset pack tuned for warm, natural-light portraits and weddings. Built on Lightroom Classic 13+, ports cleanly to mobile. Each preset has soft skin retention and a film-leaning grade.',
    descriptionAr:
      'حزمة من ١٢ بريسِت موجَّهة لبورتريهات وأعراس بضوء طبيعيّ دافئ. تعمل على Lightroom Classic 13+ وتُنقل لتطبيق الجوال. كلّ بريسِت يحافظ على نعومة البشرة بدرجة لون سينمائيّة.',
    category: 'PRESET',
    status: 'ACTIVE',
    priceHalalas: 149 * SAR,
    previewImageUrls: [
      pic('warm-1', 1200, 800),
      pic('warm-2', 1200, 800),
      pic('warm-3', 1200, 800),
    ],
    fileUrl: 'https://files.example.com/warm-light-preset-pack.zip',
    freeSampleUrl: 'https://files.example.com/warm-light-sample.xmp',
    compatibleSoftware: ['Lightroom Classic', 'Lightroom Mobile'],
    bundleItems: [],
    salesCount: 142,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p_noor_golden_lut',
    creatorId: 'cr_noor',
    slug: 'golden-hour-lut',
    titleEn: 'Golden Hour — Cinema LUT',
    titleAr: 'الساعة الذهبيّة — LUT سينمائي',
    descriptionEn:
      "A single .cube LUT at 33×33 — built for Sony S-Log3 footage but works on Rec.709 with a slight reduction. Exactly the look you'll see on this profile's reels.",
    descriptionAr:
      'ملف .cube مفرد بدقّة ٣٣×٣٣ — مصنوع لمواد Sony S-Log3 ويعمل على Rec.709 بتخفيف بسيط.',
    category: 'LUT',
    status: 'ACTIVE',
    priceHalalas: 89 * SAR,
    previewImageUrls: [pic('lut-1', 1400, 800), pic('lut-2', 1400, 800)],
    fileUrl: 'https://files.example.com/golden-hour.cube',
    compatibleSoftware: ['DaVinci Resolve', 'Premiere Pro', 'Final Cut Pro'],
    bundleItems: [],
    salesCount: 87,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p_noor_invitation_template',
    creatorId: 'cr_noor',
    slug: 'editorial-invitation-template',
    titleEn: 'Editorial — Wedding invitation template',
    titleAr: 'قالب دعوة زفاف — تحريريّ',
    descriptionEn:
      'A six-page wedding invitation suite (save-the-date, ceremony, RSVP, schedule, transport, thank-you). Editable on Canva — bilingual EN+AR layouts included.',
    descriptionAr:
      'مجموعة دعوة زفاف من ٦ صفحات (احفظ التاريخ، حفل الزفاف، تأكيد الحضور، الجدول، المواصلات، شكراً). قابل للتعديل على Canva — تخطيطات ثنائيّة اللغة مرفقة.',
    category: 'TEMPLATE',
    status: 'ACTIVE',
    priceHalalas: 220 * SAR,
    previewImageUrls: [pic('inv-1', 900, 1200), pic('inv-2', 900, 1200), pic('inv-3', 900, 1200)],
    fileUrl: 'https://files.example.com/editorial-invitation.zip',
    compatibleSoftware: ['Canva', 'Adobe InDesign'],
    bundleItems: [],
    salesCount: 31,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p_noor_overlay_pack',
    creatorId: 'cr_noor',
    slug: 'film-grain-overlay-pack',
    titleEn: 'Film grain — overlay pack',
    titleAr: 'حبيبات أفلام — حزمة طبقات',
    descriptionEn:
      'Twelve high-resolution film-grain overlays (4K PNG, transparent). Drag onto any image in Photoshop or Affinity Photo. Drop opacity to taste.',
    descriptionAr:
      'اثنتا عشرة طبقة حبيبات أفلام بدقّة عالية (PNG شفّاف ٤K). أسقطها على أيّ صورة في Photoshop أو Affinity Photo.',
    category: 'OVERLAY',
    status: 'ACTIVE',
    priceHalalas: 65 * SAR,
    previewImageUrls: [pic('grain-1', 1200, 1200)],
    fileUrl: 'https://files.example.com/film-grain.zip',
    compatibleSoftware: ['Photoshop', 'Affinity Photo'],
    bundleItems: [],
    salesCount: 56,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p_noor_workflow_guide',
    creatorId: 'cr_noor',
    slug: 'wedding-workflow-guide',
    titleEn: 'Wedding workflow — 80-page PDF guide',
    titleAr: 'سير عمل الأعراس — دليل PDF من ٨٠ صفحة',
    descriptionEn:
      'Everything I learned in seven years of shooting weddings, including my client-onboarding doc, shoot timeline template, and gear list. EN only for now; Arabic translation in progress.',
    descriptionAr:
      'كلّ ما تعلّمته في ٧ سنوات من تصوير الأعراس، بما في ذلك مستند استقبال العملاء، قالب جدول التصوير، وقائمة المعدّات.',
    category: 'GUIDE',
    status: 'ACTIVE',
    priceHalalas: 350 * SAR,
    previewImageUrls: [pic('guide-1', 1200, 800)],
    fileUrl: 'https://files.example.com/wedding-workflow.pdf',
    compatibleSoftware: [],
    bundleItems: [],
    salesCount: 24,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'p_noor_oud_lut',
    creatorId: 'cr_noor',
    slug: 'oud-warm-lut',
    titleEn: 'Oud — warm interior LUT',
    titleAr: 'عود — LUT داخليّ دافئ',
    descriptionEn:
      'Tuned for warm interior light (oud, candles, ambient lamps). Particularly good on skin tones in low light. Single .cube file.',
    descriptionAr:
      'موجَّه للضوء الداخليّ الدافئ (العود، الشموع، المصابيح الخافتة). جيّد بشكل خاص على البشرة في الإضاءة المنخفضة.',
    category: 'LUT',
    status: 'DRAFT',
    priceHalalas: 79 * SAR,
    previewImageUrls: [pic('oud-1', 1400, 800)],
    fileUrl: 'https://files.example.com/oud-warm.cube',
    compatibleSoftware: ['DaVinci Resolve', 'Premiere Pro'],
    bundleItems: [],
    salesCount: 0,
    createdAt: now,
    updatedAt: now,
  },
];

export const SEED_ORDERS: Order[] = [];
