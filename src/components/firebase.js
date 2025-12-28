import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxADjkwSMuQQhM94ThQ6oHVMDy0VP_A2o",
  authDomain: "campus-hub-38d7c.firebaseapp.com",
  databaseURL: "https://campus-hub-38d7c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "campus-hub-38d7c",
  storageBucket: "campus-hub-38d7c.firebasestorage.app",
  messagingSenderId: "224989853174",
  appId: "1:224989853174:web:a9e18e3a96cf430aa203d7",
};

const app = initializeApp(firebaseConfig);

// ✅ Firestore (this is what your code uses)
export const db = getFirestore(app);

// ✅ Storage (optional, for uploads later)
export const storage = getStorage(app);

export default app;
