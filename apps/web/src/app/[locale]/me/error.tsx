'use client';

import { useEffect } from 'react';

/**
 * Error boundary for everything under /me. By default Next.js shows a
 * generic "Application error" message in production which hides the actual
 * exception. This boundary prints the message + digest so a real fix can be
 * made instead of guessing.
 */
export default function MeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[me/error] caught', error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-16">
      <div className="border-line/60 rounded-2xl border bg-paper p-6">
        <h1 className="text-surface text-xl font-semibold">Something broke on this page</h1>
        <p className="text-muted mt-2 text-sm">
          The exact error is printed below. Send it to the engineer fixing this.
        </p>

        <pre className="bg-surface/[0.04] text-surface mt-4 overflow-x-auto rounded-md p-4 text-xs leading-relaxed">
          <code>
            <strong>Name:</strong> {error.name ?? 'Error'}
            {'\n'}
            <strong>Message:</strong> {error.message || '(no message)'}
            {error.digest ? (
              <>
                {'\n'}
                <strong>Digest:</strong> {error.digest}
              </>
            ) : null}
            {error.stack ? (
              <>
                {'\n\n'}
                <strong>Stack:</strong>
                {'\n'}
                {error.stack}
              </>
            ) : null}
          </code>
        </pre>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="bg-surface text-bg hover:bg-surface/90 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
