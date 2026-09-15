import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// This config is meant to be public in client-side code — Firebase access
// control comes from the Firestore security rules you set in the console,
// not from keeping this secret.
const firebaseConfig = {
  apiKey: "AIzaSyD3F6t4kKc74pDAGaAOE9PTBssO5hFzs_0",
  authDomain: "impactwater-stock.firebaseapp.com",
  projectId: "impactwater-stock",
  storageBucket: "impactwater-stock.firebasestorage.app",
  messagingSenderId: "69932423011",
  appId: "1:69932423011:web:3944329c20975dd57f6556",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
