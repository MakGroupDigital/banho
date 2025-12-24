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

export interface Notification {
  id?: string;
  userId: string;
  type: 'order' | 'payment' | 'status' | 'message' | 'system';
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt?: Timestamp;
  relatedId?: string; // ID de la commande, transaction, etc.
}

const notificationsCollection = collection(db, 'notifications');

// Créer une notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
  try {
    const docRef = await addDoc(notificationsCollection, {
      ...notification,
      read: false,
      createdAt: Timestamp.now()
    });
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

// Créer une notification de commande
export const createOrderNotification = async (userId: string, orderId: string, orderTotal: number) => {
  return createNotification({
    userId,
    type: 'order',
    title: 'Commande confirmée',
    message: `Votre commande de $${orderTotal} a été confirmée avec succès.`,
    icon: '📦',
    relatedId: orderId
  });
};

// Créer une notification de changement de statut
export const createStatusNotification = async (userId: string, orderId: string, status: string) => {
  const messages: Record<string, { title: string; message: string; icon: string }> = {
    'En cours': {
      title: 'Commande en cours',
      message: 'Votre commande est en cours de traitement.',
      icon: '⏳'
    },
    'Livrée': {
      title: 'Commande livrée',
      message: 'Votre commande a été livrée avec succès !',
      icon: '✅'
    },
    'Annulée': {
      title: 'Commande annulée',
      message: 'Votre commande a été annulée.',
      icon: '❌'
    }
  };

  const notifData = messages[status] || messages['En cours'];

  return createNotification({
    userId,
    type: 'status',
    title: notifData.title,
    message: notifData.message,
    icon: notifData.icon,
    relatedId: orderId
  });
};

// Créer une notification de paiement
export const createPaymentNotification = async (userId: string, amount: number, type: 'received' | 'sent') => {
  return createNotification({
    userId,
    type: 'payment',
    title: type === 'received' ? 'Paiement reçu' : 'Paiement envoyé',
    message: type === 'received' 
      ? `Vous avez reçu $${amount}.`
      : `Vous avez envoyé $${amount}.`,
    icon: '💰'
  });
};

// Créer une notification de vente
export const createSaleNotification = async (sellerId: string, productName: string, amount: number) => {
  return createNotification({
    userId: sellerId,
    type: 'order',
    title: 'Nouvelle vente !',
    message: `Votre produit "${productName}" a été vendu pour $${amount}.`,
    icon: '🎉'
  });
};
