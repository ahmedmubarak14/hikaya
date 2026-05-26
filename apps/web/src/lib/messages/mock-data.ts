/**
 * Thread + Message shapes — mirror the Prisma `Thread`, `Message`, and
 * `MessageStatus` models. Real-time is a Phase 1 spec but Socket.io belongs
 * with the backend; here, server actions + revalidatePath simulate the
 * "messages appear immediately" feel against the in-memory store.
 */

export type ThreadType = 'GENERAL' | 'BOOKING';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Thread {
  id: string;
  type: ThreadType;
  /** Optional booking context (for BOOKING threads). */
  bookingRef?: string;
  /** mock-auth user id of the creator side. */
  creatorUserId: string;
  /** mock-auth user id of the client side. */
  clientUserId: string;
  /** Free-text labels used by the list UI when rendering each side. */
  creatorName: string;
  clientName: string;
  /** Optional avatar URL, for the list view. */
  creatorAvatarUrl?: string;
  clientAvatarUrl?: string;
  lastMessageAt?: string; // ISO
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  /** mock-auth user id of sender. */
  senderId: string;
  /** Plaintext body. Markdown renders as plain text in the mock. */
  body: string;
  /** Optional attachment URLs (images, PDFs, files). */
  attachmentUrls?: string[];
  status: MessageStatus;
  readAt?: string; // ISO — set when the other side opens the thread
  createdAt: string; // ISO
}

/* --------------------------- seed for demo flow --------------------------- */

/**
 * Ids must match the seeded mock-auth users (apps/web/src/lib/auth/mock-store.ts):
 *   noor@hikaya.sa   → CREATOR
 *   client@hikaya.sa → CLIENT
 *
 * These constants are placeholders — the actual user ids are randomUUID() and
 * not stable across boots. The store seeds the thread by looking up the users
 * by email at first read, so we keep emails here rather than ids.
 */
export const SEED_THREAD_PARTICIPANTS = {
  creatorEmail: 'noor@hikaya.sa',
  clientEmail: 'client@hikaya.sa',
  creatorName: 'Noor Al-Saadi',
  clientName: 'Sample Client',
} as const;

export const SEED_THREAD_BODIES: { senderEmail: string; body: string; offsetMinutes: number }[] = [
  {
    senderEmail: 'client@hikaya.sa',
    body: "Hi Noor — saw your wedding work, it's exactly the mood we want. Are you free March 14?",
    offsetMinutes: -90,
  },
  {
    senderEmail: 'noor@hikaya.sa',
    body: "Thanks for reaching out! March 14 is open. Where's the ceremony?",
    offsetMinutes: -75,
  },
  {
    senderEmail: 'client@hikaya.sa',
    body: 'A small private venue north of Riyadh, mostly outdoor. Around 200 guests. We love your warm tones — would love to keep that in our deliverables.',
    offsetMinutes: -65,
  },
  {
    senderEmail: 'noor@hikaya.sa',
    body: "Lovely. I'll send a quote later today — gallery delivery in 4 weeks, edited collection of around 400 images. Would you like me to bring a second photographer?",
    offsetMinutes: -10,
  },
];
