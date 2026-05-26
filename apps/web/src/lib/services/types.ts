/**
 * A single service offering listed by a creator.
 * Stored as a JSONB array in CreatorProfile.services.
 */
export interface CreatorService {
  id: string;
  nameEn: string;
  nameAr?: string;
  description?: string;
  /** Price in SAR halalas (1 SAR = 100 halalas). */
  priceHalalas: number;
}
