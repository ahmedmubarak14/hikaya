import Link from 'next/link';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

interface Props {
  params: Promise<{ locale: Locale }>;
}

// Notifications now live inside the unified inbox (/me/inbox). This route is
// kept as a redirect so existing links / bookmarks keep working.
export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  if (!IS_STATIC_EXPORT) redirect(`/${locale}/me/inbox?tab=notifications`);
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <Link href={`/${locale}/me/inbox`} className="text-accent underline">
        Go to inbox →
      </Link>
    </div>
  );
}
