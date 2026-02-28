// firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasRequiredConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;
let storage = null;

console.log("Firebase Config Loaded:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

if (!hasRequiredConfig) {
  console.warn(
    "Firebase config missing. Skipping Firebase initialization. Set VITE_FIREBASE_* env vars to enable Firebase features."
  );
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase initialized.");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
}

export { auth, db, storage };
export default app;