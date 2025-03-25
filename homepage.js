// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkkSbOQ_3j1FTn7y2w0QDlfmfSXlNpZNQ",
  authDomain: "linkvault-49654.firebaseapp.com",
  projectId: "linkvault-49654",
  storageBucket: "linkvault-49654.firebasestorage.app",
  messagingSenderId: "645357566621",
  appId: "1:645357566621:web:bb52b835a760583ae03274",
  measurementId: "G-T60L4HH3C6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check user authentication status
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Redirect to login page if not logged in
    window.location.href = "index.html";
  } else {
    console.log("User logged in:", user.displayName);
    document.getElementById("welcomeText").innerText = `Welcome, ${user.displayName}!`;
  }
});

// Logout function
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("User signed out");
      window.location.href = "index.html"; // Redirect to login
    })
    .catch((error) => {
      console.error("Logout Error:", error);
    });
});
