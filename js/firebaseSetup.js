import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc, increment, collection, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-L8ZEj63HthEbwqajejoC1WquFgyHX_o",
  authDomain: "scraper-2205e.firebaseapp.com",
  projectId: "scraper-2205e",
  storageBucket: "scraper-2205e.firebasestorage.app",
  messagingSenderId: "901643684647",
  appId: "1:901643684647:web:1813b94fdde79b7a453702",
  measurementId: "G-SNR2T2NFG6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Exporting necessary primitives so app.js doesn't have to re-import from the bare specifier.
export { doc, setDoc, updateDoc, increment, collection, onSnapshot };
