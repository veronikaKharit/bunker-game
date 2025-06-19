import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  updateDoc,
  collection, 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGFESB2uk7z81X3-SNq6dpaTb_wtYggI0",
  authDomain: "bunkergame-8e5b6.firebaseapp.com",
  projectId: "bunkergame-8e5b6",
  storageBucket: "bunkergame-8e5b6.firebasestorage.app",
  messagingSenderId: "498547459362",
  appId: "1:498547459362:web:f0c2e7ad15f4aa064c917b",
  measurementId: "G-QB2KXM2EYY"
};
// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Получение ссылки на Firestore
const db = getFirestore(app);

export { 
    db, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  updateDoc,
  collection
}; 