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

  // Bookings + revenue
  const { data: bookings } = await supabase
    .from('Booking')
    .select('id, totalHalalas, status')
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

  return {
    profileViews: (profile.profileViewCount as number) ?? 0,
    portfolioViews,
    totalBookings,
    totalRevenueHalalas,
    inquiryCount: inquiryCount ?? 0,
    quotesTotal,
    quotesApproved,
    conversionRate,
  };
}
