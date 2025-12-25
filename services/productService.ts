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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

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
  condition: 'neuve' | 'occasion' | 'services';
  location: string;
  userId: string;
  createdAt?: Timestamp;
}

const productsCollection = collection(db, 'products');

// Upload une image vers Firebase Storage
export const uploadImage = async (file: File, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `products/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    throw error;
  }
};

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

// Récupérer les produits par condition (neuve, occasion, services)
export const getProductsByCondition = async (condition: 'neuve' | 'occasion' | 'services'): Promise<Product[]> => {
  try {
    const q = query(productsCollection, where('condition', '==', condition), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error: any) {
    console.error('Erreur lors de la récupération des produits par condition:', error);
    
    // Si l'erreur est liée à un index manquant, essayer sans orderBy
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.log('Tentative sans orderBy...');
      try {
        const q = query(productsCollection, where('condition', '==', condition));
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        
        // Trier manuellement par date
        return products.sort((a, b) => {
          const dateA = a.createdAt?.toMillis() || 0;
          const dateB = b.createdAt?.toMillis() || 0;
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('Erreur lors de la récupération sans orderBy:', fallbackError);
        throw fallbackError;
      }
    }
    
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

// Récupérer les produits d'un utilisateur
export const getUserProducts = async (userId: string): Promise<Product[]> => {
  try {
    const q = query(productsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error: any) {
    console.error('Erreur lors de la récupération des produits utilisateur:', error);
    
    // Si l'erreur est liée à un index manquant, essayer sans orderBy
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      try {
        const q = query(productsCollection, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        
        return products.sort((a, b) => {
          const dateA = a.createdAt?.toMillis() || 0;
          const dateB = b.createdAt?.toMillis() || 0;
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('Erreur lors de la récupération sans orderBy:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};
