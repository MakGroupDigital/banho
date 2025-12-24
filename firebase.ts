// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbEkkwODhD3jGpQn5LfiCOq_LcP5VIC1Y",
  authDomain: "banho-zando-online-3ljs41.firebaseapp.com",
  projectId: "banho-zando-online-3ljs41",
  storageBucket: "banho-zando-online-3ljs41.appspot.com",
  messagingSenderId: "668054913818",
  appId: "1:668054913818:web:33b6a2c1683671f5c0a2a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
