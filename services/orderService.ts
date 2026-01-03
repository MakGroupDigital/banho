import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { createStatusNotification } from './notificationService';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface Order {
  id?: string;
  orderId?: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'En attente' | 'En cours' | 'Expédiée' | 'En route' | 'Livrée' | 'Annulée';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPhone?: string;
  deliveryNotes?: string;
  paymentMethod?: string;
}

const ordersCollection = collection(db, 'orders');

// Générer un ID de commande unique
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BNH-${timestamp}-${random}`;
};

// Créer une commande
export const createOrder = async (order: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const orderId = generateOrderId();
    const docRef = await addDoc(ordersCollection, {
      ...order,
      orderId,
      status: order.status || 'En attente',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('Commande créée:', docRef.id, orderId);
    return { id: docRef.id, orderId, ...order };
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    throw error;
  }
};

// Récupérer les commandes d'un utilisateur (achats) - sans orderBy
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      ordersCollection, 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
    
    // Trier côté client
    return orders.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return [];
  }
};

// Récupérer les commandes reçues (ventes) d'un utilisateur
export const getUserSales = async (userId: string): Promise<Order[]> => {
  try {
    const allOrdersSnapshot = await getDocs(ordersCollection);
    const sales: Order[] = [];
    
    allOrdersSnapshot.forEach(docSnap => {
      const order = { id: docSnap.id, ...docSnap.data() } as Order;
      const isSeller = order.items?.some((item: OrderItem) => item.sellerId === userId);
      if (isSeller) {
        const sellerItems = order.items.filter((item: OrderItem) => item.sellerId === userId);
        sales.push({
          ...order,
          items: sellerItems,
          total: sellerItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
        });
      }
    });
    
    return sales.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    return [];
  }
};

// Mettre à jour le statut d'une commande (avec notification à l'acheteur)
export const updateOrderStatus = async (
  orderId: string, 
  status: Order['status'], 
  buyerId?: string, 
  productName?: string
) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { 
      status,
      updatedAt: Timestamp.now()
    });
    console.log('Statut mis à jour:', orderId, status);
    
    // Envoyer une notification push à l'acheteur
    if (buyerId) {
      await createStatusNotification(buyerId, orderId, status, productName);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};
