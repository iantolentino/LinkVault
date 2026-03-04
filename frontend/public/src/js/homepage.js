// frontend/src/js/homepage.js
import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";
import { api } from "./api-client.js";

// Logger with ALL functions
const logger = {
    info: (msg, data) => console.log(`📘 [HOMEPAGE] ${msg}`, data || ''),
    error: (msg, err) => console.error(`❌ [HOMEPAGE] ${msg}`, err),
    success: (msg, data) => console.log(`✅ [HOMEPAGE] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`⚠️ [HOMEPAGE] ${msg}`, data || '')  // This was missing
};

// State
let currentUser = null;
let isDarkMode = localStorage.getItem("darkMode") === "true";

// Helper function to sanitize ID for CSS selector
function safeId(id) {
    return CSS.escape(id);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// Show/hide loading spinner
function setLoading(loading) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = loading ? 'block' : 'none';
    }
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    logger.info("Homepage loaded");
    
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            logger.info("No user, redirecting to login");
            window.location.href = "index.html";
        } else {
            currentUser = user;
            logger.success("User authenticated", { email: user.email });
            
            // Use user-specific localStorage keys
            const userStorageKey = `linkvault_${user.uid}`;
            if (!localStorage.getItem(userStorageKey)) {
                localStorage.setItem(userStorageKey, JSON.stringify({ categories: [] }));
            }
            
            await loadUserData();
        }
    });

    // Set up event listeners
    setupEventListeners();
    
    // Apply theme
    applyDarkMode();
    
    // Make functions globally available
    window.toggleEditMode = toggleEditMode;
    window.renameCategory = renameCategory;
    window.deleteCategory = deleteCategory;
    window.addLink = addLink;
    window.deleteLink = deleteLink;
});

function setupEventListeners() {
    logger.info("Setting up event listeners");
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', handleAddCategory);
    }
    
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', handleSearch);
    }
    
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', toggleDarkMode);
        modeToggle.textContent = isDarkMode ? '☾ Dark Mode' : '◯ Light Mode';
    }
    
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) {
        formatBtn.addEventListener('click', showFormatModal);
    }
    
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeFormatModal);
    }
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeFormatModal);
    }
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyData);
    }
}

async function handleLogout() {
    try {
        logger.info("Logging out");
        setLoading(true);
        await signOut(auth);
        localStorage.removeItem('firebase_token');
        logger.success("Logged out successfully");
        window.location.href = "index.html";
    } catch (error) {
        logger.error("Logout failed", error);
        showNotification("Logout failed: " + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function loadUserData() {
    try {
        setLoading(true);
        logger.info("Loading user data from API");
        
        // Load from API
        const categories = await api.getCategories();
        logger.success("Categories loaded from API", { count: categories.length });
        
        // Render categories
        renderCategories(categories);
        
    } catch (error) {
        logger.error("Failed to load from API, checking localStorage as fallback", error);
        // Fallback to localStorage if API fails
        loadFromLocalStorage();
        showNotification('Using offline mode - changes will not be saved to cloud', 'warn');
    } finally {
        setLoading(false);
    }
}

function getUserStorageKey() {
    return currentUser ? `linkvault_${currentUser.uid}` : 'linkvault_temp';
}

function loadFromLocalStorage() {
    const container = document.getElementById('container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const storageKey = currentUser ? `linkvault_${currentUser.uid}` : 'linkvault_temp';
    const userData = JSON.parse(localStorage.getItem(storageKey) || '{"categories":[]}');
    const categories = userData.categories || [];
    
    categories.forEach(category => {
        createCategoryElement(category.name);
        (category.links || []).forEach(link => {
            addLinkToDOM(category.name, link.title, link.url);
        });
    });
    
    logger.info(`Loaded ${categories.length} categories from localStorage`);
}

function saveCurrentState() {
    const categories = [];
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const name = section.id;
        const links = [];
        const linkElements = section.querySelectorAll('.link-container a');
        
        linkElements.forEach(link => {
            links.push({
                title: link.textContent,
                url: link.href
            });
        });
        
        categories.push({ name, links });
    });
    
    saveToLocalStorage(categories);
    logger.info("Current state saved to localStorage");
}

function renderCategories(categories) {
    const container = document.getElementById('container');
    if (!container) return;
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        createCategoryElement(category.name);
        if (category.links) {
            category.links.forEach(link => {
                addLinkToDOM(category.name, link.title, link.url);
            });
        }
    });
}

async function handleAddCategory() {
    const name = prompt("Enter category name:");
    if (!name || !name.trim()) return;
    
    const trimmedName = name.trim();
    
    try {
        setLoading(true);
        logger.info("Adding category", { name: trimmedName });
        
        // Create via API
        await api.createCategory(trimmedName);
        
        // Update UI
        if (!document.getElementById(trimmedName)) {
            createCategoryElement(trimmedName);
        }
        
        showNotification(`Category "${trimmedName}" created`, 'success');
        
    } catch (error) {
        logger.error("Failed to add category via API", error);
        
        // Fallback to localStorage
        if (!document.getElementById(trimmedName)) {
            createCategoryElement(trimmedName);
            saveToLocalStorage();
        }
        
        showNotification('Category saved locally only', 'warn');
    } finally {
        setLoading(false);
    }
}

function createCategoryElement(name) {
    if (document.getElementById(name)) return null;
    
    const section = document.createElement("div");
    section.className = "section";
    section.id = name;
    
    const escapedName = name.replace(/'/g, "\\'");
    
    section.innerHTML = `
        <h2>
            <span class="category-title">${name.toUpperCase()}</span>
            <div class="button-group">
                <button onclick="toggleEditMode(this)" title="Add Link">
                    <img class="icon" src="https://cdn-icons-png.flaticon.com/32/992/992651.png" alt="Add">
                </button>
                <button onclick="renameCategory('${escapedName}')" title="Rename">
                    <img class="icon" src="https://cdn-icons-png.flaticon.com/32/1250/1250903.png" alt="Rename">
                </button>
                <button onclick="deleteCategory('${escapedName}')" title="Delete">
                    <img class="icon" src="https://cdn-icons-png.flaticon.com/32/6861/6861362.png" alt="Delete">
                </button>
            </div>
        </h2>
        <nav></nav>
        <div class="edit-mode" style="display: none;">
            <input type="text" placeholder="Link Title" id="${name}-title">
            <input type="url" placeholder="Link URL" id="${name}-url">
            <button onclick="addLink('${escapedName}')">Add Link</button>
        </div>
    `;
    
    document.getElementById("container").appendChild(section);
    return section;
}

function toggleEditMode(button) {
    const section = button.closest(".section");
    const editMode = section.querySelector(".edit-mode");
    if (editMode) {
        editMode.style.display = editMode.style.display === "none" ? "block" : "none";
    }
}

async function addLink(categoryName) {
    const titleInput = document.getElementById(`${categoryName}-title`);
    const urlInput = document.getElementById(`${categoryName}-url`);
    
    if (!titleInput || !urlInput) {
        logger.error("Input fields not found");
        return;
    }
    
    const title = titleInput.value.trim();
    let url = urlInput.value.trim();
    
    if (!title || !url) {
        showNotification("Please enter both title and URL", 'error');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        setLoading(true);
        logger.info("Adding link", { category: categoryName, title, url });
        
        // Add via API
        await api.addLink(categoryName, { title, url });
        
        // Update UI
        addLinkToDOM(categoryName, title, url);
        
        titleInput.value = '';
        urlInput.value = '';
        
        const section = document.getElementById(categoryName);
        const editMode = section.querySelector(".edit-mode");
        if (editMode) {
            editMode.style.display = "none";
        }
        
        showNotification("Link added", 'success');
        
    } catch (error) {
        logger.error("Failed to add link via API", error);
        
        // Fallback to localStorage
        addLinkToDOM(categoryName, title, url);
        saveToLocalStorage();
        
        showNotification('Link saved locally only', 'warn');
    } finally {
        setLoading(false);
    }
}

function addLinkToDOM(categoryName, title, url) {
    const nav = document.querySelector(`#${safeId(categoryName)} nav`);
    if (!nav) {
        logger.error(`Nav not found for category: ${categoryName}`);
        return;
    }
    
    const escapedCategory = categoryName.replace(/'/g, "\\'");
    const escapedTitle = title.replace(/'/g, "\\'");
    const escapedUrl = url.replace(/'/g, "\\'");
    
    const container = document.createElement("div");
    container.className = "link-container";
    container.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
        <button class="delete-button" onclick="deleteLink(this, '${escapedCategory}', '${escapedTitle}', '${escapedUrl}')">Delete</button>
    `;
    
    nav.appendChild(container);
}

window.deleteLink = async function(button, categoryName, title, url) {
    if (!confirm("Delete this link?")) return;
    
    try {
        setLoading(true);
        
        // Delete via API
        await api.deleteLink(categoryName, title, url);
        
        // Update UI
        const container = button.closest('.link-container');
        if (container) {
            container.remove();
        }
        
        showNotification("Link deleted", 'success');
        logger.info("Link deleted from API", { category: categoryName, title });
        
    } catch (error) {
        logger.error("Failed to delete link via API", error);
        
        // Fallback: remove from UI and localStorage only
        const container = button.closest('.link-container');
        if (container) {
            container.remove();
        }
        saveToLocalStorage();
        
        showNotification('Link removed locally only', 'warn');
    } finally {
        setLoading(false);
    }
};

async function renameCategory(oldName) {
    const newName = prompt("Enter new category name:", oldName);
    if (!newName || newName === oldName || !newName.trim()) return;
    
    const trimmedNewName = newName.trim();
    
    try {
        setLoading(true);
        logger.info("Renaming category", { from: oldName, to: trimmedNewName });
        
        // Update via API
        await api.updateCategory(oldName, trimmedNewName);
        
        // Update UI
        const section = document.querySelector(`#${safeId(oldName)}`);
        if (section) {
            section.id = trimmedNewName;
            const titleSpan = section.querySelector(".category-title");
            if (titleSpan) {
                titleSpan.textContent = trimmedNewName.toUpperCase();
            }
            
            // Update all onclick attributes
            section.querySelectorAll('[onclick]').forEach(el => {
                const onclick = el.getAttribute('onclick');
                if (onclick) {
                    el.setAttribute('onclick', onclick.replace(oldName, trimmedNewName));
                }
            });
            
            // Update input IDs
            const titleInput = document.getElementById(`${oldName}-title`);
            const urlInput = document.getElementById(`${oldName}-url`);
            if (titleInput) titleInput.id = `${trimmedNewName}-title`;
            if (urlInput) urlInput.id = `${trimmedNewName}-url`;
        }
        
        showNotification(`Category renamed to "${trimmedNewName}"`, 'success');
        
    } catch (error) {
        logger.error("Failed to rename category via API", error);
        
        // Fallback to localStorage
        const section = document.querySelector(`#${safeId(oldName)}`);
        if (section) {
            section.id = trimmedNewName;
            const titleSpan = section.querySelector(".category-title");
            if (titleSpan) {
                titleSpan.textContent = trimmedNewName.toUpperCase();
            }
        }
        saveToLocalStorage();
        
        showNotification('Category renamed locally only', 'warn');
    } finally {
        setLoading(false);
    }
}

window.deleteCategory = async function(categoryName) {
    if (!confirm(`Delete category "${categoryName}" and all its links?`)) return;
    
    try {
        setLoading(true);
        
        // Delete via API
        await api.deleteCategory(categoryName);
        
        // Update UI
        const section = document.getElementById(categoryName);
        if (section) {
            section.remove();
        }
        
        showNotification(`Category "${categoryName}" deleted`, 'success');
        logger.info("Category deleted from API", { category: categoryName });
        
    } catch (error) {
        logger.error("Failed to delete category via API", error);
        
        // Fallback to localStorage
        const section = document.getElementById(categoryName);
        if (section) {
            section.remove();
        }
        saveToLocalStorage();
        
        showNotification('Category removed locally only', 'warn');
    } finally {
        setLoading(false);
    }
};

function saveToLocalStorage() {
    if (!currentUser) return;
    
    const categories = [];
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const name = section.id;
        const links = [];
        const linkElements = section.querySelectorAll('.link-container a');
        
        linkElements.forEach(link => {
            links.push({
                title: link.textContent,
                url: link.href
            });
        });
        
        categories.push({ name, links });
    });
    
    const storageKey = `linkvault_${currentUser.uid}`;
    localStorage.setItem(storageKey, JSON.stringify({ categories }));
    logger.info("Current state saved to localStorage as backup");
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const links = document.querySelectorAll('.link-container a');
    
    links.forEach(link => {
        const text = link.textContent.toLowerCase();
        const container = link.closest('.link-container');
        
        if (text.includes(query)) {
            link.classList.add('highlight');
            if (container) {
                container.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                container.style.borderLeft = '3px solid gold';
            }
        } else {
            link.classList.remove('highlight');
            if (container) {
                container.style.backgroundColor = '';
                container.style.borderLeft = '';
            }
        }
    });
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyDarkMode();
    
    const toggle = document.getElementById('modeToggle');
    if (toggle) {
        toggle.textContent = isDarkMode ? '☾ Dark Mode' : '◯ Light Mode';
    }
}

function applyDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
}

function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
}

function showFormatModal() {
    const modal = document.getElementById('formatModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeFormatModal() {
    const modal = document.getElementById('formatModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function exportData() {
    try {
        // Try to get latest from API first
        const categories = await api.getCategories();
        const userData = { categories };
        
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkvault_${currentUser?.uid || 'backup'}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully', 'success');
        closeFormatModal();
    } catch (error) {
        logger.error("Export failed", error);
        showNotification('Export failed', 'error');
    }
}

function importData() {
    const input = document.getElementById('formatUpload');
    const file = input.files[0];
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('output').textContent = JSON.stringify(data, null, 2);
            showNotification('File loaded, click Apply to use', 'info');
        } catch (error) {
            showNotification('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

async function applyData() {
    const output = document.getElementById('output').textContent;
    if (!output) {
        showNotification('No data to apply', 'error');
        return;
    }
    
    try {
        setLoading(true);
        const userData = JSON.parse(output);
        
        if (!userData.categories || !Array.isArray(userData.categories)) {
            showNotification('Invalid data format', 'error');
            return;
        }
        
        // For each category, create it via API
        for (const category of userData.categories) {
            try {
                await api.createCategory(category.name);
                
                // Add each link
                for (const link of category.links || []) {
                    try {
                        await api.addLink(category.name, link);
                    } catch (linkError) {
                        logger.warn(`Failed to add link ${link.title}`, linkError);
                    }
                }
            } catch (catError) {
                logger.warn(`Failed to create category ${category.name}`, catError);
            }
        }
        
        // Reload data
        await loadUserData();
        
        showNotification('Data applied successfully', 'success');
        closeFormatModal();
    } catch (error) {
        logger.error("Error applying data", error);
        showNotification('Error applying data', 'error');
    } finally {
        setLoading(false);
    }
}