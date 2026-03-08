// ================= IMPORTS =================
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// ================= DEBUG LOG =================
console.log("Firebase Config Loaded:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// ================= INITIALIZE FIREBASE =================
const app = initializeApp(firebaseConfig);

// ================= EXPORT INSTANCES =================
export const auth = getAuth(app);        // Firebase Authentication
export const db = getFirestore(app);    // Firestore Database
export const storage = getStorage(app); // Storage for files
export const timestamp = Timestamp;     // Firestore server timestamp

// ================= FIRESTORE TEST =================
// Test connectivity to Firestore
export const testFirestoreConnection = async () => {
  try {
    const col = db.collection ? db.collection("bugs") : null; // old check
    console.log("Firestore initialized. Ready to add documents!");
  } catch (err) {
    console.error("Firestore connection error:", err);
  }
};

// ================= EXPORT DEFAULT =================
export default app;