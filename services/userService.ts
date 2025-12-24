import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

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

// Upload photo de profil
export const uploadProfilePhoto = async (file: File, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `profiles/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Mettre à jour le profil Firebase Auth
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
    }
    
    // Mettre à jour le profil Firestore
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
    // Mettre à jour Firebase Auth
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }
    
    // Mettre à jour Firestore
    await saveUserProfile(userId, { displayName });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du nom:', error);
    throw error;
  }
};
