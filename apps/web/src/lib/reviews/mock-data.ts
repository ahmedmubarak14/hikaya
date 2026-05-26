/**
 * Mock review data for the demo. Mirrors the Prisma `Review` model.
 */

export interface ReviewData {
  id: string;
  bookingId: string;
  authorId: string;
  authorName: string;
  subjectId: string; // user being reviewed (creator)
  creatorProfileId: string;
  rating: number; // 1-5
  body: string | null;
  isPublic: boolean;
  createdAt: string; // ISO
}

const now = new Date();
function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const SEED_REVIEWS: ReviewData[] = [
  {
    id: 'rev_001',
    bookingId: 'bk_005',
    authorId: 'cl_aldosari_user',
    authorName: 'Reem Al-Dosari',
    subjectId: 'noor_user',
    creatorProfileId: 'cr_noor',
    rating: 5,
    body: 'Noor delivered the product shots ahead of schedule and the quality was outstanding. Every frame was usable. Would absolutely book again.',
    isPublic: true,
    createdAt: daysAgo(10),
  },
  {
    id: 'rev_002',
    bookingId: 'bk_008',
    authorId: 'cl_almutlaq_user',
    authorName: 'Faisal Al-Mutlaq',
    subjectId: 'noor_user',
    creatorProfileId: 'cr_noor',
    rating: 4,
    body: 'Great communication throughout. The final deliverables were polished and on-brand. Slight delay on the retouched batch but nothing deal-breaking.',
    isPublic: true,
    createdAt: daysAgo(25),
  },
  {
    id: 'rev_003',
    bookingId: 'bk_006',
    authorId: 'cl_arwa_user',
    authorName: 'Arwa Hassan',
    subjectId: 'noor_user',
    creatorProfileId: 'cr_noor',
    rating: 5,
    body: 'The event coverage was perfect. She captured every key moment and the turnaround was incredibly fast.',
    isPublic: true,
    createdAt: daysAgo(5),
  },
];

export function getReviewsByCreatorProfileId(creatorProfileId: string): ReviewData[] {
  return SEED_REVIEWS.filter((r) => r.creatorProfileId === creatorProfileId && r.isPublic);
}

export function getReviewByBookingAndAuthor(bookingId: string, authorId: string): ReviewData | null {
  return SEED_REVIEWS.find((r) => r.bookingId === bookingId && r.authorId === authorId) ?? null;
}
