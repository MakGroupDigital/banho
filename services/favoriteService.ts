import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Favorite {
  id?: string;
  userId: string;
  productId: string;
  createdAt?: Timestamp;
}

const favoritesCollection = collection(db, 'favorites');

// Ajouter un favori
export const addFavorite = async (userId: string, productId: string) => {
  try {
    const docRef = await addDoc(favoritesCollection, {
      userId,
      productId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, userId, productId };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du favori:', error);
    throw error;
  }
};

// Supprimer un favori
export const removeFavorite = async (favoriteId: string) => {
  try {
    await deleteDoc(doc(db, 'favorites', favoriteId));
  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    throw error;
  }
};

// Récupérer les favoris d'un utilisateur
export const getUserFavorites = async (userId: string): Promise<Favorite[]> => {
  try {
    const q = query(favoritesCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Favorite));
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    throw error;
  }
};

// Vérifier si un produit est en favori
export const isFavorite = async (userId: string, productId: string): Promise<string | null> => {
  try {
    const q = query(
      favoritesCollection, 
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].id;
  } catch (error) {
    console.error('Erreur lors de la vérification du favori:', error);
    return null;
  }
};
