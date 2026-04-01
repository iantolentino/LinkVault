// frontend/src/js/api-client.js
class LinkVaultAPI {
    constructor() {
        // FIXED: Using consistent naming 'baseUrl' to match the request method
        this.baseUrl = 'https://link-vault.up.railway.app';
        
        this.logger = {
            info: (msg, data) => console.log(`📡 [API] ${msg}`, data || ''),
            error: (msg, err) => console.error(`❌ [API] ${msg}`, err),
            warn: (msg, data) => console.warn(`⚠️ [API] ${msg}`, data || '')
        };
    }

    /**
     * Helper to get the freshest token directly from Firebase Auth
     */
    async getValidToken() {
        try {
            // Check if Firebase Auth is available on the window object
            const auth = window.FirebaseAuth; 
            const user = auth?.currentUser;

            if (user) {
                // Force refresh token to prevent 401 expiration issues
                const token = await user.getIdToken(true);
                localStorage.setItem('firebase_token', token);
                return token;
            }
        } catch (err) {
            this.logger.error("Failed to refresh Firebase token", err);
        }
        
        // Fallback to localStorage if Firebase object isn't ready yet
        return localStorage.getItem('firebase_token');
    }

    async request(endpoint, options = {}) {
        const token = await this.getValidToken();
        
        // Build the URL: Ensure no double slashes and no 'undefined'
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseUrl}${cleanEndpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        this.logger.info(`Making request to: ${url}`);

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (response.status === 401) {
                throw new Error("Invalid authentication token (401)");
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // --- API Methods ---

    async getCategories() {
        return this.request('/api/categories/');
    }

    async createCategory(name) {
        return this.request('/api/categories/', {
            method: 'POST',
            body: JSON.stringify({ 
                name: name,
                links: [] 
                // user_id is handled by the backend from the token
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
        // Ensure your backend delete route matches this structure
        return this.request(`/api/categories/${encodeURIComponent(categoryName)}/links/${encodeURIComponent(linkTitle)}`, {
            method: 'DELETE'
        });
    }
}

export const api = new LinkVaultAPI();