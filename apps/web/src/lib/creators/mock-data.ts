/**
 * Typed mock data for creator profiles and their portfolio items.
 *
 * Lives in the web app (not the database package) because this is throw-away
 * data the UI consumes directly. When @hikaya/api is wired in, this file gets
 * deleted and `lib/creators/queries.ts` swaps to fetch().
 */

import type { Locale } from '@/i18n/config';

export type Discipline =
  | 'WEDDING_PHOTOGRAPHY'
  | 'PORTRAIT_PHOTOGRAPHY'
  | 'COMMERCIAL_PHOTOGRAPHY'
  | 'PRODUCT_PHOTOGRAPHY'
  | 'EVENT_PHOTOGRAPHY'
  | 'FASHION_PHOTOGRAPHY'
  | 'COMMERCIAL_VIDEO'
  | 'WEDDING_VIDEO'
  | 'EVENT_VIDEO'
  | 'DOCUMENTARY'
  | 'GRAPHIC_DESIGN'
  | 'BRAND_IDENTITY'
  | 'MOTION_GRAPHICS'
  | 'VIDEO_EDITING'
  | 'COLOR_GRADING'
  | 'RETOUCHING'
  | 'DRONE_OPERATION';

export type City =
  | 'RIYADH'
  | 'JEDDAH'
  | 'DAMMAM'
  | 'KHOBAR'
  | 'MAKKAH'
  | 'MEDINA'
  | 'TABUK'
  | 'ABHA';

export type Availability = 'AVAILABLE' | 'BUSY' | 'ON_VACATION';

export type PortfolioLayout = 'MASONRY' | 'EDITORIAL' | 'REEL';

export interface PortfolioItem {
  id: string;
  /** Cloudinary or third-party URL. Mock uses picsum.photos. */
  url: string;
  width: number;
  height: number;
  titleEn?: string;
  titleAr?: string;
  projectId?: string;
}

export interface CreatorProfile {
  id: string;
  username: string; // url slug
  /**
   * Email of the mock-auth user that owns this profile. When set, the user
   * with that email can edit /me/portfolio. Seed creators without an owner
   * are read-only — visible publicly, not editable.
   */
  ownerEmail?: string;
  displayNameEn: string;
  displayNameAr: string;
  bioEn: string;
  bioAr: string;
  avatarUrl: string;
  coverUrl: string;
  disciplines: Discipline[];
  city: City;
  startingPriceSar: number | null;
  yearsExperience: number;
  languages: Locale[];
  availability: Availability;
  preferredLayout: PortfolioLayout;
  reviewScore: number;
  reviewCount: number;
  isVerified: boolean;
  socialLinks: {
    instagram?: string;
    website?: string;
  };
  portfolio: PortfolioItem[];
}

const pic = (seed: string, w: number, h: number): string =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const portrait = (seed: string): { url: string; width: number; height: number } => ({
  url: pic(seed, 800, 1100),
  width: 800,
  height: 1100,
});
const landscape = (seed: string): { url: string; width: number; height: number } => ({
  url: pic(seed, 1200, 800),
  width: 1200,
  height: 800,
});
const square = (seed: string): { url: string; width: number; height: number } => ({
  url: pic(seed, 900, 900),
  width: 900,
  height: 900,
});

function makePortfolio(prefix: string, mix: ('p' | 'l' | 's')[]): PortfolioItem[] {
  return mix.map((shape, i) => {
    const seed = `${prefix}-${i}`;
    const dim = shape === 'p' ? portrait(seed) : shape === 'l' ? landscape(seed) : square(seed);
    return { id: `${prefix}-${i}`, ...dim };
  });
}

export const CREATORS: CreatorProfile[] = [
  {
    id: 'cr_noor',
    username: 'noor',
    // Wired up to the seed mock-auth user noor@hikaya.sa so /me/portfolio works.
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
    languages: ['en', 'ar'],
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
    displayNameEn: 'Yara Hejazi',
    displayNameAr: 'يارا الحجازي',
    bioEn:
      'Commercial videographer. Brand films for the way the region actually feels — slow, considered, cinematic.',
    bioAr: 'صانعة فيديو تجاري. أفلام علامات تجاريّة بإيقاع حقيقي — متأنّي، سينمائي.',
    avatarUrl: pic('avatar-yara', 200, 200),
    coverUrl: pic('cover-yara', 1800, 800),
    disciplines: ['COMMERCIAL_VIDEO', 'DOCUMENTARY'],
    city: 'JEDDAH',
    startingPriceSar: 12000,
    yearsExperience: 9,
    languages: ['en', 'ar'],
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
    languages: ['en', 'ar'],
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
    languages: ['en', 'ar'],
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
    languages: ['ar', 'en'],
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
    displayNameEn: 'Huda Al-Mutairi',
    displayNameAr: 'هدى المطيري',
    bioEn:
      'Fashion & editorial. Shooting for Riyadh Fashion Week and a few quiet labels you should know.',
    bioAr: 'موضة وتحرير. أصوّر لأسبوع الرياض للموضة وعدد من الماركات الهادئة التي يجب أن تعرفها.',
    avatarUrl: pic('avatar-huda', 200, 200),
    coverUrl: pic('cover-huda', 1800, 800),
    disciplines: ['FASHION_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY'],
    city: 'RIYADH',
    startingPriceSar: 7500,
    yearsExperience: 8,
    languages: ['en', 'ar'],
    availability: 'ON_VACATION',
    preferredLayout: 'EDITORIAL',
    reviewScore: 4.92,
    reviewCount: 33,
    isVerified: true,
    socialLinks: { instagram: 'https://instagram.com/huda.studio', website: 'https://huda.photo' },
    portfolio: makePortfolio('huda', ['p', 'p', 'l', 's', 'p', 'l', 'p', 's']),
  },
];
