// frontend/js/app.js
// Main application controller

import api from './api-client.js';
import voice from './voice.js';
import qr from './qr.js';

class TriageApp {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.isKiosk = window.location.pathname.includes('kiosk') || 
                    new URLSearchParams(window.location.search).has('kiosk');
    this.kioskId = 'kiosk1';
    this.init();
  }

  async init() {
    console.log('🚀 TRIAGE App initializing...');
    
    // Check for existing session
    const sessionId = localStorage.getItem('current_session');
    if (sessionId) {
      try {
        const status = await api.getSessionStatus(sessionId);
        if (status.valid) {
          this.currentSession = status;
        } else {
          localStorage.removeItem('current_session');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    }
    
    // Check for logged in user
    if (api.token) {
      try {
        const { user } = await api.getCurrentUser();
        this.currentUser = user;
        console.log('✅ Logged in as:', user.name);
      } catch (error) {
        console.error('Failed to load user:', error);
        api.clearToken();
      }
    }
    
    // Initialize kiosk mode
    if (this.isKiosk) {
      this.initKiosk();
    }
    
    // Play welcome if on landing page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      setTimeout(() => {
        voice.welcome(this.currentUser?.name);
      }, 1000);
    }
  }

  async initKiosk() {
    console.log('🖥️ Kiosk mode active');
    
    try {
      const status = await api.getKioskStatus(this.kioskId);
      
      if (status.inUse) {
        this.showSessionExistsDialog(status);
      } else {
        this.showWelcomeScreen();
      }
    } catch (error) {
      console.error('Failed to get kiosk status:', error);
      this.showWelcomeScreen();
    }
  }

  showWelcomeScreen() {
    voice.welcome();
    document.getElementById('welcome-screen')?.classList.remove('hidden');
  }

  showSessionExistsDialog(status) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    dialog.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-md mx-4">
        <span class="text-5xl block mb-4">🤔</span>
        <h2 class="text-2xl font-bold mb-2">Session in Progress</h2>
        <p class="text-gray-500 mb-4">Someone was using this kiosk recently.</p>
        <p class="text-sm text-gray-400 mb-6">Time remaining: ${status.timeRemaining} seconds</p>
        <div class="flex gap-3">
          <button onclick="app.continueSession('${status.sessionId}')" class="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">
            Continue
          </button>
          <button onclick="app.resetKiosk()" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">
            Start Fresh
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  async continueSession(sessionId) {
    try {
      const session = await api.getSessionStatus(sessionId);
      if (session.valid) {
        localStorage.setItem('current_session', sessionId);
        window.location.href = '/triage-results.html';
      }
    } catch (error) {
      console.error('Failed to continue session:', error);
    }
  }

  async resetKiosk() {
    try {
      await api.resetKiosk(this.kioskId);
      document.querySelector('.fixed.inset-0')?.remove();
      this.showWelcomeScreen();
    } catch (error) {
      console.error('Failed to reset kiosk:', error);
    }
  }

  async createSessionFromProfile(profileData) {
    try {
      const savedItems = JSON.parse(localStorage.getItem('albanianSavedItems') || '[]');
      
      // Try API first
      const result = await api.createSession(profileData, savedItems, this.kioskId);
      
      localStorage.setItem('current_session', result.sessionId);
      this.currentSession = result.session;
      
      // Generate QR code
      const sessionUrl = `${window.location.origin}/mobile-load.html?session=${result.sessionId}`;
      await qr.generateSessionQR(result.sessionId, sessionUrl);
      
      return result;
    } catch (error) {
      console.error('Failed to create session via API, using client-side fallback:', error);
      
      // Client-side fallback
      const sessionId = qr.createClientSession(profileData);
      localStorage.setItem('current_session', sessionId);
      
      const sessionUrl = `${window.location.origin}/mobile-load.html?session=${sessionId}`;
      await qr.generateSessionQR(sessionId, sessionUrl);
      
      return { sessionId, fallback: true };
    }
  }

  async saveItem(locationId, notes = '') {
    if (!this.currentUser) {
      // Guest mode - save to localStorage
      let savedItems = JSON.parse(localStorage.getItem('albanianSavedItems') || '[]');
      savedItems.push({ locationId, notes, savedAt: new Date().toISOString() });
      localStorage.setItem('albanianSavedItems', JSON.stringify(savedItems));
      return { success: true, guest: true };
    }
    
    return api.saveItem(locationId, notes);
  }

  async getSavedItems() {
    if (!this.currentUser) {
      return JSON.parse(localStorage.getItem('albanianSavedItems') || '[]');
    }
    
    const { items } = await api.getSavedItems();
    return items;
  }

  async loadSessionFromQR(sessionId) {
    try {
      const status = await api.getSessionStatus(sessionId);
      
      if (!status.valid) {
        throw new Error('Session expired');
      }
      
      localStorage.setItem('current_session', sessionId);
      
      // Reset kiosk
      await api.resetKiosk(this.kioskId);
      
      return status;
    } catch (error) {
      console.error('Failed to load session:', error);
      throw error;
    }
  }

  async shareAlbania(text) {
    const shareText = text || '🇦🇱 I\'m exploring Albania\'s 4000-year heritage with TRIAGE!';
    
    if (navigator.share) {
      await navigator.share({
        title: 'My Albanian Adventure',
        text: shareText,
        url: window.location.origin
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('📋 Copied to clipboard!');
    }
  }

  async playCulturalTip() {
    return voice.culturalTip();
  }
}

// Initialize app
window.app = new TriageApp();