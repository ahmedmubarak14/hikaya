'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import {
  registerPushSubscriptionAction,
  unregisterPushSubscriptionAction,
} from '@/lib/push/actions';

interface Props {
  vapidPublicKey: string | null;
}

type Status = 'idle' | 'subscribed' | 'denied' | 'unsupported' | 'no-vapid';

/**
 * Browser-side wiring for Web Push:
 *   1. Register /sw.js as a service worker.
 *   2. Ask Notification.requestPermission().
 *   3. Subscribe via PushManager.subscribe({ applicationServerKey }).
 *   4. POST the resulting endpoint + keys to registerPushSubscriptionAction.
 *
 * Shows the current state and an Enable/Disable toggle. Falls back to a
 * read-only "not configured" hint when VAPID isn't set, so the settings
 * page still renders cleanly in dev environments.
 */
export function RegisterPush({ vapidPublicKey }: Props) {
  const t = useTranslations('notifications.push');
  const [status, setStatus] = useState<Status>('idle');
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (!vapidPublicKey) {
      setStatus('no-vapid');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    void navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setEndpoint(sub.endpoint);
        setStatus('subscribed');
      }
    });
  }, [vapidPublicKey]);

  const enable = () => {
    if (!vapidPublicKey) return;
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setStatus('denied');
          return;
        }
        const keyBytes = urlBase64ToUint8Array(vapidPublicKey);
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // Browsers want a BufferSource over plain ArrayBuffer; pass the
          // underlying .buffer cast to satisfy the lib.dom types in TS 5.6.
          applicationServerKey: keyBytes.buffer as ArrayBuffer,
        });
        const raw = sub.toJSON();
        const result = await registerPushSubscriptionAction({
          endpoint: sub.endpoint,
          keys: {
            p256dh: raw.keys?.p256dh ?? '',
            auth: raw.keys?.auth ?? '',
          },
          userAgent: navigator.userAgent,
        });
        if (result.ok) {
          setEndpoint(sub.endpoint);
          setStatus('subscribed');
        }
      } catch (err) {
        console.error('[push] enable failed:', err);
      }
    });
  };

  const disable = () => {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await unregisterPushSubscriptionAction(sub.endpoint);
        }
        setEndpoint(null);
        setStatus('idle');
      } catch (err) {
        console.error('[push] disable failed:', err);
      }
    });
  };

  if (status === 'unsupported') {
    return <p className="text-muted text-xs">{t('unsupported')}</p>;
  }
  if (status === 'no-vapid') {
    return <p className="text-muted text-xs">{t('notConfigured')}</p>;
  }
  if (status === 'denied') {
    return <p className="text-muted text-xs">{t('denied')}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted text-xs">
        {status === 'subscribed' ? t('subscribedHint') : t('idleHint')}
      </p>
      <div className="flex items-center gap-3">
        {status === 'subscribed' ? (
          <button
            type="button"
            onClick={disable}
            disabled={isPending}
            className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? t('working') : t('disable')}
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={isPending}
            className="bg-surface text-bg hover:bg-surface/90 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? t('working') : t('enable')}
          </button>
        )}
        {endpoint ? (
          <span className="text-muted/60 text-2xs font-mono">{endpoint.slice(-12)}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Convert a base64-url VAPID public key into a Uint8Array for PushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) out[i] = rawData.charCodeAt(i);
  return out;
}
