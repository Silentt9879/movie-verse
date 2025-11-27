// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// 👇 NEW: Import getFirestore
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration (Keep your current keys!)
const firebaseConfig = {
  apiKey: "AIzaSyD4Tc_IScSkFnub43Vd5Ml8GCEAinD6PAk",
  authDomain: "movieverse-c05e3.firebaseapp.com",
  projectId: "movieverse-c05e3",
  storageBucket: "movieverse-c05e3.firebasestorage.app",
  messagingSenderId: "956438565226",
  appId: "1:956438565226:web:7009a88af76ed1bbba1513",
  measurementId: "G-N02GKXXFBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Auth and Firestore
export const auth = getAuth(app); 
// 👇 NEW: Export the Firestore instance
export const db = getFirestore(app); 

export default app;