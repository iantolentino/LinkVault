// frontend/src/js/api-client.js
class LinkVaultAPI {
    constructor() {
        // Use your live Render backend URL
        this.baseURL = 'https://link-vault.up.railway.app';
        // this.baseURL = 'http://localhost:8000';  
        
        this.logger = {
            info: (msg, data) => console.log(`📡 [API] ${msg}`, data || ''),
            error: (msg, err) => console.error(`❌ [API] ${msg}`, err),
            warn: (msg, data) => console.warn(`⚠️ [API] ${msg}`, data || '')
        };
    }

    async getHeaders() {
        // Get Firebase token from localStorage (set by firebase-config.js)
        const token = localStorage.getItem('firebase_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        // 1. Try to get the latest token directly from Firebase instead of just localStorage
        const user = window.FirebaseAuth?.currentUser;
        let token = localStorage.getItem('firebase_token');
        
        if (user) {
            token = await user.getIdToken(true); // Force refresh to be sure
            localStorage.setItem('firebase_token', token);
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Ensure this is exactly "Bearer <token>"
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (response.status === 401) {
                throw new Error("Invalid authentication token");
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ [API] Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async getCategories() {
        return this.request('/api/categories/');
    }

    async createCategory(name) {
        return this.request('/api/categories/', {
            method: 'POST',
            body: JSON.stringify({ 
                name: name, 
                links: [],
                user_id: 'test_user_123' // This will be overridden by token
            })
        });
    }

    async updateCategory(oldName, newName) {
        return this.request(`/api/categories/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                name: newName,
                links: []
            })
        });
    }

    async deleteCategory(name) {
        return this.request(`/api/categories/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
    }

    async addLink(categoryName, link) {
        return this.request(`/api/categories/${encodeURIComponent(categoryName)}/links`, {
            method: 'POST',
            body: JSON.stringify(link)
        });
    }

    async deleteLink(categoryName, linkTitle, linkUrl) {
        return this.request(`/api/categories/${encodeURIComponent(categoryName)}/links/${encodeURIComponent(linkTitle)}`, {
            method: 'DELETE'
        });
    }
}

export const api = new LinkVaultAPI();