import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Product {
  id?: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  rating: number;
  category: string;
  description: string;
  seller: string;
  stock: number;
  reviews: number;
  createdAt?: Timestamp;
}

const productsCollection = collection(db, 'products');

// Ajouter un produit
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(productsCollection, {
      ...product,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...product };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du produit:', error);
    throw error;
  }
};

// Récupérer tous les produits
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(query(productsCollection, orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    throw error;
  }
};

// Récupérer les produits par catégorie
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(productsCollection, where('category', '==', category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error) {
    console.error('Erreur lors de la récupération des produits par catégorie:', error);
    throw error;
  }
};

// Mettre à jour un produit
export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    throw error;
  }
};

// Supprimer un produit
export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    throw error;
  }
};
