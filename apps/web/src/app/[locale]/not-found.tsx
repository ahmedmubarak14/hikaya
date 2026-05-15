import Link from 'next/link';
import { useLocale } from 'next-intl';

import { Button } from '@hikaya/ui';

export default function NotFound() {
  const locale = useLocale();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="text-accent-secondary text-xs">404</span>
      <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
        Page not found.
      </h1>
      <p className="text-surface/60 max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist — or hasn&rsquo;t been written yet.
      </p>
      <Link href={`/${locale}`}>
        <Button size="md">Back home</Button>
      </Link>
    </main>
  );
}
