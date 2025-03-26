import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    // Check if user is authenticated
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "index.html"; // Redirect to login page if not authenticated
        }
    });

    // Logout functionality
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth)
                .then(() => {
                    console.log("User signed out");
                    window.location.href = "index.html"; // Redirect to login
                })
                .catch((error) => {
                    console.error("Logout error:", error);
                });
        });
    }
});
