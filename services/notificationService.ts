import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  sendPushNotification, 
  notifyNewOrder, 
  notifyOrderStatusChange, 
  notifyPaymentReceived, 
  notifyMoneyReceived,
  notifySaleComplete 
} from './pushNotificationService';

export interface Notification {
  id?: string;
  userId: string;
  type: 'order' | 'payment' | 'status' | 'message' | 'system' | 'transfer';
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt?: Timestamp;
  relatedId?: string;
}

const notificationsCollection = collection(db, 'notifications');

// Créer une notification (avec push notification optionnelle)
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>, sendPush: boolean = false) => {
  try {
    const docRef = await addDoc(notificationsCollection, {
      ...notification,
      read: false,
      createdAt: Timestamp.now()
    });
    
    if (sendPush) {
      await sendPushNotification({
        title: notification.title,
        body: notification.message,
        icon: '/logo-banho.png',
        data: { type: notification.type, relatedId: notification.relatedId }
      });
    }
    
    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

// Récupérer les notifications d'un utilisateur
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      notificationsCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

// Marquer une notification comme lue
export const markAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    throw error;
  }
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async (userId: string) => {
  try {
    const notifications = await getUserNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.read);
    await Promise.all(
      unreadNotifications.map(n => n.id ? markAsRead(n.id) : Promise.resolve())
    );
  } catch (error) {
    console.error('Erreur lors du marquage de toutes comme lues:', error);
    throw error;
  }
};

// Notification de commande confirmée (pour l'acheteur)
export const createOrderNotification = async (userId: string, orderId: string, orderTotal: number) => {
  return createNotification({
    userId,
    type: 'order',
    title: 'Commande confirmée',
    message: `Votre commande de $${orderTotal} a été confirmée avec succès.`,
    icon: '📦',
    relatedId: orderId
  }, true);
};

// Notification de changement de statut (pour l'acheteur)
export const createStatusNotification = async (userId: string, orderId: string, status: string, productName?: string) => {
  const messages: Record<string, { title: string; message: string; icon: string }> = {
    'En cours': {
      title: 'Commande en préparation',
      message: `Votre commande${productName ? ` "${productName}"` : ''} est en cours de préparation.`,
      icon: '⏳'
    },
    'Expédiée': {
      title: 'Commande expédiée',
      message: `Votre commande${productName ? ` "${productName}"` : ''} a été expédiée !`,
      icon: '📤'
    },
    'En route': {
      title: 'Commande en route',
      message: `Votre commande${productName ? ` "${productName}"` : ''} est en route vers vous !`,
      icon: '🚚'
    },
    'Livrée': {
      title: 'Commande livrée',
      message: `Votre commande${productName ? ` "${productName}"` : ''} a été livrée avec succès !`,
      icon: '✅'
    },
    'Annulée': {
      title: 'Commande annulée',
      message: `Votre commande${productName ? ` "${productName}"` : ''} a été annulée.`,
      icon: '❌'
    }
  };

  const notifData = messages[status] || messages['En cours'];

  await createNotification({
    userId,
    type: 'status',
    title: notifData.title,
    message: notifData.message,
    icon: notifData.icon,
    relatedId: orderId
  }, true);
  
  await notifyOrderStatusChange(orderId, status, productName || 'votre produit');
  return true;
};

// Notification de paiement
export const createPaymentNotification = async (userId: string, amount: number, type: 'received' | 'sent', senderName?: string) => {
  const notification = await createNotification({
    userId,
    type: 'payment',
    title: type === 'received' ? 'Paiement reçu' : 'Paiement envoyé',
    message: type === 'received' 
      ? `Vous avez reçu $${amount}${senderName ? ` de ${senderName}` : ''}.`
      : `Vous avez envoyé $${amount}.`,
    icon: '💰'
  }, type === 'received');
  
  if (type === 'received' && senderName) {
    await notifyPaymentReceived(senderName, amount);
  }
  
  return notification;
};

// Notification de transfert d'argent reçu (BanhoPay)
export const createTransferNotification = async (userId: string, amount: number, senderName: string) => {
  const notification = await createNotification({
    userId,
    type: 'transfer',
    title: 'Argent reçu !',
    message: `${senderName} vous a envoyé $${amount} via BanhoPay.`,
    icon: '💸'
  }, true);
  
  await notifyMoneyReceived(senderName, amount);
  return notification;
};

// Notification de vente (pour le vendeur)
export const createSaleNotification = async (sellerId: string, productName: string, amount: number, buyerName?: string) => {
  const notification = await createNotification({
    userId: sellerId,
    type: 'order',
    title: 'Nouvelle vente !',
    message: `${buyerName || 'Un client'} a acheté "${productName}" pour $${amount}.`,
    icon: '🎉'
  }, true);
  
  await notifySaleComplete(productName, amount, buyerName || 'Un client');
  await notifyNewOrder(buyerName || 'Un client', productName, amount);
  return notification;
};
