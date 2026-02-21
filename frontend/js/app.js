// ============================================
// TRIAGE MAIN APPLICATION - FIXED VERSION
// ============================================

// Wait for everything to load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 TRIAGE App starting...');
    
    // Wait for API to be available
    await waitForAPI();
    
    // Initialize app
    await initApp();
});

// Helper to wait for API
function waitForAPI() {
    return new Promise((resolve) => {
        // If API already exists, resolve immediately
        if (window.api) {
            console.log('✅ API already available');
            return resolve();
        }
        
        // Otherwise wait for it
        console.log('⏳ Waiting for API to load...');
        const checkInterval = setInterval(() => {
            if (window.api) {
                clearInterval(checkInterval);
                console.log('✅ API now available');
                resolve();
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ API timeout - continuing anyway');
            resolve();
        }, 5000);
    });
}

// ============================================
// APP INITIALIZATION
// ============================================

async function initApp() {
    console.log('📱 Initializing app...');
    
    // Check if API is available
    if (!window.api) {
        console.error('❌ API client not available');
        showErrorMessage('App initialization failed. Please refresh.');
        return;
    }

    // Update navigation based on login state
    updateNavigation();
    
    // Load user data if logged in
    if (window.api.isLoggedIn()) {
        await loadUserData();
    }
    
    // Initialize page-specific features
    initPageFeatures();
    
    // Play welcome voice if on homepage
    if (isHomePage()) {
        setTimeout(() => {
            playWelcomeGreeting();
        }, 1500);
    }
    
    // Test API connection silently
    testAPIConnection();
    
    console.log('✅ App initialized successfully');
}

// Silent API test
async function testAPIConnection() {
    try {
        const health = await window.api.healthCheck();
        console.log('📡 API Connection OK -', health.stats);
    } catch (error) {
        console.warn('⚠️ API connection test failed:', error.message);
    }
}

// ============================================
// NAVIGATION & UI
// ============================================

function updateNavigation() {
    const navElement = document.getElementById('main-nav');
    if (!navElement) {
        // Create nav if it doesn't exist
        createNavigation();
        return;
    }
    
    updateNavContent(navElement);
}

function createNavigation() {
    const nav = document.createElement('div');
    nav.id = 'main-nav';
    nav.className = 'container mx-auto px-4 py-4 flex justify-end';
    document.body.insertBefore(nav, document.body.firstChild);
    updateNavContent(nav);
}

function updateNavContent(navElement) {
    const isLoggedIn = window.api.isLoggedIn();
    const user = JSON.parse(localStorage.getItem('triage_current_user') || '{}');
    
    if (isLoggedIn && user.name) {
        navElement.innerHTML = `
            <div class="flex items-center space-x-4">
                <span class="text-gray-600">Welcome, ${user.name}!</span>
                <button onclick="handleLogout()" class="text-red-600 hover:text-red-800">Logout</button>
            </div>
        `;
    } else {
        navElement.innerHTML = `
            <div class="flex items-center space-x-4">
                <button onclick="showLoginModal()" class="text-gray-600 hover:text-red-600">Login</button>
                <button onclick="showRegisterModal()" class="bg-red-600 text-white px-4 py-2 rounded-full text-sm hover:bg-red-700">Sign Up</button>
            </div>
        `;
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 text-white font-medium ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = type === 'success' ? '✅ ' + message : '❌ ' + message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.showSuccessMessage = (msg) => showToast(msg, 'success');
window.showErrorMessage = (msg) => showToast(msg, 'error');

// ============================================
// PAGE DETECTION
// ============================================

function isHomePage() {
    const path = window.location.pathname;
    return path.endsWith('index.html') || path === '/' || path === '';
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('profile.html')) return 'profile';
    if (path.includes('triage-results.html')) return 'results';
    if (path.includes('itinerary.html')) return 'itinerary';
    if (path.includes('achievements.html')) return 'achievements';
    if (path.includes('social-feed.html')) return 'social';
    if (path.includes('memories.html')) return 'memories';
    if (path.includes('rewards-store.html')) return 'rewards';
    return 'home';
}

// ============================================
// USER AUTHENTICATION
// ============================================

window.showLoginModal = function() {
    // Check if modal already exists
    let modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        return;
    }
    
    // Create modal
    modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Welcome Back</h2>
                <button onclick="closeModal('login-modal')" class="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <form onsubmit="handleLogin(event)">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Email</label>
                    <input type="email" id="login-email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300">
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input type="password" id="login-password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300">
                </div>
                <button type="submit" class="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition">
                    Login
                </button>
            </form>
            <p class="text-center text-sm text-gray-500 mt-4">
                Don't have an account? 
                <button onclick="switchToRegister()" class="text-red-600 hover:underline">Sign up</button>
            </p>
        </div>
    `;
    document.body.appendChild(modal);
};

window.showRegisterModal = function() {
    let modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.remove('hidden');
        return;
    }
    
    modal = document.createElement('div');
    modal.id = 'register-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Join the Adventure</h2>
                <button onclick="closeModal('register-modal')" class="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <form onsubmit="handleRegister(event)">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Name</label>
                    <input type="text" id="register-name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Email</label>
                    <input type="email" id="register-email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Country</label>
                    <input type="text" id="register-country" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300">
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input type="password" id="register-password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300">
                </div>
                <button type="submit" class="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition">
                    Create Account
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
};

window.switchToRegister = function() {
    closeModal('login-modal');
    showRegisterModal();
};

window.switchToLogin = function() {
    closeModal('register-modal');
    showLoginModal();
};

// ============================================
// AUTH HANDLERS
// ============================================

window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showErrorMessage('Please enter email and password');
        return;
    }
    
    try {
        const result = await window.api.login(email, password);
        
        if (result.success) {
            localStorage.setItem('triage_current_user', JSON.stringify(result.user));
            showSuccessMessage(`Welcome back, ${result.user.name}!`);
            closeModal('login-modal');
            updateNavigation();
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        showErrorMessage(error.message || 'Login failed');
    }
};

window.handleRegister = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const country = document.getElementById('register-country')?.value || '';
    
    if (!name || !email || !password) {
        showErrorMessage('Please fill all required fields');
        return;
    }
    
    try {
        const result = await window.api.register(email, password, name, country);
        
        if (result.success) {
            localStorage.setItem('triage_current_user', JSON.stringify(result.user));
            showSuccessMessage(`Welcome to TRIAGE, ${result.user.name}!`);
            closeModal('register-modal');
            updateNavigation();
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        showErrorMessage(error.message || 'Registration failed');
    }
};

window.handleLogout = function() {
    window.api.logout();
    localStorage.removeItem('triage_current_user');
    showSuccessMessage('Logged out successfully');
    updateNavigation();
    setTimeout(() => location.reload(), 1000);
};

// ============================================
// USER DATA
// ============================================

async function loadUserData() {
    try {
        const result = await window.api.getCurrentUser();
        if (result.user) {
            localStorage.setItem('triage_current_user', JSON.stringify(result.user));
        }
    } catch (error) {
        console.warn('Could not load user data:', error.message);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            window.api.logout();
            localStorage.removeItem('triage_current_user');
            updateNavigation();
        }
    }
}

// ============================================
// VOICE GREETINGS
// ============================================

function playWelcomeGreeting() {
    if (!window.speechSynthesis) return;
    
    const user = JSON.parse(localStorage.getItem('triage_current_user') || '{}');
    const hour = new Date().getHours();
    
    let greeting = '';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    
    if (user.name) {
        greeting += `, ${user.name}`;
    }
    
    const phrases = [
        'Welcome to TRIAGE Albania, the Land of Eagles.',
        'Discover 4000 years of history and culture.',
        'Your Albanian adventure begins here.'
    ];
    
    const fullGreeting = `${greeting}! ${phrases[Math.floor(Math.random() * phrases.length)]}`;
    
    const utterance = new SpeechSynthesisUtterance(fullGreeting);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

window.playCulturalTip = function() {
    if (!window.speechSynthesis) return;
    
    const tips = [
        'In Albania, nodding your head means "no" and shaking means "yes" - it\'s the opposite of most countries!',
        'Coffee culture is sacred here - never rush a coffee meeting with locals.',
        'When invited to someone\'s home, bring a small gift like sweets or flowers.',
        'The double-headed eagle on the flag represents the north and south of Albania.',
        'Besa is the Albanian code of honor - keeping promises is sacred.'
    ];
    
    const tip = tips[Math.floor(Math.random() * tips.length)];
    const utterance = new SpeechSynthesisUtterance(tip);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};

// ============================================
// PAGE-SPECIFIC INITIALIZATION
// ============================================

function initPageFeatures() {
    const page = getCurrentPage();
    console.log(`📄 Initializing page: ${page}`);
    
    switch(page) {
        case 'profile':
            initProfilePage();
            break;
        case 'results':
            initResultsPage();
            break;
        case 'itinerary':
            initItineraryPage();
            break;
        case 'achievements':
            initAchievementsPage();
            break;
        case 'social':
            initSocialFeed();
            break;
        case 'memories':
            initMemoriesPage();
            break;
        case 'rewards':
            initRewardsPage();
            break;
        default:
            console.log('🏠 Home page');
    }
}

function initProfilePage() {
    console.log('📋 Profile page ready');
    // Profile page specific code
}

function initResultsPage() {
    console.log('✨ Results page ready');
    loadRecommendations();
}

function initItineraryPage() {
    console.log('🗓️ Itinerary page ready');
    loadItinerary();
}

function initAchievementsPage() {
    console.log('🏆 Achievements page ready');
    loadAchievements();
}

function initSocialFeed() {
    console.log('👥 Social feed ready');
    loadFeed();
}

function initMemoriesPage() {
    console.log('📸 Memories page ready');
    loadMemories();
}

function initRewardsPage() {
    console.log('🎁 Rewards page ready');
    loadRewards();
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

function loadRecommendations() {
    const savedItems = JSON.parse(localStorage.getItem('albanianSavedItems') || '[]');
    console.log('📦 Saved items:', savedItems.length);
}

function loadItinerary() {
    const itinerary = JSON.parse(localStorage.getItem('albanianItinerary') || '[]');
    console.log('📋 Itinerary items:', itinerary.length);
}

async function loadAchievements() {
    if (!window.api.isLoggedIn()) {
        console.log('🏆 Skipping achievements - not logged in');
        return;
    }
    
    try {
        const data = await window.api.getAchievements();
        console.log('🏆 Achievements loaded:', data);
    } catch (error) {
        console.warn('Could not load achievements:', error.message);
    }
}

async function loadFeed() {
    try {
        const data = await window.api.getFeed(10);
        console.log('📰 Feed posts:', data.posts?.length || 0);
        
        if (getCurrentPage() === 'social') {
            renderFeedPosts(data.posts || []);
        }
    } catch (error) {
        console.warn('Could not load feed:', error.message);
    }
}

function renderFeedPosts(posts) {
    const container = document.getElementById('feed-container');
    if (!container) return;
    
    if (!posts.length) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No posts yet. Be the first to share!</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="bg-white rounded-xl shadow-sm p-5 mb-4">
            <div class="flex items-start">
                <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-black-500 rounded-full flex items-center justify-center text-white font-bold mr-3 text-xl">
                    ${post.userAvatar || '👤'}
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <span class="font-bold">${post.userName}</span>
                        <span class="text-xs text-gray-400">${new Date(post.timestamp).toLocaleString()}</span>
                    </div>
                    <p class="mt-2">${post.content}</p>
                    <div class="flex items-center mt-3 space-x-4">
                        <button onclick="likePost('${post.id}')" class="flex items-center text-gray-500 hover:text-red-600">
                            <span class="text-xl mr-1">❤️</span>
                            <span>${post.likes || 0}</span>
                        </button>
                        <span class="text-gray-400">📍 ${post.location || 'Albania'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

window.likePost = async function(postId) {
    if (!window.api.isLoggedIn()) {
        showErrorMessage('Please login to like posts');
        return;
    }
    
    try {
        const result = await window.api.likePost(postId);
        if (result.success) {
            showSuccessMessage('Post liked!');
            loadFeed();
        }
    } catch (error) {
        showErrorMessage('Could not like post');
    }
};

function loadMemories() {
    const memories = JSON.parse(localStorage.getItem('albanianMemories') || '[]');
    console.log('📸 Memories:', memories.length);
}

function loadRewards() {
    const redeemed = JSON.parse(localStorage.getItem('redeemedRewards') || '[]');
    console.log('🎁 Rewards redeemed:', redeemed.length);
}

// ============================================
// SHARE FUNCTIONALITY
// ============================================

window.shareContent = async function(title, text, url) {
    const shareData = {
        title: title || 'TRIAGE Albania',
        text: text || 'Check out my Albanian adventure!',
        url: url || window.location.href
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showSuccessMessage('Shared successfully!');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Share failed:', error);
            }
        }
    } else {
        navigator.clipboard.writeText(text || window.location.href);
        showSuccessMessage('Link copied to clipboard!');
    }
};

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.playWelcomeGreeting = playWelcomeGreeting;
window.playCulturalTip = playCulturalTip;
window.shareContent = shareContent;
window.testAPIConnection = testAPIConnection;