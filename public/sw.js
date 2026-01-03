// Service Worker pour les notifications push Banho

const CACHE_NAME = 'banho-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(clients.claim());
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('Notification push reçue:', event);
  
  let data = {
    title: 'Banho',
    body: 'Vous avez une nouvelle notification',
    icon: '/logo-banho.png',
    badge: '/logo-banho.png'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo-banho.png',
    badge: data.badge || '/logo-banho.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion du clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Ouvrir l'app ou focus sur la fenêtre existante
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Gestion de la fermeture d'une notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event);
});
