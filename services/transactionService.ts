import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { createTransferNotification } from './notificationService';

export interface Transaction {
  id?: string;
  userId: string;
  type: 'Retrait' | 'Dépôt' | 'Achat' | 'Vente' | 'Envoi' | 'Réception';
  amount: number;
  description: string;
  recipientId?: string;
  recipientName?: string;
  recipientBanhoPayNumber?: string;
  senderId?: string;
  senderName?: string;
  senderBanhoPayNumber?: string;
  location?: string;
  createdAt?: Timestamp;
}

const transactionsCollection = collection(db, 'transactions');

// Créer une transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(transactionsCollection, {
      ...transaction,
      createdAt: Timestamp.now()
    });
    console.log('Transaction créée:', docRef.id);
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    throw error;
  }
};

// Envoyer de l'argent à un autre utilisateur BanhoPay
export const sendMoney = async (
  senderId: string,
  senderName: string,
  senderBanhoPayNumber: string,
  recipientId: string,
  recipientName: string,
  recipientBanhoPayNumber: string,
  amount: number
) => {
  try {
    // Transaction pour l'envoyeur
    await createTransaction({
      userId: senderId,
      type: 'Envoi',
      amount: amount,
      description: `Envoi à ${recipientName}`,
      recipientId,
      recipientName,
      recipientBanhoPayNumber
    });

    // Transaction pour le destinataire
    await createTransaction({
      userId: recipientId,
      type: 'Réception',
      amount: amount,
      description: `Reçu de ${senderName}`,
      senderId,
      senderName,
      senderBanhoPayNumber
    });

    // Envoyer une notification push au destinataire
    await createTransferNotification(recipientId, amount, senderName);

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'argent:', error);
    throw error;
  }
};

// Dépôt d'argent
export const depositMoney = async (userId: string, amount: number, method: string) => {
  try {
    await createTransaction({
      userId,
      type: 'Dépôt',
      amount,
      description: `Dépôt via ${method}`
    });
    return true;
  } catch (error) {
    console.error('Erreur lors du dépôt:', error);
    throw error;
  }
};

// Retrait d'argent
export const withdrawMoney = async (userId: string, amount: number, method: string) => {
  try {
    await createTransaction({
      userId,
      type: 'Retrait',
      amount,
      description: `Retrait via ${method}`
    });
    return true;
  } catch (error) {
    console.error('Erreur lors du retrait:', error);
    throw error;
  }
};

// Récupérer les transactions d'un utilisateur (sans orderBy pour éviter les problèmes d'index)
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      transactionsCollection, 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
    
    // Trier côté client par date décroissante
    return transactions.sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return [];
  }
};

// Récupérer le solde d'un utilisateur
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const transactions = await getUserTransactions(userId);
    
    console.log('Calcul du solde pour userId:', userId);
    console.log('Nombre de transactions:', transactions.length);
    
    const balance = transactions.reduce((acc, transaction) => {
      const type = transaction.type?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const amount = Number(transaction.amount) || 0;
      
      console.log('Transaction:', type, amount, transaction.description);
      
      // Types qui augmentent le solde
      if (type === 'depot' || type === 'dépôt' || type === 'vente' || type === 'reception' || type === 'réception') {
        return acc + amount;
      }
      // Types qui diminuent le solde
      if (type === 'retrait' || type === 'achat' || type === 'envoi') {
        return acc - amount;
      }
      
      // Fallback avec les types originaux
      switch (transaction.type) {
        case 'Dépôt':
        case 'Vente':
        case 'Réception':
          return acc + amount;
        case 'Retrait':
        case 'Achat':
        case 'Envoi':
          return acc - amount;
        default:
          console.log('Type de transaction non reconnu:', transaction.type);
          return acc;
      }
    }, 0);
    
    console.log('Solde calculé:', balance);
    return balance;
  } catch (error) {
    console.error('Erreur lors du calcul du solde:', error);
    return 0;
  }
};
