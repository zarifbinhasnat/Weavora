// firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Add this for file uploads

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrB9FupDgjjVk4_guLC24ydG3retE3bME",
  authDomain: "login-auth-4736e.firebaseapp.com",
  projectId: "login-auth-4736e",
  storageBucket: "login-auth-4736e.appspot.com",
  messagingSenderId: "10562914305",
  appId: "1:10562914305:web:2cff37be4fa9ccf0a29800"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authentication instance
export const auth = getAuth(app);

// Export Firestore database instance
export const db = getFirestore(app);

// Export Storage instance for file uploads
export const storage = getStorage(app);

// Export the app as default
export default app;