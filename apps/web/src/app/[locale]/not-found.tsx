import Link from 'next/link';
import { useLocale } from 'next-intl';

import { Button } from '@hikaya/ui';

export default function NotFound() {
  const locale = useLocale();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-accent">404</span>
      <h1 className="text-balance text-5xl md:text-6xl">
        <em className="font-display italic">Lost</em> in the story.
      </h1>
      <p className="max-w-md text-surface/60">
        The page you&rsquo;re looking for doesn&rsquo;t exist — or hasn&rsquo;t been written yet.
      </p>
      <Link href={`/${locale}`}>
        <Button size="md">Back home</Button>
      </Link>
    </main>
  );
}
