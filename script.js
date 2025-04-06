document.addEventListener("DOMContentLoaded", loadLinks);
let isDarkMode = localStorage.getItem("darkMode") === "true";
loadLinks();

// Check user authentication
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        // Only load content after auth check
        initializeApp();
    }
});

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    console.log("Logout button found, attaching event listener");
    logoutBtn.addEventListener("click", () => {
        console.log("Logout button clicked");
        firebase.auth().signOut()
            .then(() => {
                console.log("Sign-out promise resolved");
                window.location.href = "index.html"; // Redirect to login
            })
            .catch(error => {
                console.error("Logout error:", error.message);
            });
    });
} else {
    console.log("Logout button not found");
}

loadCategories();
loadLinks();

// Google login functionality
document.getElementById("google-login").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("User  signed in:", result.user);
            window.location.href = "homepage.html"; // Redirect on success
        })
        .catch((error) => {
            console.error("Login error:", error);
        });
});

// Load links from local storage
function loadLinks() {
    let savedCategories = JSON.parse(localStorage.getItem("categories") || "[]");
    
    // Sort categories alphabetically
    savedCategories.sort((a, b) => a.localeCompare(b));

    savedCategories.forEach(categoryName => {
        if (!document.getElementById(categoryName)) {
            createCategoryElement(categoryName);
        }
        loadLinksForCategory(categoryName);
        adjustCategoriesToUppercase();
    });
}

// Function to add a new category
function addCategory() {
    const categoryName = prompt("Enter new category name:");
    if (categoryName && !document.getElementById(categoryName)) {
        createCategoryElement(categoryName);
        saveCategories();
    }
}

// Function to rename a category
function renameCategory(oldName) {
    const newName = prompt("Enter new category name:", oldName);
    if (newName && newName !== oldName && !document.getElementById(newName)) {
        const section = document.getElementById(oldName);

        // Transfer links from old category to new category in localStorage
        const oldLinks = JSON.parse(localStorage.getItem(oldName) || "[]");
        localStorage.setItem(newName, JSON.stringify(oldLinks));
        localStorage.removeItem(oldName); // Remove old entry

        // Update UI elements
        section.id = newName;
        section.querySelector(".category-title").textContent = newName;
        section.querySelector(".rename-btn").setAttribute("onclick", `renameCategory('${newName}')`);
        section.querySelector(".delete-btn").setAttribute("onclick", `deleteCategory('${newName}')`);

        // Update category list in localStorage
        let categories = JSON.parse(localStorage.getItem("categories") || "[]");
        categories = categories.map(category => (category === oldName ? newName : category));
        localStorage.setItem("categories", JSON.stringify(categories));
    }
}

// Function to delete a category
function deleteCategory(categoryName) {
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
        document.getElementById(categoryName).remove();
        localStorage.removeItem(categoryName);
        saveCategories();
    }
}

// Toggle edit mode for a category
function toggleEditMode(button) {
    const section = button.closest(".section");
    const editMode = section.querySelector(".edit-mode");
    editMode.style.display = editMode.style.display === "none" ? "block" : "none";
}

// Function to add a link to a category
function addLink(categoryName) {
    const titleInput = document.getElementById(`${categoryName}-title`);
    const urlInput = document.getElementById(`${categoryName}-url`);
    if (!titleInput || !urlInput) {
        console.error(`Input fields not found for category: ${categoryName}`);
        return;
    }
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    if (title && url) {
        const nav = document.querySelector(`#${categoryName} nav`);
        if (!nav) {
            console.error(`Navigation section not found for category: ${categoryName}`);
            return;
        }
        createLinkElement(nav, title, url, categoryName);
        saveLinkToStorage(categoryName, title, url);
        titleInput.value = "";
        urlInput.value = "";
    } else {
        alert("Please enter both a title and a valid URL.");
    }
}

// Function to create a link element
function createLinkElement(nav, title, url, categoryName) {
    const linkContainer = document.createElement("div");
    linkContainer.className = "link-container";
    
    const newLink = document.createElement("a");
    newLink.href = url;
    newLink.textContent = title;
    newLink.target = "_blank";
    
    // Ensure the link inherits the correct color
    if (isDarkMode) {
        newLink.style.color = "#f9f9f9";
    } else {
        newLink.style.color = "#333";
    }
    
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function() { deleteLink(deleteButton, categoryName, title, url); };
    
    linkContainer.appendChild(newLink);
    linkContainer.appendChild(deleteButton);
    nav.appendChild(linkContainer);
}

// Function to save a link to local storage
function saveLinkToStorage(categoryName, title, url) {
    const links = JSON.parse(localStorage.getItem(categoryName) || "[]");
    links.push({ title, url });
    localStorage.setItem(categoryName, JSON.stringify(links));
}

// Function to delete a link
function deleteLink(button, categoryName, title, url) {
    const linkContainer = button.parentElement;
    linkContainer.remove();
    let links = JSON.parse(localStorage.getItem(categoryName) || "[]");
    links = links.filter(link => !(link.title === title && link.url === url));
    localStorage.setItem(categoryName, JSON.stringify(links));
}

// Function to load links for a specific category
function loadLinksForCategory(categoryName) {
    const nav = document.querySelector(`#${categoryName} nav`);
    if (!nav) {
        console.error(`Navigation section not found for category: ${categoryName}`);
        return;
    }
    nav.innerHTML = "";
    const links = JSON.parse(localStorage.getItem(categoryName) || "[]");
    links.forEach(link => {
        createLinkElement(nav, link.title, link.url, categoryName);
    });
}

// Function to save categories to local storage
function saveCategories() {
    const categories = Array.from(document.getElementById("container").children).map(child => child.id);
    localStorage.setItem("categories", JSON.stringify(categories));
}

// Function to toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyDarkMode();
    
    // Update button text
    const modeToggle = document.querySelector('.mode-toggle');
    if (modeToggle) {
        modeToggle.textContent = isDarkMode ? '◯ Light Mode' : '☾  Dark Mode';
    }
}

// Function to apply dark mode styles
function applyDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark'); // Save the theme in local storage
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light'); // Save the theme in local storage
    }
}

// Function to load the theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
    } else {
        isDarkMode = false;
    }
    applyDarkMode(); // Apply the loaded theme
}

// Call loadTheme on page load
window.onload = loadTheme;

// Show format modal
function showFormatModal() {
    document.getElementById("formatModal").style.display = "flex";
}

// Close format modal
function closeModal() {
    document.getElementById("formatModal").style.display = "none";
}

// Format Export (Download)
function downloadFormat() {
    const categories = {};
    const savedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    savedCategories.forEach(category => {
        categories[category] = JSON.parse(localStorage.getItem(category) || '[]');
    });
    
    const dataStr = "data:text/json;charset=utf-8," + 
                   encodeURIComponent(JSON.stringify(categories, null, 2));
                   const downloadAnchor = document.createElement('a');
                   downloadAnchor.setAttribute('href', dataStr);
                   downloadAnchor.setAttribute('download', `linkvault_${new Date().toISOString().split('T')[0]}.json`);
                   document.body.appendChild(downloadAnchor);
                   downloadAnchor.click();
                   downloadAnchor.remove();
                   closeModal();
               }
               
               // Format Import (Upload)
             // Format Import (Upload)
document.getElementById('formatUpload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            if (!validateFormat(importedData)) {
                alert("Invalid format file structure!");
                return;
            }
            
            // Clear existing data
            localStorage.clear();
            
            // Save new categories
            const categories = Object.keys(importedData);
            localStorage.setItem('categories', JSON.stringify(categories));
            
            // Save each category's links
            categories.forEach(category => {
                const links = importedData[category].map(link => ({
                    title: link.title,
                    url: link.url
                }));
                localStorage.setItem(category, JSON.stringify(links));
            });
            
            // Refresh the UI
            document.getElementById('container').innerHTML = '';
            loadLinks();
            alert("Format imported successfully!");
            closeModal();
        } catch (error) {
            alert("Error reading file: " + error.message);
        }
    };
    reader.readAsText(file);
});

function applyFormat() {
    const fileInput = document.getElementById('formatUpload');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!validateFormat(importedData)) {
                    alert("Invalid format file structure!");
                    return;
                }
                // Clear existing data
                localStorage.clear();
                // Save new categories and links
                const categories = Object.keys(importedData);
                localStorage.setItem('categories', JSON.stringify(categories));
                categories.forEach(category => {
                    const links = importedData[category].map(link => ({
                        title: link.title,
                        url: link.url
                    }));
                    localStorage.setItem(category, JSON.stringify(links));
                });
                // Refresh the UI
                document.getElementById('container').innerHTML = '';
                loadLinks();
                alert("Format applied successfully!");
            } catch (error) {
                alert("Error reading file: " + error.message);
            }
        };
        reader.readAsText(file);
    } else {
        alert("Please select a file to apply.");
    }
}

// Validate imported format
    function validateFormat(data) {
        if (typeof data !== 'object') return false;
            return Object.values(data).every(category => 
                Array.isArray(category) && 
               category.every(link => link && link.title && link.url)
               );
}
               
// Modal Controls
function showFormatModal() {
    document.getElementById('formatModal').style.display = 'flex';
}
               
function closeModal() {
       document.getElementById('formatModal').style.display = 'none';
}
               
// Consolidated createCategoryElement with improved structure
function createCategoryElement(categoryName) {
    const section = document.createElement("div");
        section.className = "section";
        section.id = categoryName;
        section.innerHTML = `
                    <h2>
                        <span class="category-title">${categoryName}</span>
                        <div class="button-group">
                            <button onclick="toggleEditMode(this)" title="Edit">
                                <img class="icon" src="https://cdn-icons-png.flaticon.com/32/992/992651.png" alt="Edit">
                            </button>
                            <button class="rename-btn" onclick="renameCategory('${categoryName}')" title="Rename">
                                <img class="icon" src="https://cdn-icons-png.flaticon.com/32/1250/1250903.png" alt="Rename">
                            </button>
                            <button class="delete-btn" onclick="deleteCategory('${categoryName}')" title="Delete">
                                <img class="icon" src="https://cdn-icons-png.flaticon.com/32/6861/6861362.png" alt="Delete">
                            </button>
                        </div>
                    </h2>
                    <nav></nav>
                    <div class="edit-mode" style="display: none;">
                        <input type="text" placeholder="Link Title" id="${categoryName}-title">
                        <input type="url" placeholder="Link URL" id="${categoryName}-url">
                        <button onclick="addLink('${categoryName}')" title="Add">
                            <img class="icon" src="https://cdn-icons-png.flaticon.com/32/992/992651.png" alt="Add">
                        </button>
                    </div>
                `;
        document.getElementById("container").appendChild(section);
            loadLinksForCategory(categoryName);
}
               
               // Function to search links (case-insensitive)
         // Function to search links (case-insensitive)
function searchLinks() {
    const query = document.querySelector(".search-bar").value.trim().toUpperCase();
    // Get all sections (categories)
    const sections = document.querySelectorAll(".section");
    sections.forEach(section => {
        // For each link within the category's nav element
        const links = section.querySelectorAll("nav a");
        links.forEach(link => {
            // Compare link text in uppercase to the query
            if (link.textContent.toUpperCase().includes(query)) {
                link.classList.add("highlight"); // Add CSS class for highlighting
            } else {
                link.classList.remove("highlight");
            }
        });
    });
}

// Function to adjust category titles to uppercase in the UI
function adjustCategoriesToUppercase() {
    const categoryTitles = document.querySelectorAll(".category-title");
    categoryTitles.forEach(title => {
        title.textContent = title.textContent.toUpperCase();
    });
}

// Function to toggle the menu visibility
function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("show");
}