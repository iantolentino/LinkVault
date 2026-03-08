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
    
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            logger.info("No user, redirecting to login");
            window.location.href = "index.html";
        } else {
            currentUser = user;
            logger.success("User authenticated", { email: user.email });
            
            const userStorageKey = `linkvault_${user.uid}`;
            if (!localStorage.getItem(userStorageKey)) {
                localStorage.setItem(userStorageKey, JSON.stringify({ categories: [] }));
            }
            
            await loadUserData();
        }
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

async function handleLogout() {
    try {
        setLoading(true);
        await signOut(auth);
        localStorage.removeItem('firebase_token');
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
    } catch (error) {
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
        await api.createCategory(trimmedName);
        
        if (!document.getElementById(trimmedName)) {
            createCategoryElement(trimmedName);
        }
        
        showNotification(`Category "${trimmedName}" created`, 'success');
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
            if (titleSpan) {
                titleSpan.textContent = trimmedNewName.toUpperCase();
            }
            
            // Update onclick attributes
            section.querySelectorAll('[onclick]').forEach(el => {
                const onclick = el.getAttribute('onclick');
                if (onclick) {
                    el.setAttribute('onclick', onclick.replace(oldName, trimmedNewName));
                }
            });
        }
        
        showNotification(`Category renamed to "${trimmedNewName}"`, 'success');
    } catch (error) {
        showNotification('Category renamed locally only', 'warn');
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
    } catch (error) {
        const section = document.getElementById(categoryName);
        if (section) section.remove();
        saveToLocalStorage();
        showNotification('Category removed locally only', 'warn');
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
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        setLoading(true);
        await api.addLink(categoryName, { title, url });
        
        addLinkToDOM(categoryName, title, url);
        closeAddLinkModal();
        showNotification("Link added", 'success');
    } catch (error) {
        addLinkToDOM(categoryName, title, url);
        saveToLocalStorage();
        closeAddLinkModal();
        showNotification('Link saved locally only', 'warn');
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
    
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        newUrl = 'https://' + newUrl;
    }
    
    try {
        setLoading(true);
        
        await api.deleteLink(categoryName, originalTitle, document.getElementById('editLinkUrl').value);
        await api.addLink(categoryName, { title: newTitle, url: newUrl });
        
        // Update UI
        const section = document.getElementById(categoryName);
        const oldLink = Array.from(section.querySelectorAll('.link-container a'))
            .find(link => link.textContent === originalTitle);
        
        if (oldLink) {
            const container = oldLink.closest('.link-container');
            container.remove();
        }
        
        addLinkToDOM(categoryName, newTitle, newUrl);
        closeEditLinkModal();
        showNotification("Link updated", 'success');
    } catch (error) {
        showNotification('Failed to update link', 'error');
    } finally {
        setLoading(false);
    }
}

function deleteLink(button, categoryName, title, url) {
    if (!confirm("Delete this link?")) return;
    
    const container = button.closest('.link-container');
    
    try {
        api.deleteLink(categoryName, title, url);
        container.remove();
        showNotification("Link deleted", 'success');
    } catch (error) {
        container.remove();
        saveToLocalStorage();
        showNotification('Link removed locally only', 'warn');
    }
}

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
        
        for (const category of userData.categories) {
            try {
                await api.createCategory(category.name);
                
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
        
        await loadUserData();
        showNotification('Data applied successfully', 'success');
        closeFormatModal();
    } catch (error) {
        showNotification('Error applying data', 'error');
    } finally {
        setLoading(false);
    }
}