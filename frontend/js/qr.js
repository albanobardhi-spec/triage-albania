// frontend/js/qr.js
// Client-side QR code generation

class QRGenerator {
  constructor() {
    // Load QRCode library if not present
    this.loadLibrary();
  }

  loadLibrary() {
    if (typeof QRCode === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      document.head.appendChild(script);
    }
  }

  // Generate QR code as canvas
  generateToCanvas(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof QRCode === 'undefined') {
        setTimeout(() => this.generateToCanvas(text, options).then(resolve).catch(reject), 500);
        return;
      }

      const canvas = document.createElement('canvas');
      
      QRCode.toCanvas(canvas, text, {
        width: options.width || 250,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#e11d48',
          light: options.lightColor || '#ffffff'
        }
      }, (error) => {
        if (error) reject(error);
        else resolve(canvas);
      });
    });
  }

  // Generate QR code as data URL
  async generateToDataURL(text, options = {}) {
    if (typeof QRCode === 'undefined') {
      await this.loadLibrary();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return new Promise((resolve, reject) => {
      QRCode.toDataURL(text, {
        width: options.width || 250,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#e11d48',
          light: options.lightColor || '#ffffff'
        }
      }, (error, url) => {
        if (error) reject(error);
        else resolve(url);
      });
    });
  }

  // Generate QR code for session transfer
  async generateSessionQR(sessionId, sessionUrl) {
    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer) return null;

    qrContainer.innerHTML = '';
    
    try {
      const canvas = await this.generateToCanvas(sessionUrl, {
        width: 250,
        darkColor: '#e11d48'
      });
      
      qrContainer.appendChild(canvas);
      
      // Show short code
      const shortCode = sessionId.substring(0, 8).toUpperCase();
      const codeEl = document.getElementById('short-code');
      if (codeEl) codeEl.textContent = shortCode;
      
      return canvas;
    } catch (error) {
      console.error('QR generation failed:', error);
      qrContainer.innerHTML = '<p class="text-red-500">Failed to generate QR code</p>';
      return null;
    }
  }

  // Create session from profile (client-side fallback)
  createClientSession(profileData) {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const sessionData = {
      id: sessionId,
      profile: profileData,
      savedItems: JSON.parse(localStorage.getItem('albanianSavedItems') || '[]'),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };
    
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
    
    return sessionId;
  }
}

// Export singleton
const qr = new QRGenerator();
export default qr;