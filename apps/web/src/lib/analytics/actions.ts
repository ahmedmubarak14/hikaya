'use server';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatorAnalytics {
  profileViews: number;
  portfolioViews: number;
  totalBookings: number;
  totalRevenueHalalas: number;
  inquiryCount: number;
  quotesTotal: number;
  quotesApproved: number;
  conversionRate: number; // 0-100
  /** Hiring funnel: Inquiry → Quote → Booking (CONFIRMED+) → Completed. */
  funnel: {
    inquiries: number;
    quotes: number;
    bookings: number;
    completed: number;
  };
  /**
   * Trailing 12 months of revenue, oldest first. Each entry is the calendar
   * month bucket plus the sum of Booking.totalHalalas created in that month.
   */
  revenueByMonth: { monthIso: string; halalas: number }[];
}

// ---------------------------------------------------------------------------
// Get creator analytics
// ---------------------------------------------------------------------------

export async function getCreatorAnalyticsAction(): Promise<CreatorAnalytics | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();

  // Get creator profile
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id, profileViewCount')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (!profile) return null;

  // Portfolio item views
  const { data: portfolioItems } = await supabase
    .from('PortfolioItem')
    .select('viewCount')
    .eq('creatorId', profile.id);

  const portfolioViews = (portfolioItems ?? []).reduce(
    (sum: number, item: Record<string, unknown>) => sum + ((item.viewCount as number) ?? 0),
    0,
  );

  // Bookings + revenue. createdAt drives the monthly bucket.
  const { data: bookings } = await supabase
    .from('Booking')
    .select('id, totalHalalas, status, createdAt')
    .eq('creatorProfileId', profile.id);

  const totalBookings = (bookings ?? []).length;
  const totalRevenueHalalas = (bookings ?? []).reduce(
    (sum: number, b: Record<string, unknown>) => sum + ((b.totalHalalas as number) ?? 0),
    0,
  );

  // Inquiries
  const { data: inquiries, count: inquiryCount } = await supabase
    .from('Inquiry')
    .select('id', { count: 'exact', head: true })
    .eq('creatorProfileId', profile.id);

  void inquiries; // count is what we need

  // Quotes (via bookings)
  let quotesTotal = 0;
  let quotesApproved = 0;

  if (bookings && bookings.length > 0) {
    const bookingIds = (bookings as { id: string }[]).map((b) => b.id);
    const { data: quotes } = await supabase
      .from('Quote')
      .select('id, status')
      .in('bookingId', bookingIds);

    quotesTotal = (quotes ?? []).length;
    quotesApproved = (quotes ?? []).filter(
      (q: Record<string, unknown>) => q.status === 'APPROVED',
    ).length;
  }

  const conversionRate = quotesTotal > 0
    ? Math.round((quotesApproved / quotesTotal) * 100)
    : 0;

  // Funnel — counts at each stage. Quotes use the existing approval pass-
  // through, bookings count CONFIRMED+IN_PROGRESS+COMPLETED, completed
  // counts COMPLETED only.
  type BookingRow = { id: string; status: string; totalHalalas: number; createdAt: string };
  const bookingRows = (bookings ?? []) as BookingRow[];
  const bookingsCount = bookingRows.filter((b) =>
    ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status),
  ).length;
  const completedCount = bookingRows.filter((b) => b.status === 'COMPLETED').length;

  // Revenue by month — 12-month window ending this month. Group by the
  // booking's createdAt month bucket (YYYY-MM-01).
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.set(d.toISOString().slice(0, 7), 0);
  }
  for (const b of bookingRows) {
    if (!b.createdAt) continue;
    const monthKey = b.createdAt.slice(0, 7);
    if (!buckets.has(monthKey)) continue;
    buckets.set(monthKey, (buckets.get(monthKey) ?? 0) + (b.totalHalalas ?? 0));
  }
  const revenueByMonth = [...buckets.entries()].map(([month, halalas]) => ({
    monthIso: `${month}-01`,
    halalas,
  }));

  return {
    profileViews: (profile.profileViewCount as number) ?? 0,
    portfolioViews,
    totalBookings,
    totalRevenueHalalas,
    inquiryCount: inquiryCount ?? 0,
    quotesTotal,
    quotesApproved,
    conversionRate,
    funnel: {
      inquiries: inquiryCount ?? 0,
      quotes: quotesTotal,
      bookings: bookingsCount,
      completed: completedCount,
    },
    revenueByMonth,
  };
}
