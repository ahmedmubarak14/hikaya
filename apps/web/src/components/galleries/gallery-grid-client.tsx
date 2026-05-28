'use client';

import { useState } from 'react';

import { Lightbox, type LightboxImage } from './lightbox';

interface Props {
  images: LightboxImage[];
  children: React.ReactNode;
  allowDownloads?: boolean;
  downloadLabel?: string;
}

/**
 * Client wrapper around the gallery image grid. Intercepts clicks on images
 * to open the lightbox at the clicked index. Each clickable figure must carry
 * a `data-lightbox-index` attribute.
 */
export function GalleryGridClient({ images, children, allowDownloads, downloadLabel }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function handleClick(e: React.MouseEvent) {
    const figure = (e.target as HTMLElement).closest('[data-lightbox-index]');
    if (!figure) return;
    const idx = parseInt(figure.getAttribute('data-lightbox-index') ?? '', 10);
    if (!Number.isNaN(idx)) {
      setLightboxIndex(idx);
    }
  }

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={handleClick}>
        {children}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          allowDownloads={allowDownloads}
          downloadLabel={downloadLabel}
        />
      )}
    </>
  );
}
