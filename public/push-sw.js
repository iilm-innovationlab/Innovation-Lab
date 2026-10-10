self.addEventListener('push', event => {
  let data = { title: 'IILM × BNV Innovation Lab', body: 'There is a new update from the Lab.', url: '/' };
  try { data = { ...data, ...(event.data ? event.data.json() : {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icon.png', badge: '/icon.png', data: { url: data.url || '/' } }));
});
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { const target = event.notification.data?.url || '/'; const existing = list.find(client => 'focus' in client); return existing ? existing.focus() : clients.openWindow(target); })); });
