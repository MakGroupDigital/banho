import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  collection,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  banhoPayNumber?: string;
  banhoPayBalance?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Générer un numéro BanhoPay unique
export const generateBanhoPayNumber = async (): Promise<string> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  // Trouver le plus grand numéro existant
  let maxNumber = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.banhoPayNumber) {
      const num = parseInt(data.banhoPayNumber.replace('BanhoPay0011', ''));
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  // Générer le prochain numéro
  const nextNumber = maxNumber + 1;
  const digits = nextNumber < 1000 ? 3 : nextNumber < 10000 ? 4 : 5;
  const paddedNumber = nextNumber.toString().padStart(digits, '0');
  
  return `BanhoPay0011${paddedNumber}`;
};

// Créer ou mettre à jour le profil utilisateur
export const saveUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profile,
      uid: userId,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du profil:', error);
    throw error;
  }
};

// Récupérer le profil utilisateur
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
};

// Récupérer un utilisateur par son numéro BanhoPay
export const getUserByBanhoPayNumber = async (banhoPayNumber: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('banhoPayNumber', '==', banhoPayNumber));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la recherche par numéro BanhoPay:', error);
    throw error;
  }
};

// Initialiser le profil BanhoPay pour un nouvel utilisateur
export const initializeBanhoPayProfile = async (userId: string, displayName: string, email: string) => {
  try {
    const existingProfile = await getUserProfile(userId);
    
    if (!existingProfile?.banhoPayNumber) {
      const banhoPayNumber = await generateBanhoPayNumber();
      await saveUserProfile(userId, {
        displayName,
        email,
        banhoPayNumber,
        banhoPayBalance: 0
      });
      return banhoPayNumber;
    }
    return existingProfile.banhoPayNumber;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation BanhoPay:', error);
    throw error;
  }
};

// Upload photo de profil
export const uploadProfilePhoto = async (file: File, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `profiles/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    }
    
    await saveUserProfile(userId, { photoURL: downloadURL });
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    throw error;
  }
};

// Mettre à jour le nom d'affichage
export const updateDisplayName = async (userId: string, displayName: string) => {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }
    await saveUserProfile(userId, { displayName });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du nom:', error);
    throw error;
  }
};
