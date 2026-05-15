import { useTranslations } from 'next-intl';

import { Badge } from '@hikaya/ui';

import type { PostStatus } from '@/lib/blog/mock-data';

const TONE: Record<PostStatus, 'neutral' | 'sage'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'sage',
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const t = useTranslations('blog.status');
  return <Badge tone={TONE[status]}>{t(status as 'DRAFT')}</Badge>;
}
