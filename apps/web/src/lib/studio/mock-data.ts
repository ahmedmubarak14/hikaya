/**
 * Studio CRM mock data.
 *
 * Computed at module-load time relative to today, so the calendar always
 * shows bookings in the visible month regardless of when a contributor opens
 * the project. The shape mirrors the Prisma `Booking` and `ClientProfile`
 * models for a clean future swap.
 */

import type { City, Discipline } from '@/lib/creators/mock-data';

export type BookingStatus =
  | 'INQUIRY'
  | 'QUOTED'
  | 'CONTRACTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface StudioBooking {
  id: string;
  clientId: string;
  clientName: string;
  discipline: Discipline;
  status: BookingStatus;
  city: City;
  sessionStart: string; // ISO
  sessionDurationHours: number;
  totalSar: number;
  paidSar: number;
  notes?: string;
}

export interface StudioClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isBusiness: boolean;
  totalSpendSar: number;
  bookingsCount: number;
  tags: string[];
  lastBookingAt: string; // ISO
}

const today = new Date();
function dayOffset(days: number, hour = 14, minute = 0): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const STUDIO_BOOKINGS: StudioBooking[] = [
  {
    id: 'bk_001',
    clientId: 'cl_alharbi',
    clientName: 'Sara Al-Harbi',
    discipline: 'WEDDING_PHOTOGRAPHY',
    status: 'CONFIRMED',
    city: 'RIYADH',
    sessionStart: dayOffset(2, 17, 0),
    sessionDurationHours: 6,
    totalSar: 12000,
    paidSar: 6000,
    notes: 'Outdoor ceremony, 200 guests, golden-hour priority.',
  },
  {
    id: 'bk_002',
    clientId: 'cl_almutlaq',
    clientName: 'Faisal Al-Mutlaq',
    discipline: 'COMMERCIAL_PHOTOGRAPHY',
    status: 'CONTRACTED',
    city: 'RIYADH',
    sessionStart: dayOffset(5, 10, 0),
    sessionDurationHours: 4,
    totalSar: 4500,
    paidSar: 0,
  },
  {
    id: 'bk_003',
    clientId: 'cl_aldosari',
    clientName: 'Reem Al-Dosari',
    discipline: 'PORTRAIT_PHOTOGRAPHY',
    status: 'QUOTED',
    city: 'RIYADH',
    sessionStart: dayOffset(9, 16, 0),
    sessionDurationHours: 2,
    totalSar: 1800,
    paidSar: 0,
  },
  {
    id: 'bk_004',
    clientId: 'cl_lina',
    clientName: 'Lina Al-Otaibi',
    discipline: 'WEDDING_PHOTOGRAPHY',
    status: 'CONFIRMED',
    city: 'RIYADH',
    sessionStart: dayOffset(14, 18, 0),
    sessionDurationHours: 8,
    totalSar: 16500,
    paidSar: 8250,
  },
  {
    id: 'bk_005',
    clientId: 'cl_aldosari',
    clientName: 'Reem Al-Dosari',
    discipline: 'PRODUCT_PHOTOGRAPHY',
    status: 'COMPLETED',
    city: 'RIYADH',
    sessionStart: dayOffset(-12, 11, 0),
    sessionDurationHours: 3,
    totalSar: 2200,
    paidSar: 2200,
  },
  {
    id: 'bk_006',
    clientId: 'cl_arwa',
    clientName: 'Arwa Hassan',
    discipline: 'EVENT_PHOTOGRAPHY',
    status: 'DELIVERED',
    city: 'RIYADH',
    sessionStart: dayOffset(-5, 19, 0),
    sessionDurationHours: 4,
    totalSar: 3800,
    paidSar: 1900,
  },
  {
    id: 'bk_007',
    clientId: 'cl_aldosari',
    clientName: 'Reem Al-Dosari',
    discipline: 'PORTRAIT_PHOTOGRAPHY',
    status: 'CONFIRMED',
    city: 'RIYADH',
    sessionStart: dayOffset(21, 15, 0),
    sessionDurationHours: 2,
    totalSar: 2500,
    paidSar: 1250,
  },
  {
    id: 'bk_008',
    clientId: 'cl_almutlaq',
    clientName: 'Faisal Al-Mutlaq',
    discipline: 'COMMERCIAL_PHOTOGRAPHY',
    status: 'CANCELLED',
    city: 'RIYADH',
    sessionStart: dayOffset(-25, 14, 0),
    sessionDurationHours: 3,
    totalSar: 3200,
    paidSar: 0,
  },
];

export const STUDIO_CLIENTS: StudioClient[] = [
  {
    id: 'cl_aldosari',
    name: 'Reem Al-Dosari',
    email: 'reem@example.com',
    phone: '+966 5x xxx 1208',
    isBusiness: false,
    totalSpendSar: 6500,
    bookingsCount: 3,
    tags: ['REPEAT', 'VIP'],
    lastBookingAt: dayOffset(21, 15, 0),
  },
  {
    id: 'cl_alharbi',
    name: 'Sara Al-Harbi',
    email: 'sara@example.com',
    isBusiness: false,
    totalSpendSar: 12000,
    bookingsCount: 1,
    tags: ['WEDDING'],
    lastBookingAt: dayOffset(2, 17, 0),
  },
  {
    id: 'cl_almutlaq',
    name: 'Faisal Al-Mutlaq',
    email: 'faisal@brand.sa',
    phone: '+966 5x xxx 4421',
    isBusiness: true,
    totalSpendSar: 7700,
    bookingsCount: 2,
    tags: ['CORPORATE'],
    lastBookingAt: dayOffset(5, 10, 0),
  },
  {
    id: 'cl_lina',
    name: 'Lina Al-Otaibi',
    email: 'lina@example.com',
    isBusiness: false,
    totalSpendSar: 16500,
    bookingsCount: 1,
    tags: ['WEDDING', 'VIP'],
    lastBookingAt: dayOffset(14, 18, 0),
  },
  {
    id: 'cl_arwa',
    name: 'Arwa Hassan',
    email: 'arwa@studio.sa',
    phone: '+966 5x xxx 9912',
    isBusiness: true,
    totalSpendSar: 3800,
    bookingsCount: 1,
    tags: ['EVENT'],
    lastBookingAt: dayOffset(-5, 19, 0),
  },
];

export interface StudioStats {
  monthRevenueSar: number;
  monthBookings: number;
  outstandingSar: number;
  upcomingNext14d: StudioBooking[];
  pendingResponses: number; // INQUIRY status
}

export function computeStudioStats(): StudioStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const fourteenDaysOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const monthBookings = STUDIO_BOOKINGS.filter((b) => {
    const d = new Date(b.sessionStart);
    return d >= monthStart && d < monthEnd && b.status !== 'CANCELLED';
  });

  return {
    monthRevenueSar: monthBookings.reduce((sum, b) => sum + b.paidSar, 0),
    monthBookings: monthBookings.length,
    outstandingSar: STUDIO_BOOKINGS
      .filter((b) => b.status !== 'CANCELLED' && b.totalSar > b.paidSar)
      .reduce((sum, b) => sum + (b.totalSar - b.paidSar), 0),
    upcomingNext14d: STUDIO_BOOKINGS
      .filter((b) => {
        const d = new Date(b.sessionStart);
        return d >= now && d <= fourteenDaysOut && b.status !== 'CANCELLED';
      })
      .sort((a, b) => a.sessionStart.localeCompare(b.sessionStart)),
    pendingResponses: STUDIO_BOOKINGS.filter((b) => b.status === 'INQUIRY').length,
  };
}
