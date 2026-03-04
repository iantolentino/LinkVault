// frontend/src/js/migration.js
import { auth } from "./firebase-config.js";
import { api } from "./api-client.js";

async function migrateLocalStorage() {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login first");
        return;
    }

    // Get data from localStorage
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const userData = {
        user_id: user.uid,
        categories: categories.map(name => ({
            name: name,
            links: JSON.parse(localStorage.getItem(name) || '[]')
        }))
    };

    // Upload to backend
    try {
        await api.migrateData(userData);
        alert("Migration successful! Your data is now in the cloud.");
        localStorage.clear(); // Optional: clear local data
    } catch (error) {
        console.error("Migration failed:", error);
        alert("Migration failed. Please try again.");
    }
}

// Add migration button to UI
document.getElementById('migrateBtn')?.addEventListener('click', migrateLocalStorage);