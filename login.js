// Initialize Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // Login function
  document.getElementById("loginBtn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log("User signed in:", result.user);
        localStorage.setItem("user", JSON.stringify(result.user)); // Store user info
        window.location.href = "homepage.html"; // Redirect to homepage
      })
      .catch((error) => {
        console.error("Login failed:", error);
      });
  });
  
  // Check if user is already logged in
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "homepage.html"; // Redirect if logged in
    }
  });
  