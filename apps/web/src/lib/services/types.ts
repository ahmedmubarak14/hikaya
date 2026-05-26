/**
 * A single tier/package within a service (e.g., Basic, Standard, Premium).
 */
export interface ServiceTier {
  id: string;
  nameEn: string;
  nameAr?: string;
  /** Price in SAR halalas (1 SAR = 100 halalas). */
  priceHalalas: number;
  /** What's included in this tier. */
  description?: string;
}

/**
 * A single service offering listed by a creator.
 * Stored as a JSONB array in CreatorProfile.services.
 */
export interface CreatorService {
  id: string;
  nameEn: string;
  nameAr?: string;
  description?: string;
  /** Price in SAR halalas (1 SAR = 100 halalas). Base price when no tiers. */
  priceHalalas: number;
  /** Optional package tiers. When present, priceHalalas is the lowest tier price. */
  tiers?: ServiceTier[];
}
