// frontend/src/js/firebase-config.js
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

// Logger
const logger = {
  info: (msg, data) => console.log(`📘 [FIREBASE] ${msg}`, data || ''),
  error: (msg, err) => console.error(`❌ [FIREBASE] ${msg}`, err),
  success: (msg, data) => console.log(`✅ [FIREBASE] ${msg}`, data || '')
};

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

logger.info('Initializing Firebase with config', { projectId: firebaseConfig.projectId });

// Initialize Firebase
let app;
let auth;
let provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  
  // Add scopes if needed
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  logger.success('Firebase initialized successfully');
} catch (error) {
  logger.error('Firebase initialization failed', error);
}

// Add token refresh handling
if (auth) {
  auth.onIdTokenChanged(async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        localStorage.setItem('firebase_token', token);
        logger.info('Token refreshed and stored');
      } catch (error) {
        logger.error('Token refresh failed', error);
      }
    } else {
      localStorage.removeItem('firebase_token');
      logger.info('User signed out, token removed');
    }
  });
}

// Export all auth methods with null checks
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

// Add to window for console debugging
window.FirebaseAuth = {
  auth,
  provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
};

console.log('🔥 Firebase debug available: window.FirebaseAuth');

// Add token refresh every hour
if (auth) {
    setInterval(async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const token = await user.getIdToken(true);
                localStorage.setItem('firebase_token', token);
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }
    }, 55 * 60 * 1000); // Refresh every 55 minutes
}