// backend/database/memory-db.js
// Pure JavaScript in-memory database (no external dependencies)

class MemoryDB {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.savedItems = new Map();
    this.posts = new Map();
    this.locations = new Map();
    this.crowdData = new Map();
    
    // Initialize with sample data
    this.initializeData();
  }

  initializeData() {
    // Albanian heritage locations
    const locations = [
      {
        id: 'loc_1',
        name: 'Butrint National Park',
        category: 'history',
        city: 'Sarandë',
        region: 'Vlorë',
        description: 'UNESCO World Heritage site with ruins from Greek, Roman, Byzantine periods',
        heritageSite: true,
        unesco: true,
        estimatedMinutes: 180,
        lat: 39.746,
        lng: 20.020,
        osmId: 'Q219584'
      },
      {
        id: 'loc_2',
        name: 'Berat Castle',
        category: 'history',
        city: 'Berat',
        region: 'Berat',
        description: 'Inhabited castle with Ottoman-era houses',
        heritageSite: true,
        unesco: true,
        estimatedMinutes: 120,
        lat: 40.708,
        lng: 19.945,
        osmId: 'Q123456'
      },
      {
        id: 'loc_3',
        name: 'Gjirokastër Castle',
        category: 'history',
        city: 'Gjirokastër',
        region: 'Gjirokastër',
        description: 'Massive castle overlooking the Stone City',
        heritageSite: true,
        unesco: true,
        estimatedMinutes: 90,
        lat: 40.074,
        lng: 20.138,
        osmId: 'Q789012'
      },
      {
        id: 'loc_4',
        name: 'Blue Eye Spring',
        category: 'nature',
        city: 'Sarandë',
        region: 'Vlorë',
        description: 'Natural spring with crystal blue water',
        heritageSite: false,
        unesco: false,
        estimatedMinutes: 60,
        lat: 39.923,
        lng: 20.192,
        osmId: 'Q345678'
      },
      {
        id: 'loc_5',
        name: 'Theth National Park',
        category: 'nature',
        city: 'Theth',
        region: 'Shkodër',
        description: 'Remote mountain village in Accursed Mountains',
        heritageSite: false,
        unesco: false,
        estimatedMinutes: 240,
        lat: 42.395,
        lng: 19.774,
        osmId: 'Q901234'
      },
      {
        id: 'loc_6',
        name: 'Apollonia',
        category: 'history',
        city: 'Fier',
        region: 'Fier',
        description: 'Ancient Greek and Roman city',
        heritageSite: true,
        unesco: false,
        estimatedMinutes: 120,
        lat: 40.722,
        lng: 19.473,
        osmId: 'Q567890'
      },
      {
        id: 'loc_7',
        name: 'Ksamil Islands',
        category: 'beach',
        city: 'Ksamil',
        region: 'Vlorë',
        description: 'Stunning white sand beaches with crystal water',
        heritageSite: false,
        unesco: false,
        estimatedMinutes: 180,
        lat: 39.769,
        lng: 20.001,
        osmId: 'Q123789'
      },
      {
        id: 'loc_8',
        name: 'Rozafa Castle',
        category: 'history',
        city: 'Shkodër',
        region: 'Shkodër',
        description: 'Legendary castle with tragic story',
        heritageSite: true,
        unesco: false,
        estimatedMinutes: 90,
        lat: 42.046,
        lng: 19.493,
        osmId: 'Q456123'
      }
    ];

    locations.forEach(loc => this.locations.set(loc.id, loc));

    // Achievements
    const achievements = [
      {
        id: 'ach_1',
        name: 'Illyrian Roots',
        description: 'Visit Butrint, Apollonia, and Byllis',
        emoji: '🏛️',
        category: 'history',
        points: 150,
        secret: false,
        targetLocations: ['loc_1', 'loc_6'],
        targetCount: 2
      },
      {
        id: 'ach_2',
        name: 'Castle Conqueror',
        description: 'Visit Rozafa, Berat, and Gjirokastër castles',
        emoji: '🏰',
        category: 'history',
        points: 150,
        secret: false,
        targetLocations: ['loc_2', 'loc_3', 'loc_8'],
        targetCount: 3
      },
      {
        id: 'ach_3',
        name: 'Blue Eye Seer',
        description: 'Visit the Blue Eye spring',
        emoji: '💙',
        category: 'nature',
        points: 100,
        secret: false,
        targetLocations: ['loc_4'],
        targetCount: 1
      },
      {
        id: 'ach_4',
        name: 'Mountain Warrior',
        description: 'Complete Valbona-Theth hike',
        emoji: '⛰️',
        category: 'adventure',
        points: 250,
        secret: false,
        targetLocations: ['loc_5'],
        targetCount: 1
      },
      {
        id: 'ach_5',
        name: 'Master of Tavë Kosi',
        description: 'Try national dish in 3 cities',
        emoji: '🍖',
        category: 'food',
        points: 100,
        secret: false,
        targetCount: 3,
        type: 'food'
      },
      {
        id: 'ach_6',
        name: 'Riviera Sunset',
        description: 'Watch sunset from Dhërmi, Himarë, and Ksamil',
        emoji: '🌅',
        category: 'nature',
        points: 150,
        secret: false,
        targetLocations: ['loc_7'],
        targetCount: 1
      },
      {
        id: 'ach_7',
        name: 'Bunker Hunter',
        description: 'Visit 10 communist bunkers',
        emoji: '🚇',
        category: 'history',
        points: 125,
        secret: true,
        targetCount: 10
      },
      {
        id: 'ach_8',
        name: 'Eagle\'s Legacy',
        description: 'Complete all Albanian Heritage achievements',
        emoji: '🦅',
        category: 'legendary',
        points: 1000,
        secret: true,
        targetCount: 7
      }
    ];

    achievements.forEach(ach => this.achievements.set(ach.id, ach));

    // Sample posts for social feed
    const posts = [
      {
        id: 'post_1',
        userId: 'user_1',
        userName: 'Sarah',
        userAvatar: '👩',
        content: 'Walking through 2500 years of history at Butrint! The lion gate and baptistery mosaics are incredible. 🇦🇱',
        emoji: '🏛️',
        location: 'Butrint',
        likes: 45,
        comments: 12,
        timestamp: Date.now() - 3600000,
        tags: ['history', 'unesco']
      },
      {
        id: 'post_2',
        userId: 'user_2',
        userName: 'Mike',
        userAvatar: '👨',
        content: 'Made it to Theth! The Grunas waterfall is stunning and the hospitality at the guesthouse is unmatched.',
        emoji: '⛰️',
        location: 'Theth',
        likes: 89,
        comments: 23,
        timestamp: Date.now() - 7200000,
        tags: ['mountains', 'hiking']
      },
      {
        id: 'post_3',
        userId: 'user_3',
        userName: 'Elena',
        userAvatar: '👩‍🦱',
        content: 'The Stone City is magical! Walking up to the castle at sunset.',
        emoji: '🏰',
        location: 'Gjirokastër',
        likes: 67,
        comments: 15,
        timestamp: Date.now() - 10800000,
        tags: ['castle', 'sunset']
      },
      {
        id: 'post_4',
        userId: 'user_4',
        userName: 'Carlos',
        userAvatar: '👨',
        content: 'The Albanian Riviera does not disappoint! Crystal clear water, islands to swim to.',
        emoji: '🏝️',
        location: 'Ksamil',
        likes: 112,
        comments: 34,
        timestamp: Date.now() - 86400000,
        tags: ['beach', 'riviera']
      }
    ];

    posts.forEach(post => this.posts.set(post.id, post));
  }

  // User methods
  createUser(userData) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
      heritagePoints: 0,
      tier: 'Bronze',
      savedItems: []
    };
    this.users.set(id, user);
    return user;
  }

  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  getUserById(id) {
    return this.users.get(id) || null;
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.users.set(id, user);
    return user;
  }

  // Session methods
  createSession(sessionData) {
    const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id,
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      lastActive: new Date().toISOString()
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id) {
    const session = this.sessions.get(id);
    if (!session) return null;
    
    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(id);
      return null;
    }
    
    return session;
  }

  updateSession(id, updates) {
    const session = this.sessions.get(id);
    if (!session) return null;
    Object.assign(session, updates, { lastActive: new Date().toISOString() });
    this.sessions.set(id, session);
    return session;
  }

  deleteSession(id) {
    return this.sessions.delete(id);
  }

  // Saved items methods
  addSavedItem(userId, item) {
    if (!this.savedItems.has(userId)) {
      this.savedItems.set(userId, []);
    }
    const userItems = this.savedItems.get(userId);
    const newItem = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...item,
      savedAt: new Date().toISOString()
    };
    userItems.push(newItem);
    return newItem;
  }

  getSavedItems(userId) {
    return this.savedItems.get(userId) || [];
  }

  removeSavedItem(userId, itemId) {
    const userItems = this.savedItems.get(userId);
    if (!userItems) return false;
    const index = userItems.findIndex(i => i.id === itemId);
    if (index >= 0) {
      userItems.splice(index, 1);
      return true;
    }
    return false;
  }

  // Achievement methods
  getUserAchievements(userId) {
    if (!this.userAchievements.has(userId)) {
      // Initialize with empty progress
      const initial = {};
      for (const [id, ach] of this.achievements) {
        initial[id] = {
          achievementId: id,
          progress: 0,
          unlocked: false,
          unlockedAt: null
        };
      }
      this.userAchievements.set(userId, initial);
    }
    return this.userAchievements.get(userId);
  }

  updateAchievementProgress(userId, achievementId, progress) {
    const userAchs = this.getUserAchievements(userId);
    if (!userAchs[achievementId]) return null;
    
    userAchs[achievementId].progress = Math.min(progress, 100);
    
    // Check if unlocked
    const achievement = this.achievements.get(achievementId);
    if (!userAchs[achievementId].unlocked && userAchs[achievementId].progress >= 100) {
      userAchs[achievementId].unlocked = true;
      userAchs[achievementId].unlockedAt = new Date().toISOString();
      
      // Award points
      const user = this.users.get(userId);
      if (user) {
        user.heritagePoints += achievement.points;
        this.updateUser(userId, { heritagePoints: user.heritagePoints });
      }
    }
    
    return userAchs[achievementId];
  }

  // Post methods
  getPosts(limit = 10) {
    return Array.from(this.posts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  createPost(postData) {
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const post = {
      id,
      ...postData,
      likes: 0,
      comments: 0,
      timestamp: Date.now()
    };
    this.posts.set(id, post);
    return post;
  }

  likePost(postId, userId) {
    const post = this.posts.get(postId);
    if (!post) return false;
    post.likes += 1;
    return true;
  }

  // Location methods
  getAllLocations() {
    return Array.from(this.locations.values());
  }

  getLocation(id) {
    return this.locations.get(id);
  }

  searchLocations(query) {
    query = query.toLowerCase();
    return Array.from(this.locations.values()).filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.city.toLowerCase().includes(query) ||
      loc.region.toLowerCase().includes(query)
    );
  }

  // Crowd data methods
  getCrowdData(locationId) {
    return this.crowdData.get(locationId) || {
      currentCount: Math.floor(Math.random() * 100),
      waitTime: Math.floor(Math.random() * 30),
      capacity: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    };
  }

  updateCrowdData(locationId, data) {
    this.crowdData.set(locationId, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Kiosk methods
  getKioskStatus(kioskId) {
    // Find active session for this kiosk
    let activeSession = null;
    for (const session of this.sessions.values()) {
      if (session.kioskId === kioskId && new Date(session.expiresAt) > new Date()) {
        activeSession = session;
        break;
      }
    }
    
    return {
      kioskId,
      inUse: !!activeSession,
      sessionId: activeSession?.id || null,
      lastActive: activeSession?.lastActive || null,
      timeRemaining: activeSession 
        ? Math.floor((new Date(activeSession.expiresAt) - new Date()) / 1000)
        : null
    };
  }

  resetKiosk(kioskId) {
    // Delete all sessions for this kiosk
    for (const [id, session] of this.sessions) {
      if (session.kioskId === kioskId) {
        this.sessions.delete(id);
      }
    }
    return true;
  }
}

// Export singleton instance
const db = new MemoryDB();
export default db;