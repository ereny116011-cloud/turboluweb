self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Yeni bildirim',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: data.actions || []
  };
  event.waitUntil(self.registration.showNotification(data.title || 'TurboluMC', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
