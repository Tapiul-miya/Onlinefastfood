import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  addDoc, 
  getDocs,
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDlyhzJqxHu-cEDpE9WWIlUq29lnMW9lFs",
  authDomain: "gen-lang-client-0881564766.firebaseapp.com",
  projectId: "gen-lang-client-0881564766",
  storageBucket: "gen-lang-client-0881564766.firebasestorage.app",
  messagingSenderId: "13178099429",
  appId: "1:13178099429:web:bb09e0dfb8cdd4f3f8660c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-fastbitedelivery-1a2efdb9-8154-4864-bc49-30c10f8bc480");
