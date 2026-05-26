import 'server-only';

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  conversionRate: number; // percentage relative to previous stage (0–100)
}

export interface HiringFunnelStats {
  stages: FunnelStage[];
}

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

/**
 * Get hiring funnel stats for a creator:
 *   Profile Views -> Inquiries -> Quotes -> Contracts Signed -> Completed
 *
 * Each stage shows a raw count and conversion rate from the previous stage.
 */
export async function getHiringFunnelStats(
  creatorId: string,
): Promise<HiringFunnelStats | null> {
  const supabase = await createClient();

  // 1. Profile views from CreatorProfile
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('profileViewCount')
    .eq('id', creatorId)
    .maybeSingle();

  if (!profile) return null;

  const profileViews = (profile.profileViewCount as number) ?? 0;

  // 2. Inquiries
  const { count: inquiryCount } = await supabase
    .from('Inquiry')
    .select('id', { count: 'exact', head: true })
    .eq('creatorProfileId', creatorId);

  const inquiries = inquiryCount ?? 0;

  // 3. Quotes — we need bookings first, then quotes attached to them
  const { data: bookings } = await supabase
    .from('Booking')
    .select('id')
    .eq('creatorProfileId', creatorId);

  const bookingIds = (bookings ?? []).map((b) => (b as Record<string, unknown>).id as string);

  let quotesCount = 0;
  let contractsSignedCount = 0;
  let completedCount = 0;

  if (bookingIds.length > 0) {
    // Quotes
    const { count: qCount } = await supabase
      .from('Quote')
      .select('id', { count: 'exact', head: true })
      .in('bookingId', bookingIds);
    quotesCount = qCount ?? 0;

    // Contracts signed (status = 'SIGNED')
    const { count: cCount } = await supabase
      .from('Contract')
      .select('id', { count: 'exact', head: true })
      .eq('creatorId', creatorId)
      .eq('status', 'SIGNED');
    contractsSignedCount = cCount ?? 0;

    // Completed bookings
    const { count: dCount } = await supabase
      .from('Booking')
      .select('id', { count: 'exact', head: true })
      .eq('creatorProfileId', creatorId)
      .eq('status', 'COMPLETED');
    completedCount = dCount ?? 0;
  }

  // Build funnel stages with conversion rates
  const rawStages = [
    { key: 'profileViews', count: profileViews },
    { key: 'inquiries', count: inquiries },
    { key: 'quotes', count: quotesCount },
    { key: 'contractsSigned', count: contractsSignedCount },
    { key: 'completed', count: completedCount },
  ];

  const stages: FunnelStage[] = rawStages.map((stage, i) => {
    const prev = i === 0 ? stage.count : rawStages[i - 1]!.count;
    const conversionRate = prev > 0 ? Math.round((stage.count / prev) * 100) : 0;
    return {
      key: stage.key,
      label: stage.key, // Will be replaced by i18n in the UI
      count: stage.count,
      conversionRate: i === 0 ? 100 : conversionRate,
    };
  });

  return { stages };
}
