// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkkSbOQ_3j1FTn7y2w0QDlfmfSXlNpZNQ",
  authDomain: "linkvault-49654.firebaseapp.com",
  projectId: "linkvault-49654",
  storageBucket: "linkvault-49654.appspot.com",
  messagingSenderId: "645357566621",
  appId: "1:645357566621:web:bb52b835a760583ae03274",
  measurementId: "G-T60L4HH3C6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized:', app ? true : false);

// Initialize Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export all needed authentication methods
export { 
  auth, 
  provider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
};