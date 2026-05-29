// Hikaya Web Push service worker.
// Registered from src/components/notifications/register-push.tsx. Receives
// `push` events, parses the JSON payload, and displays a notification. On
// click the worker focuses the target tab (or opens it).

self.addEventListener('install', (event) => {
  // Activate immediately so re-deploys take effect on the next page load
  // without waiting for all tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch (_e) {
    payload = { title: 'Hikaya', body: event.data.text() };
  }
  const title = payload.title || 'Hikaya';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    data: { url: payload.url || '/' },
    tag: payload.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if (url.pathname === targetUrl || url.href.endsWith(targetUrl)) {
            return client.focus();
          }
        } catch (_e) {
          // ignore
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    }),
  );
});
