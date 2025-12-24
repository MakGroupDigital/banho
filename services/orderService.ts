import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Order {
  id?: string;
  userId: string;
  items: any[];
  total: number;
  status: 'En cours' | 'Livrée' | 'Annulée';
  createdAt?: Timestamp;
  deliveryAddress?: string;
  paymentMethod?: string;
}

const ordersCollection = collection(db, 'orders');

// Créer une commande
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(ordersCollection, {
      ...order,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...order };
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    throw error;
  }
};

// Récupérer les commandes d'un utilisateur
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      ordersCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    throw error;
  }
};

// Récupérer les commandes reçues (ventes) d'un utilisateur
export const getUserSales = async (userId: string): Promise<Order[]> => {
  try {
    // Récupérer toutes les commandes où l'utilisateur est vendeur
    const allOrdersSnapshot = await getDocs(ordersCollection);
    const sales: Order[] = [];
    
    allOrdersSnapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() } as Order;
      // Vérifier si l'utilisateur est vendeur dans au moins un item
      const isSeller = order.items.some((item: any) => item.sellerId === userId);
      if (isSeller) {
        sales.push(order);
      }
    });
    
    // Trier par date décroissante
    return sales.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    throw error;
  }
};

// Mettre à jour le statut d'une commande
export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};
