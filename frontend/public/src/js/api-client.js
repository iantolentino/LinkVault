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
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getHeaders();
        
        this.logger.info(`Making request to: ${url}`);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...headers, ...options.headers },
                mode: 'cors'
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.logger.info(`Response from ${endpoint}:`, data);
            return data;
        } catch (error) {
            this.logger.error(`Request failed: ${endpoint}`, error);
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