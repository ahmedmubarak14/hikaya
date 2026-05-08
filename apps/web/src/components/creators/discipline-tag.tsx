import { useTranslations } from 'next-intl';

import { Badge } from '@hikaya/ui';

import type { Discipline } from '@/lib/creators/mock-data';

const DISCIPLINE_KEYS: Record<Discipline, string> = {
  WEDDING_PHOTOGRAPHY: 'weddingPhoto',
  PORTRAIT_PHOTOGRAPHY: 'portraitPhoto',
  COMMERCIAL_PHOTOGRAPHY: 'commercialPhoto',
  PRODUCT_PHOTOGRAPHY: 'productPhoto',
  EVENT_PHOTOGRAPHY: 'eventPhoto',
  FASHION_PHOTOGRAPHY: 'fashionPhoto',
  COMMERCIAL_VIDEO: 'commercialVideo',
  WEDDING_VIDEO: 'weddingVideo',
  EVENT_VIDEO: 'eventVideo',
  DOCUMENTARY: 'documentary',
  GRAPHIC_DESIGN: 'graphicDesign',
  BRAND_IDENTITY: 'brandIdentity',
  MOTION_GRAPHICS: 'motionGraphics',
  VIDEO_EDITING: 'videoEditing',
  COLOR_GRADING: 'colorGrading',
  RETOUCHING: 'retouching',
  DRONE_OPERATION: 'drone',
};

interface Props {
  discipline: Discipline;
  tone?: 'neutral' | 'accent' | 'sage' | 'info' | 'purple' | 'warning';
}

export function DisciplineTag({ discipline, tone = 'neutral' }: Props) {
  const t = useTranslations('disciplines');
  return <Badge tone={tone}>{t(DISCIPLINE_KEYS[discipline] as 'weddingPhoto')}</Badge>;
}
