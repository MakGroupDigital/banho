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
