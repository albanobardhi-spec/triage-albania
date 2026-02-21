// ============================================
// TRIAGE API CLIENT - SIMPLIFIED WORKING VERSION
// ============================================

// Hardcoded base URL (no dependencies)
const API_BASE = 'https://triage-albania.onrender.com';

// Create API object immediately
window.api = {
    // Store token
    token: localStorage.getItem('triage_token'),
    
    // Base URL
    baseUrl: API_BASE,
    
    // Check if logged in
    isLoggedIn: function() {
        return !!this.token;
    },
    
    // Core request method
    request: async function(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        console.log('📡 Fetching:', url);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
                mode: 'cors'
            });
            
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                data = { message: text };
            }
            
            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    },
    
    // ======== AUTH ENDPOINTS ========
    healthCheck: async function() {
        return this.request('/api/health');
    },
    
    login: async function(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('triage_token', data.token);
        }
        return data;
    },
    
    register: async function(email, password, name, country) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, country })
        });
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('triage_token', data.token);
        }
        return data;
    },
    
    getCurrentUser: async function() {
        return this.request('/api/auth/me');
    },
    
    logout: function() {
        this.token = null;
        localStorage.removeItem('triage_token');
        return { success: true };
    },
    
    // ======== SESSION ENDPOINTS ========
    createSession: async function(profileData, savedItems = [], kioskId = 'kiosk1') {
        return this.request('/api/session/create', {
            method: 'POST',
            body: JSON.stringify({ profileData, savedItems, kioskId })
        });
    },
    
    getSessionStatus: async function(sessionId) {
        return this.request(`/api/session/status/${sessionId}`);
    },
    
    // ======== FEED ENDPOINTS ========
    getFeed: async function(limit = 10) {
        return this.request(`/api/feed?limit=${limit}`);
    },
    
    likePost: async function(postId) {
        return this.request(`/api/feed/like/${postId}`, {
            method: 'POST'
        });
    },
    
    // ======== KIOSK ENDPOINTS ========
    getKioskStatus: async function(kioskId = 'kiosk1') {
        return this.request(`/api/kiosk/status/${kioskId}`);
    },
    
    resetKiosk: async function(kioskId = 'kiosk1') {
        return this.request(`/api/kiosk/reset/${kioskId}`, {
            method: 'POST'
        });
    }
};

// Test connection immediately
setTimeout(() => {
    window.api.healthCheck()
        .then(data => console.log('✅ API Connected:', data))
        .catch(err => console.warn('⚠️ API Health Check Failed:', err.message));
}, 100);

console.log('✅ API Client Loaded:', window.api ? 'Success' : 'Failed');
console.log('📡 API URL:', API_BASE);