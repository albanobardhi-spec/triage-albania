// backend/server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import db from './database/memory-db.js';



// backend/server.js
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://triage-albania.netlify.app', // You'll replace this after frontend deploy
  'https://triage-albania.netlify.app'  // Your actual frontend URL
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'triage-secret-key-2024-free-version';

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ==================== AUTH MIDDLEWARE ====================
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, country } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = db.createUser({
      email,
      name,
      country: country || 'Unknown',
      hashedPassword
    });
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user without password
    const { hashedPassword: _, ...userData } = user;
    
    res.status(201).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Get user
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last login
    db.updateUser(user.id, { lastLogin: new Date().toISOString() });
    
    // Return user without password
    const { hashedPassword: _, ...userData } = user;
    
    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.getUserById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { hashedPassword: _, ...userData } = user;
  res.json({ user: userData });
});

// ==================== SESSION ROUTES ====================
app.post('/api/session/create', (req, res) => {
  try {
    const { profileData, savedItems, kioskId = 'kiosk1' } = req.body;
    
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data required' });
    }
    
    // Create session
    const session = db.createSession({
      profile: profileData,
      savedItems: savedItems || [],
      kioskId
    });
    
    // Generate session URL
    const sessionUrl = `${req.protocol}://${req.get('host')}/api/session/load/${session.id}`;
    
    res.json({
      success: true,
      sessionId: session.id,
      shortCode: session.id.substring(0, 8).toUpperCase(),
      sessionUrl,
      expiresAt: session.expiresAt,
      session
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/session/load/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = db.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session expired or not found' });
    }
    
    // Update last active
    db.updateSession(sessionId, {});
    
    // If JSON request, return JSON
    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        session
      });
    }
    
    // Redirect to mobile app
    res.redirect(`http://localhost:5500/mobile-load.html?session=${sessionId}`);
  } catch (error) {
    console.error('Session load error:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

app.get('/api/session/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = db.getSession(sessionId);
    
    if (!session) {
      return res.json({
        valid: false,
        error: 'Session expired or not found'
      });
    }
    
    const expiresAt = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    
    res.json({
      valid: true,
      sessionId: session.id,
      timeRemaining,
      expiresAt: session.expiresAt,
      profile: session.profile,
      hasSavedItems: session.savedItems.length > 0
    });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

app.put('/api/session/update/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { profileData, savedItems } = req.body;
    
    const session = db.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update fields
    if (profileData) session.profile = { ...session.profile, ...profileData };
    if (savedItems) session.savedItems = savedItems;
    
    db.updateSession(sessionId, session);
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// ==================== KIOSK ROUTES ====================
app.get('/api/kiosk/status/:kioskId', (req, res) => {
  try {
    const { kioskId } = req.params;
    
    const status = db.getKioskStatus(kioskId);
    
    res.json(status);
  } catch (error) {
    console.error('Kiosk status error:', error);
    res.status(500).json({ error: 'Failed to get kiosk status' });
  }
});

app.post('/api/kiosk/reset/:kioskId', (req, res) => {
  try {
    const { kioskId } = req.params;
    
    db.resetKiosk(kioskId);
    
    res.json({
      success: true,
      message: 'Kiosk reset for next user'
    });
  } catch (error) {
    console.error('Kiosk reset error:', error);
    res.status(500).json({ error: 'Failed to reset kiosk' });
  }
});

// ==================== PLACES ROUTES (OpenStreetMap) ====================
app.get('/api/places/search', async (req, res) => {
  try {
    const { q, lat, lng, radius = 10000 } = req.query;
    
    if (!q && (!lat || !lng)) {
      return res.status(400).json({ error: 'Query or coordinates required' });
    }
    
    let url = 'https://nominatim.openstreetmap.org/search';
    let params = {
      format: 'json',
      limit: 10,
      addressdetails: 1,
      'accept-language': 'en'
    };
    
    if (q) {
      params.q = `${q} Albania`;
    } else if (lat && lng) {
      params.lat = lat;
      params.lon = lng;
      params.radius = radius;
    }
    
    const response = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'TRIAGE-Albania/1.0'
      }
    });
    
    const places = response.data.map(place => ({
      id: place.place_id,
      name: place.display_name.split(',')[0],
      fullName: place.display_name,
      lat: place.lat,
      lng: place.lon,
      category: place.type,
      importance: place.importance,
      osmType: place.osm_type,
      osmId: place.osm_id
    }));
    
    // Also get from local DB
    const localPlaces = db.searchLocations(q || '');
    
    res.json({
      osm: places,
      local: localPlaces
    });
  } catch (error) {
    console.error('Places search error:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

app.get('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check local DB first
    const localPlace = db.getLocation(id);
    if (localPlace) {
      return res.json({
        source: 'local',
        ...localPlace
      });
    }
    
    // If not in local, try OSM
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/details`,
      {
        params: {
          osmtype: 'R', // Relation
          osmid: id,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'TRIAGE-Albania/1.0'
        }
      }
    );
    
    res.json({
      source: 'osm',
      ...response.data
    });
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});

// ==================== SAVED ITEMS ROUTES ====================
app.get('/api/saved', authenticate, (req, res) => {
  try {
    const items = db.getSavedItems(req.userId);
    res.json({ items });
  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ error: 'Failed to get saved items' });
  }
});

app.post('/api/saved', authenticate, (req, res) => {
  try {
    const { locationId, notes } = req.body;
    
    const location = db.getLocation(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const savedItem = db.addSavedItem(req.userId, {
      locationId,
      location,
      notes
    });
    
    res.status(201).json({ item: savedItem });
  } catch (error) {
    console.error('Save item error:', error);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

app.delete('/api/saved/:itemId', authenticate, (req, res) => {
  try {
    const { itemId } = req.params;
    
    const removed = db.removeSavedItem(req.userId, itemId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete saved item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ==================== ACHIEVEMENTS ROUTES ====================
app.get('/api/achievements', authenticate, (req, res) => {
  try {
    const userAchievements = db.getUserAchievements(req.userId);
    const allAchievements = Array.from(db.achievements.values());
    
    const achievementsWithProgress = allAchievements.map(ach => ({
      ...ach,
      progress: userAchievements[ach.id]?.progress || 0,
      unlocked: userAchievements[ach.id]?.unlocked || false,
      unlockedAt: userAchievements[ach.id]?.unlockedAt || null
    }));
    
    res.json({ achievements: achievementsWithProgress });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

app.post('/api/achievements/update', authenticate, (req, res) => {
  try {
    const { achievementId, progress } = req.body;
    
    const achievement = db.achievements.get(achievementId);
    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    const updated = db.updateAchievementProgress(req.userId, achievementId, progress);
    
    res.json({
      success: true,
      achievement: updated
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// ==================== SOCIAL FEED ROUTES ====================
app.get('/api/feed', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = db.getPosts(parseInt(limit));
    res.json({ posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

app.post('/api/feed/post', authenticate, (req, res) => {
  try {
    const { content, emoji, location, tags } = req.body;
    
    const user = db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const post = db.createPost({
      userId: req.userId,
      userName: user.name,
      userAvatar: user.avatar || '👤',
      content,
      emoji,
      location,
      tags: tags || []
    });
    
    res.status(201).json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.post('/api/feed/like/:postId', authenticate, (req, res) => {
  try {
    const { postId } = req.params;
    
    const liked = db.likePost(postId, req.userId);
    
    res.json({ success: liked });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// ==================== CROWD DATA ROUTES ====================
app.get('/api/crowd/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    
    const crowdData = db.getCrowdData(locationId);
    
    res.json(crowdData);
  } catch (error) {
    console.error('Get crowd data error:', error);
    res.status(500).json({ error: 'Failed to get crowd data' });
  }
});

app.post('/api/crowd/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const { currentCount, waitTime } = req.body;
    
    db.updateCrowdData(locationId, { currentCount, waitTime });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update crowd data error:', error);
    res.status(500).json({ error: 'Failed to update crowd data' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: {
      users: db.users.size,
      sessions: db.sessions.size,
      posts: db.posts.size,
      locations: db.locations.size
    }
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
  🚀 TRIAGE Backend Server
  =========================
  ✅ Port: ${PORT}
  ✅ Database: In-Memory (${db.users.size} users)
  ✅ Endpoints: /api/auth, /api/session, /api/places, /api/feed
  =========================
  `);
});