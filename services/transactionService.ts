import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Transaction {
  id?: string;
  userId: string;
  type: 'Retrait' | 'Dépôt' | 'Achat' | 'Vente' | 'Transfert';
  amount: number;
  description: string;
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
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    throw error;
  }
};

// Récupérer les transactions d'un utilisateur
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      transactionsCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    throw error;
  }
};

// Récupérer le solde d'un utilisateur (calculé à partir des transactions)
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const transactions = await getUserTransactions(userId);
    
    return transactions.reduce((balance, transaction) => {
      switch (transaction.type) {
        case 'Dépôt':
        case 'Vente':
          return balance + transaction.amount;
        case 'Retrait':
        case 'Achat':
        case 'Transfert':
          return balance - transaction.amount;
        default:
          return balance;
      }
    }, 0);
  } catch (error) {
    console.error('Erreur lors du calcul du solde:', error);
    return 0;
  }
};
