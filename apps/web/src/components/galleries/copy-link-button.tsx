'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@hikaya/ui';

interface Props {
  url: string;
}

export function CopyLinkButton({ url }: Props) {
  const t = useTranslations('gallery.share');
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard rejected (e.g. insecure context). The text is already
          // visible next to this button — silent failure is OK.
        }
      }}
    >
      {copied ? t('copied') : t('copy')}
    </Button>
  );
}
