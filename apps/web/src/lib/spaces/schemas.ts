import { z } from 'zod';

const CITY_VALUES = [
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
] as const;
const STATUS_VALUES = ['DRAFT', 'ACTIVE', 'PAUSED'] as const;
const DURATION_VALUES = ['HOURLY', 'HALF_DAY', 'DAILY'] as const;

const urlList = (max: number) =>
  z
    .string()
    .transform((raw) =>
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    )
    .pipe(z.array(z.string().url()).min(0).max(max));

const tagList = (max: number) =>
  z
    .string()
    .transform((raw) =>
      raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, max),
    )
    .pipe(z.array(z.string().min(1).max(40)));

export const spaceSchema = z
  .object({
    name: z.string().min(3).max(120),
    description: z.string().min(20).max(4000),
    address: z.string().min(3).max(200),
    city: z.enum(CITY_VALUES),
    capacity: z.coerce.number().int().positive().max(1000),
    /** UI collects SAR; we widen to halalas at the action boundary. */
    hourlySar: z.coerce.number().int().nonnegative().max(100_000),
    dailySar: z.coerce.number().int().nonnegative().max(1_000_000),
    halfDaySar: z.coerce.number().int().nonnegative().max(1_000_000).optional().default(0),
    status: z.enum(STATUS_VALUES).default('DRAFT'),
    photosRaw: urlList(10),
    equipmentRaw: tagList(15),
    cancellationPolicy: z.string().max(2000).optional().default(''),
  })
  .refine((v) => v.photosRaw.length >= 1, {
    message: 'Add at least one photo URL.',
    path: ['photosRaw'],
  })
  .refine((v) => v.hourlySar > 0 || v.dailySar > 0 || v.halfDaySar > 0, {
    message: 'Set at least one rate (hourly, half-day, or daily).',
    path: ['hourlySar'],
  });

export type SpaceValues = z.infer<typeof spaceSchema>;

export const bookSpaceSchema = z
  .object({
    /** YYYY-MM-DD from the date input. */
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date.'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick an end date.'),
    durationKind: z.enum(DURATION_VALUES),
  })
  .refine((v) => Date.parse(v.endDate) > Date.parse(v.startDate), {
    message: 'End must be after start.',
    path: ['endDate'],
  });

export type BookSpaceValues = z.infer<typeof bookSpaceSchema>;
