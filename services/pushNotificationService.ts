import { Capacitor } from '@capacitor/core';

// Interface pour les notifications push
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
}

// Vérifier si les notifications sont supportées
export const isPushSupported = (): boolean => {
  if (Capacitor.isNativePlatform()) {
    return true; // Capacitor gère les notifications natives
  }
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Demander la permission pour les notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    // Sur mobile natif, utiliser Capacitor Local Notifications
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Erreur permission notifications Capacitor:', error);
      return false;
    }
  }

  // Sur le web
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Envoyer une notification push
export const sendPushNotification = async (notification: PushNotificationData): Promise<boolean> => {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.log('Permission de notification non accordée');
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    // Notifications natives avec Capacitor
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: notification.title,
            body: notification.body,
            smallIcon: 'ic_stat_icon_config_sample', // Icône Android
            largeIcon: 'ic_launcher', // Logo de l'app
            iconColor: '#064e3b',
            sound: 'default',
            extra: notification.data || {}
          }
        ]
      });
      
      return true;
    } catch (error) {
      console.error('Erreur envoi notification Capacitor:', error);
      return false;
    }
  }

  // Notifications web
  try {
    const options: NotificationOptions = {
      body: notification.body,
      icon: notification.icon || '/logo-banho.png',
      badge: notification.badge || '/logo-banho.png',
      tag: notification.tag || 'banho-notification',
      data: notification.data,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };

    // Utiliser le Service Worker si disponible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, options);
    } else {
      // Fallback: notification directe
      new Notification(notification.title, options);
    }

    return true;
  } catch (error) {
    console.error('Erreur envoi notification web:', error);
    return false;
  }
};

// Notification pour nouvelle commande reçue (vendeur)
export const notifyNewOrder = async (buyerName: string, productName: string, amount: number) => {
  return sendPushNotification({
    title: '🛒 Nouvelle commande !',
    body: `${buyerName} a commandé "${productName}" pour $${amount}`,
    icon: '/logo-banho.png',
    tag: 'new-order',
    data: { type: 'order' }
  });
};

// Notification pour changement de statut de commande
export const notifyOrderStatusChange = async (orderId: string, status: string, productName: string) => {
  const statusMessages: Record<string, { title: string; body: string }> = {
    'En cours': {
      title: '📦 Commande en préparation',
      body: `Votre commande "${productName}" est en cours de préparation`
    },
    'Expédiée': {
      title: '🚚 Commande expédiée',
      body: `Votre commande "${productName}" a été expédiée`
    },
    'En route': {
      title: '🚚 Commande en route',
      body: `Votre commande "${productName}" est en route vers vous`
    },
    'Livrée': {
      title: '✅ Commande livrée',
      body: `Votre commande "${productName}" a été livrée avec succès !`
    },
    'Annulée': {
      title: '❌ Commande annulée',
      body: `Votre commande "${productName}" a été annulée`
    }
  };

  const message = statusMessages[status] || {
    title: '📋 Mise à jour commande',
    body: `Statut de votre commande: ${status}`
  };

  return sendPushNotification({
    title: message.title,
    body: message.body,
    icon: '/logo-banho.png',
    tag: `order-${orderId}`,
    data: { type: 'order-status', orderId, status }
  });
};

// Notification pour paiement reçu
export const notifyPaymentReceived = async (senderName: string, amount: number) => {
  return sendPushNotification({
    title: '💰 Paiement reçu !',
    body: `${senderName} vous a envoyé $${amount}`,
    icon: '/logo-banho.png',
    tag: 'payment-received',
    data: { type: 'payment' }
  });
};

// Notification pour argent reçu (transfert BanhoPay)
export const notifyMoneyReceived = async (senderName: string, amount: number) => {
  return sendPushNotification({
    title: '💸 Argent reçu !',
    body: `${senderName} vous a envoyé $${amount} via BanhoPay`,
    icon: '/logo-banho.png',
    tag: 'money-received',
    data: { type: 'transfer' }
  });
};

// Notification pour vente réussie
export const notifySaleComplete = async (productName: string, amount: number, buyerName: string) => {
  return sendPushNotification({
    title: '🎉 Vente réussie !',
    body: `${buyerName} a acheté "${productName}" pour $${amount}`,
    icon: '/logo-banho.png',
    tag: 'sale-complete',
    data: { type: 'sale' }
  });
};

// Initialiser les listeners de notifications (pour Capacitor)
export const initPushNotifications = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Listener quand on clique sur une notification
      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification cliquée:', notification);
        // Gérer la navigation selon le type de notification
        const data = notification.notification.extra;
        if (data?.type === 'order') {
          // Naviguer vers les commandes
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'orders' } }));
        } else if (data?.type === 'payment' || data?.type === 'transfer') {
          // Naviguer vers BanhoPay
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'banhopay' } }));
        }
      });

      // Demander la permission au démarrage
      await requestNotificationPermission();
      
      console.log('Notifications push initialisées');
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  }
};
