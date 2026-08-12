import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Read configurations from environment variables or fallback values for production client connection
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCziNQymbKYqu4Z1iTWSg5BCHxiLUbQ7Jo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "persona-portfolio-site.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "persona-portfolio-site",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "persona-portfolio-site.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "792368184832",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:792368184832:web:6b2806cd993d083aed308f"
};

let db = null;
let auth = null;
let isCloudActive = false;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isCloudActive = true;
    console.log("Firebase Firestore & Authentication initialized successfully.");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.log("Firebase configurations not set. Operating in Offline Sandbox Mode.");
}

export { db, auth, isCloudActive };
