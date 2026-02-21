// frontend/js/config.js
const CONFIG = {
  // Use this for production (LIVE)
  API_URL: 'https://triage-albania.onrender.com/api',
  
  // Keep this for local development
  DEV_API_URL: 'http://localhost:3000/api',
  
  // Auto-detect environment - THIS IS THE KEY!
  getBaseUrl: function() {
    // Check if we're on localhost
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      console.log('🔧 Using local API:', this.DEV_API_URL);
      return this.DEV_API_URL;
    }
    // Live site - use Render
    console.log('🌐 Using live API:', this.API_URL);
    return this.API_URL;
  },
  
  APP_NAME: 'TRIAGE Albania',
  DEFAULT_LANGUAGE: 'en',
  SESSION_TIMEOUT: 3600
};