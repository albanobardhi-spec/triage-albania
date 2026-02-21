// backend/server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'triage-secret-key-2024-free-version';

// ==================== MIDDLEWARE ====================
// Only declare cors ONCE!
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://triage-albania.netlify.app',
    'https://your-frontend-url.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== IN-MEMORY DATABASE ====================
const db = {
  users: new Map(),
  sessions: new Map(),
  achievements: new Map(),
  userAchievements: new Map(),
  savedItems: new Map(),
  posts: new Map(),
  locations: new Map(),
  crowdData: new Map(),

  // Initialize with sample data
  init() {
    // Sample locations
    const locations = [
      { id: 'loc_1', name: 'Butrint National Park', category: 'history', city: 'Sarandë', emoji: '🏛️' },
      { id: 'loc_2', name: 'Berat Castle', category: 'history', city: 'Berat', emoji: '🏰' },
      { id: 'loc_3', name: 'Gjirokastër Castle', category: 'history', city: 'Gjirokastër', emoji: '🏯' },
      { id: 'loc_4', name: 'Blue Eye Spring', category: 'nature', city: 'Sarandë', emoji: '💙' },
      { id: 'loc_5', name: 'Theth National Park', category: 'nature', city: 'Theth', emoji: '⛰️' },
      { id: 'loc_6', name: 'Ksamil Islands', category: 'beach', city: 'Ksamil', emoji: '🏝️' }
    ];
    locations.forEach(loc => this.locations.set(loc.id, loc));

    // Sample posts
    const posts = [
      { id: 'post_1', userName: 'Sarah', userAvatar: '👩', content: 'Amazing day at Butrint!', location: 'Butrint', likes: 45, comments: 12 },
      { id: 'post_2', userName: 'Mike', userAvatar: '👨', content: 'Theth is breathtaking!', location: 'Theth', likes: 89, comments: 23 }
    ];
    posts.forEach(post => this.posts.set(post.id, post));
  },

  // User methods
  createUser(userData) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = { id, ...userData, createdAt: new Date().toISOString(), heritagePoints: 0, tier: 'Bronze' };
    this.users.set(id, user);
    return user;
  },

  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  getUserById(id) {
    return this.users.get(id) || null;
  },

  // Session methods
  createSession(sessionData) {
    const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = { id, ...sessionData, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() };
    this.sessions.set(id, session);
    return session;
  },

  getSession(id) {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  },

  // Post methods
  getPosts(limit = 10) {
    return Array.from(this.posts.values()).slice(0, limit);
  },

  createPost(postData) {
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const post = { id, ...postData, likes: 0, comments: 0, timestamp: Date.now() };
    this.posts.set(id, post);
    return post;
  },

  likePost(postId) {
    const post = this.posts.get(postId);
    if (post) {
      post.likes += 1;
      return true;
    }
    return false;
  },

  // Kiosk methods
  getKioskStatus(kioskId) {
    let activeSession = null;
    for (const session of this.sessions.values()) {
      if (session.kioskId === kioskId && new Date(session.expiresAt) > new Date()) {
        activeSession = session;
        break;
      }
    }
    return { kioskId, inUse: !!activeSession, sessionId: activeSession?.id || null };
  },

  resetKiosk(kioskId) {
    for (const [id, session] of this.sessions) {
      if (session.kioskId === kioskId) this.sessions.delete(id);
    }
    return true;
  }
};

// Initialize database
db.init();

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, country } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.createUser({ email, name, country: country || 'Unknown', hashedPassword });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const { hashedPassword: _, ...userData } = user;
    res.status(201).json({ success: true, token, user: userData });
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

    const user = db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const { hashedPassword: _, ...userData } = user;
    res.json({ success: true, token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { hashedPassword: _, ...userData } = user;
    res.json({ user: userData });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// ==================== SESSION ROUTES ====================
app.post('/api/session/create', (req, res) => {
  try {
    const { profileData, savedItems, kioskId = 'kiosk1' } = req.body;
    if (!profileData) return res.status(400).json({ error: 'Profile data required' });

    const session = db.createSession({ profile: profileData, savedItems: savedItems || [], kioskId });
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
    if (!session) return res.status(404).json({ error: 'Session expired or not found' });

    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, session });
    }

    res.redirect(`${process.env.FRONTEND_URL || 'https://triage-albania.netlify.app'}/mobile-load.html?session=${sessionId}`);
  } catch (error) {
    console.error('Session load error:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

app.get('/api/session/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = db.getSession(sessionId);

    if (!session) return res.json({ valid: false, error: 'Session expired or not found' });

    const timeRemaining = Math.max(0, Math.floor((new Date(session.expiresAt) - new Date()) / 1000));
    res.json({ valid: true, sessionId, timeRemaining, expiresAt: session.expiresAt });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

// ==================== FEED ROUTES ====================
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

app.post('/api/feed/like/:postId', (req, res) => {
  try {
    const { postId } = req.params;
    const liked = db.likePost(postId);
    res.json({ success: liked });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
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
    res.json({ success: true, message: 'Kiosk reset for next user' });
  } catch (error) {
    console.error('Kiosk reset error:', error);
    res.status(500).json({ error: 'Failed to reset kiosk' });
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

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
  🚀 TRIAGE Backend Server
  =========================
  ✅ Port: ${PORT}
  ✅ Environment: ${process.env.NODE_ENV || 'development'}
  ✅ Database: In-Memory (${db.users.size} users, ${db.sessions.size} sessions)
  ✅ Endpoints: /api/auth, /api/session, /api/feed, /api/kiosk
  =========================
  `);
});