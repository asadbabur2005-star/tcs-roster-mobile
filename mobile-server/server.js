const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? undefined : 5001);
const JWT_SECRET = process.env.JWT_SECRET || 'mobile-roster-secret-key-2024';

// Database setup
// In production (Render), use /opt/render/project/src/data directory for persistence
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'data', 'roster.db')
  : path.join(__dirname, 'roster.db');

// Ensure data directory exists in production
if (process.env.NODE_ENV === 'production') {
  const dataDir = path.dirname(dbPath);
  if (!require('fs').existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'carer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Rosters table
  db.run(`CREATE TABLE IF NOT EXISTS rosters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    active_days TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['admin', hashedPassword, 'admin']);

  console.log('✅ Database initialized');
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.0.106:3001',
    'https://tcs-roster-mobile.netlify.app',
    'https://your-netlify-app.netlify.app', // Replace with actual Netlify URL
    'capacitor://localhost',
    'ionic://localhost'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(cookieParser());

// Rate limiting for production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per 15 minutes in production
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TCS Roster Mobile API'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Admin login requires password
      if (user.role === 'admin') {
        if (!password) {
          return res.status(400).json({ error: 'Password is required for admin' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Carer role selection (no password required)
app.post('/api/auth/carer-login', (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Carer name is required' });
  }

  const username = name.trim().toLowerCase().replace(/\s+/g, '_');

  // Insert or get carer user
  db.run(`INSERT OR IGNORE INTO users (username, role) VALUES (?, ?)`,
    [username, 'carer'], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          domain: process.env.NODE_ENV === 'production' ? undefined : undefined
        });

        res.json({
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: name.trim()
          }
        });
      });
    });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Roster routes
app.get('/api/roster/current', authenticateToken, (req, res) => {
  db.get(`SELECT * FROM rosters ORDER BY updated_at DESC LIMIT 1`, (err, roster) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!roster) {
      return res.json({ roster: null });
    }

    const rosterData = {
      id: roster.id,
      name: roster.name,
      data: JSON.parse(roster.data),
      activeDays: JSON.parse(roster.active_days),
      createdAt: roster.created_at,
      updatedAt: roster.updated_at
    };

    res.json({ roster: rosterData });
  });
});

app.get('/api/roster/:id', authenticateToken, (req, res) => {
  const rosterId = req.params.id;

  db.get(`SELECT * FROM rosters WHERE id = ?`, [rosterId], (err, roster) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    const rosterData = {
      id: roster.id,
      name: roster.name,
      data: JSON.parse(roster.data),
      activeDays: JSON.parse(roster.active_days),
      createdAt: roster.created_at,
      updatedAt: roster.updated_at
    };

    res.json({ roster: rosterData });
  });
});

app.post('/api/roster', authenticateToken, requireAdmin, (req, res) => {
  const { name, data, activeDays } = req.body;

  if (!name || !data || !activeDays) {
    return res.status(400).json({ error: 'Name, data, and activeDays are required' });
  }

  db.run(`INSERT INTO rosters (name, data, active_days, created_by) VALUES (?, ?, ?, ?)`,
    [name, JSON.stringify(data), JSON.stringify(activeDays), req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        message: 'Roster created successfully',
        rosterId: this.lastID
      });
    });
});

app.put('/api/roster/:id', authenticateToken, requireAdmin, (req, res) => {
  const rosterId = req.params.id;
  const { name, data, activeDays } = req.body;

  if (!name || !data || !activeDays) {
    return res.status(400).json({ error: 'Name, data, and activeDays are required' });
  }

  db.run(`UPDATE rosters SET name = ?, data = ?, active_days = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, JSON.stringify(data), JSON.stringify(activeDays), rosterId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Roster not found' });
      }

      res.json({ message: 'Roster updated successfully' });
    });
});

app.get('/api/rosters', authenticateToken, requireAdmin, (req, res) => {
  db.all(`SELECT id, name, created_at, updated_at FROM rosters ORDER BY updated_at DESC`, (err, rosters) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ rosters });
  });
});

// Change Password endpoint
app.post('/api/auth/change-password', authenticateToken, requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Get current user data
  db.get(`SELECT password FROM users WHERE id = ?`, [userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedNewPassword, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      res.json({ message: 'Password changed successfully' });
    });
  });
});

// Server-Sent Events for real-time updates
app.get('/api/roster/updates', authenticateToken, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 TCS Roster Mobile Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Admin credentials: admin / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log(`👥 Carers can access via name selection (no password)`);
  console.log(`💾 Using SQLite database: ${dbPath}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});