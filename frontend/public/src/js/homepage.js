// frontend/src/js/homepage.js
import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";
import { api } from "./api-client.js";

// Logger
const logger = {
    info: (msg, data) => console.log(`📘 [HOMEPAGE] ${msg}`, data || ''),
    error: (msg, err) => console.error(`❌ [HOMEPAGE] ${msg}`, err),
    success: (msg, data) => console.log(`✅ [HOMEPAGE] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`⚠️ [HOMEPAGE] ${msg}`, data || '')
};

// State
let currentUser = null;
let isDarkMode = localStorage.getItem("darkMode") === "true";
let activeDropdown = null;

// Helper functions
function safeId(id) {
    return CSS.escape(id);
}

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

function setLoading(loading) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = loading ? 'block' : 'none';
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
    });
    activeDropdown = null;
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.three-dots-menu')) {
        closeAllDropdowns();
    }
});

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    logger.info("Homepage loaded");
    
// Inside your DOMContentLoaded listener in homepage.js
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Clear the UI immediately so the next person doesn't see anything
            const container = document.getElementById('container');
            if (container) container.innerHTML = ''; 
            
            localStorage.removeItem('firebase_token');
            window.location.href = "index.html";
        } else {
            currentUser = user;
            logger.success("User authenticated", { email: user.email });
    
            // --- NEW USERNAME LOGIC START ---
            try {
                const email = user.email;
                const rawUsername = email.split('@')[0];
                // Optional: Capitalize first letter for a cleaner look
                const formattedName = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
                
                const nameDisplay = document.getElementById('user-display-name');
                if (nameDisplay) {
                    nameDisplay.textContent = ` - ${formattedName}`;
                }
            } catch (nameErr) {
                logger.error("Could not set username display", nameErr);
            }
            // --- NEW USERNAME LOGIC END ---
            
            // Ensure the token is current for the API client
            const token = await user.getIdToken();
            localStorage.setItem('firebase_token', token);
            
            const userStorageKey = `linkvault_${user.uid}`;
            if (!localStorage.getItem(userStorageKey)) {
                localStorage.setItem(userStorageKey, JSON.stringify({ categories: [] }));
            }
            
            await loadUserData();
        }
});
    });

    setupEventListeners();
    applyDarkMode();
    
    // Make functions globally available
    window.toggleDropdown = toggleDropdown;
    window.editCategory = editCategory;
    window.deleteCategory = deleteCategory;
    window.openAddLinkModal = openAddLinkModal;
    window.closeAddLinkModal = closeAddLinkModal;
    window.closeEditLinkModal = closeEditLinkModal;
    window.saveNewLink = saveNewLink;
    window.editLink = editLink;
    window.saveEditedLink = saveEditedLink;
    window.deleteLink = deleteLink;
});

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', handleAddCategory);
    
    const searchBar = document.getElementById('searchBar');
    if (searchBar) searchBar.addEventListener('input', handleSearch);
    
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', toggleDarkMode);
        modeToggle.textContent = isDarkMode ? '☾ Dark Mode' : '◯ Light Mode';
    }
    
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    
    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) formatBtn.addEventListener('click', showFormatModal);
    
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.addEventListener('click', closeFormatModal);
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFormatModal);
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('click', importData);
    
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyData);
}

// FIX: Improved Logout to clear user-specific cache
async function handleLogout() {
    try {
        setLoading(true);
        if (currentUser) {
            localStorage.removeItem(`linkvault_${currentUser.uid}`);
        }
        localStorage.removeItem('firebase_token');
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        showNotification("Logout failed: " + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

async function loadUserData() {
    try {
        setLoading(true);
        const categories = await api.getCategories();
        renderCategories(categories);
        saveToLocalStorage(); // Sync offline cache with fresh API data
    } catch (error) {
        logger.warn("API load failed, falling back to local storage", error);
        loadFromLocalStorage();
        showNotification('Using offline mode', 'warn');
    } finally {
        setLoading(false);
    }
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
}

function renderCategories(categories) {
    const container = document.getElementById('container');
    if (!container) return;
    
    closeAllDropdowns();
    
    // CRITICAL: Wipe the UI completely before rendering the new user's links
    container.innerHTML = ''; 
    
    if (!categories || categories.length === 0) {
        logger.info("No categories found for this user.");
        return;
    }
    
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
        await api.createCategory(trimmedName);
        if (!document.getElementById(trimmedName)) {
            createCategoryElement(trimmedName);
        }
        showNotification(`Category "${trimmedName}" created`, 'success');
        saveToLocalStorage();
    } catch (error) {
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
        <div class="category-header">
            <div class="category-title-wrapper">
                <span class="category-title">${name.toUpperCase()}</span>
            </div>
            <div class="three-dots-menu">
                <button class="dots-button" onclick="toggleDropdown(this, event)" title="Category Options">⋮</button>
                <div class="dropdown-menu">
                    <div class="dropdown-item" onclick="event.stopPropagation(); editCategory('${escapedName}')">
                        <i class="fas fa-pencil-alt"></i> Edit Category Name
                    </div>
                    <div class="dropdown-item" onclick="event.stopPropagation(); deleteCategory('${escapedName}')">
                        <i class="fas fa-trash"></i> Delete Category
                    </div>
                    <div class="dropdown-item" onclick="event.stopPropagation(); openAddLinkModal('${escapedName}')">
                        <i class="fas fa-plus"></i> Add New Link
                    </div>
                </div>
            </div>
        </div>
        <nav></nav>
    `;
    
    document.getElementById("container").appendChild(section);
    return section;
}

function toggleDropdown(button, event) {
    if (event) event.stopPropagation();
    closeAllDropdowns();
    const dropdown = button.nextElementSibling;
    dropdown.classList.add('show');
    activeDropdown = dropdown;
}

function editCategory(categoryName) {
    closeAllDropdowns();
    renameCategory(categoryName);
}

async function renameCategory(oldName) {
    const newName = prompt("Enter new category name:", oldName);
    if (!newName || newName === oldName || !newName.trim()) return;
    const trimmedNewName = newName.trim();
    
    try {
        setLoading(true);
        await api.updateCategory(oldName, trimmedNewName);
        
        const section = document.getElementById(oldName);
        if (section) {
            section.id = trimmedNewName;
            const titleSpan = section.querySelector(".category-title");
            if (titleSpan) titleSpan.textContent = trimmedNewName.toUpperCase();
            
            section.querySelectorAll('[onclick]').forEach(el => {
                const onclick = el.getAttribute('onclick');
                if (onclick) el.setAttribute('onclick', onclick.replace(new RegExp(oldName, 'g'), trimmedNewName));
            });
        }
        showNotification(`Category renamed to "${trimmedNewName}"`, 'success');
        saveToLocalStorage();
    } catch (error) {
        showNotification('Failed to rename category', 'error');
    } finally {
        setLoading(false);
    }
}

async function deleteCategory(categoryName) {
    if (!confirm(`Delete category "${categoryName}" and all its links?`)) return;
    closeAllDropdowns();
    
    try {
        setLoading(true);
        await api.deleteCategory(categoryName);
        const section = document.getElementById(categoryName);
        if (section) section.remove();
        showNotification(`Category "${categoryName}" deleted`, 'success');
        saveToLocalStorage();
    } catch (error) {
        showNotification('Failed to delete category', 'error');
    } finally {
        setLoading(false);
    }
}

function openAddLinkModal(categoryName) {
    closeAllDropdowns();
    const modal = document.getElementById('addLinkModal');
    document.getElementById('addLinkCategory').value = categoryName;
    document.getElementById('addLinkTitle').value = '';
    document.getElementById('addLinkUrl').value = '';
    modal.style.display = 'flex';
}

function closeAddLinkModal() {
    document.getElementById('addLinkModal').style.display = 'none';
}

async function saveNewLink() {
    const categoryName = document.getElementById('addLinkCategory').value;
    const title = document.getElementById('addLinkTitle').value.trim();
    let url = document.getElementById('addLinkUrl').value.trim();
    
    if (!title || !url) {
        showNotification("Please enter both title and URL", 'error');
        return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    
    try {
        setLoading(true);
        await api.addLink(categoryName, { title, url });
        addLinkToDOM(categoryName, title, url);
        closeAddLinkModal();
        showNotification("Link added", 'success');
        saveToLocalStorage();
    } catch (error) {
        showNotification('Failed to add link', 'error');
    } finally {
        setLoading(false);
    }
}

function addLinkToDOM(categoryName, title, url) {
    const nav = document.querySelector(`#${safeId(categoryName)} nav`);
    if (!nav) return;
    
    const escapedCategory = categoryName.replace(/'/g, "\\'");
    const escapedTitle = title.replace(/'/g, "\\'");
    const escapedUrl = url.replace(/'/g, "\\'");
    
    const container = document.createElement("div");
    container.className = "link-container";
    container.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
        <div class="link-actions">
            <button class="link-action-btn" onclick="editLink('${escapedCategory}', '${escapedTitle}', '${escapedUrl}')" title="Edit Link">
                <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="link-action-btn" onclick="deleteLink(this, '${escapedCategory}', '${escapedTitle}', '${escapedUrl}')" title="Delete Link">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    nav.appendChild(container);
}

function editLink(categoryName, title, url) {
    const modal = document.getElementById('editLinkModal');
    document.getElementById('editLinkCategory').value = categoryName;
    document.getElementById('editLinkOriginalTitle').value = title;
    document.getElementById('editLinkTitle').value = title;
    document.getElementById('editLinkUrl').value = url;
    modal.style.display = 'flex';
}

function closeEditLinkModal() {
    document.getElementById('editLinkModal').style.display = 'none';
}

async function saveEditedLink() {
    const categoryName = document.getElementById('editLinkCategory').value;
    const originalTitle = document.getElementById('editLinkOriginalTitle').value;
    const newTitle = document.getElementById('editLinkTitle').value.trim();
    let newUrl = document.getElementById('editLinkUrl').value.trim();
    
    if (!newTitle || !newUrl) {
        showNotification("Please enter both title and URL", 'error');
        return;
    }
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) newUrl = 'https://' + newUrl;
    
    try {
        setLoading(true);
        // Sequential API calls to mimic an update
        await api.deleteLink(categoryName, originalTitle, document.getElementById('editLinkUrl').value);
        await api.addLink(categoryName, { title: newTitle, url: newUrl });
        
        const section = document.getElementById(categoryName);
        const oldLinkContainer = Array.from(section.querySelectorAll('.link-container'))
            .find(container => container.querySelector('a').textContent === originalTitle);
        
        if (oldLinkContainer) oldLinkContainer.remove();
        
        addLinkToDOM(categoryName, newTitle, newUrl);
        closeEditLinkModal();
        showNotification("Link updated", 'success');
        saveToLocalStorage();
    } catch (error) {
        showNotification('Failed to update link', 'error');
    } finally {
        setLoading(false);
    }
}

async function deleteLink(button, categoryName, title, url) {
    if (!confirm("Delete this link?")) return;
    const container = button.closest('.link-container');
    
    try {
        setLoading(true);
        await api.deleteLink(categoryName, title, url);
        container.remove();
        showNotification("Link deleted", 'success');
        saveToLocalStorage();
    } catch (error) {
        showNotification('Failed to delete link', 'error');
    } finally {
        setLoading(false);
    }
}

function saveToLocalStorage() {
    if (!currentUser) return;
    const categories = [];
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const name = section.id;
        const links = [];
        section.querySelectorAll('.link-container a').forEach(link => {
            links.push({ title: link.textContent, url: link.href });
        });
        categories.push({ name, links });
    });
    
    localStorage.setItem(`linkvault_${currentUser.uid}`, JSON.stringify({ categories }));
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.link-container a').forEach(link => {
        const text = link.textContent.toLowerCase();
        const container = link.closest('.link-container');
        if (text.includes(query) && query !== "") {
            link.classList.add('highlight');
            container.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            container.style.borderLeft = '3px solid gold';
        } else {
            link.classList.remove('highlight');
            container.style.backgroundColor = '';
            container.style.borderLeft = '';
        }
    });
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyDarkMode();
    const toggle = document.getElementById('modeToggle');
    if (toggle) toggle.textContent = isDarkMode ? '☾ Dark Mode' : '◯ Light Mode';
}

function applyDarkMode() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
}

function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('show');
}

function showFormatModal() {
    document.getElementById('formatModal').style.display = 'flex';
}

function closeFormatModal() {
    document.getElementById('formatModal').style.display = 'none';
}

async function exportData() {
    try {
        const categories = await api.getCategories();
        const blob = new Blob([JSON.stringify({ categories }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkvault_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully', 'success');
    } catch (error) {
        showNotification('Export failed', 'error');
    }
}

function importData() {
    const file = document.getElementById('formatUpload').files[0];
    if (!file) return showNotification('Select a file', 'error');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('output').textContent = JSON.stringify(data, null, 2);
            showNotification('File loaded, click Apply', 'info');
        } catch (error) {
            showNotification('Invalid JSON', 'error');
        }
    };
    reader.readAsText(file);
}

async function applyData() {
    const output = document.getElementById('output').textContent;
    if (!output) return showNotification('No data to apply', 'error');
    
    try {
        setLoading(true);
        const userData = JSON.parse(output);
        for (const category of userData.categories) {
            await api.createCategory(category.name).catch(() => {}); 
            for (const link of category.links || []) {
                await api.addLink(category.name, link).catch(() => {});
            }
        }
        await loadUserData();
        showNotification('Data applied', 'success');
        closeFormatModal();
    } catch (error) {
        showNotification('Error applying data', 'error');
    } finally {
        setLoading(false);
    }
}
