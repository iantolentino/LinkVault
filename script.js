document.addEventListener("DOMContentLoaded", loadLinks);
    let isDarkMode = localStorage.getItem("darkMode") === "true";
    applyDarkMode();

// Check user authentication
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html"; // Redirect if not logged in
    }
});

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        firebase.auth().signOut().then(() => {
            console.log("User signed out");
            window.location.href = "index.html"; // Redirect to login
        }).catch(error => {
            console.error("Logout error:", error);
        });
    });
}

loadCategories();
loadLinks();

// document.getElementById("addCategoryBtn").addEventListener("click", addCategory);
// document.getElementById("addLinkBtn").addEventListener("click", addLink);
// document.getElementById("searchInput").addEventListener("input", searchLinks);

document.getElementById("google-login").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("User signed in:", result.user);
            window.location.href = "homepage.html"; // Redirect on success
        })
        .catch((error) => {
            console.error("Login error:", error);
        });
});


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

function addCategory() {
    const categoryName = prompt("Enter new category name:");
    if (categoryName && !document.getElementById(categoryName)) {
        createCategoryElement(categoryName);
        saveCategories();
    }
}

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


function deleteCategory(categoryName) {
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
        document.getElementById(categoryName).remove();
        localStorage.removeItem(categoryName);
        saveCategories();
    }
}

// UPDATED toggleEditMode: use closest() to reliably find the edit container
function toggleEditMode(button) {
    const section = button.closest(".section");
    const editMode = section.querySelector(".edit-mode");
    editMode.style.display = editMode.style.display === "none" ? "block" : "none";
}

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

function createLinkElement(nav, title, url, categoryName) {
    const linkContainer = document.createElement("div");
    linkContainer.className = "link-container";
    
    const newLink = document.createElement("a");
    newLink.href = url;
    newLink.textContent = title;
    newLink.target = "_blank";
    
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function() { deleteLink(deleteButton, categoryName, title, url); };
    
    linkContainer.appendChild(newLink);
    linkContainer.appendChild(deleteButton);
    nav.appendChild(linkContainer);
}

function saveLinkToStorage(categoryName, title, url) {
    const links = JSON.parse(localStorage.getItem(categoryName) || "[]");
    links.push({ title, url });
    localStorage.setItem(categoryName, JSON.stringify(links));
}

function deleteLink(button, categoryName, title, url) {
    const linkContainer = button.parentElement;
    linkContainer.remove();
    let links = JSON.parse(localStorage.getItem(categoryName) || "[]");
    links = links.filter(link => !(link.title === title && link.url === url));
    localStorage.setItem(categoryName, JSON.stringify(links));
}

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

function saveCategories() {
    const categories = Array.from(document.getElementById("container").children).map(child => child.id);
    localStorage.setItem("categories", JSON.stringify(categories));
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyDarkMode();
}

function applyDarkMode() {
    document.body.style.backgroundColor = isDarkMode ? "#333" : "#f9f9f9";
    document.body.style.color = "#fff";
    document.querySelectorAll("body, .section, .category-title, h2, button, input, nav a").forEach(el => {
        el.style.color = "#fff";  // Force all text to stay white
    });
    document.querySelectorAll("input, button").forEach(el => {
        el.style.backgroundColor = isDarkMode ? "#444" : "#555"; // Adjust button/input background
    });
}

function showFormatModal() {
    document.getElementById("formatModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("formatModal").style.display = "none";
}

function downloadFormat() {
    const categories = {};
    document.querySelectorAll(".section").forEach(section => {
        const sectionId = section.id;
        const links = JSON.parse(localStorage.getItem(sectionId) || "[]");
        categories[sectionId] = links;
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categories, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "linkvault_format.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function uploadFormat(files) {
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const importedData = JSON.parse(e.target.result);
            localStorage.clear();
            localStorage.setItem("categories", JSON.stringify(Object.keys(importedData)));
            document.getElementById("container").innerHTML = "";
            for (let category in importedData) {
                localStorage.setItem(category, JSON.stringify(importedData[category]));
                createCategoryElement(category);
                loadLinksForCategory(category);
            }
            closeModal();
        };
        reader.readAsText(file);
    }
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

const style = document.createElement("style");
style.innerHTML = `
    .icon {
        width: 20px;
        height: 20px;
        vertical-align: middle;
    }
    button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }
`;
document.head.appendChild(style);

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
          link.classList.add("highlight"); // add CSS class for highlighting
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

  function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("show");
  }

  
