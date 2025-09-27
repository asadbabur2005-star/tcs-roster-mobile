const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? undefined : 5001);
const JWT_SECRET = process.env.JWT_SECRET || 'mobile-roster-secret-key-2024';

// PostgreSQL Database setup
console.log(`🔍 Environment: ${process.env.NODE_ENV}`);

// PostgreSQL connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log(`🐘 Connecting to PostgreSQL...`);
const db = new Pool(dbConfig);

// Test database connection
db.connect((err, client, release) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
  } else {
    console.log('✅ PostgreSQL connection established');
    release();
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing PostgreSQL database tables...');

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'carer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rosters table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rosters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        data TEXT NOT NULL,
        active_days TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    console.log('👤 Creating/verifying admin user...');

    const adminResult = await db.query(
      `INSERT INTO users (username, password, role) VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING RETURNING id`,
      ['admin', hashedPassword, 'admin']
    );

    if (adminResult.rows.length > 0) {
      console.log('✅ Admin user created');
    } else {
      console.log('👤 Admin user already exists');
    }

    // Log existing rosters on startup for debugging
    const rosterResult = await db.query(`SELECT id, name, created_at, updated_at FROM rosters ORDER BY updated_at DESC`);
    console.log(`📊 Found ${rosterResult.rows.length} existing rosters in database:`);
    rosterResult.rows.forEach(roster => {
      console.log(`  - ID: ${roster.id}, Name: ${roster.name}, Updated: ${roster.updated_at}`);
    });

    console.log('✅ PostgreSQL database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Initialize database
initializeDatabase();

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
    'https://tcs-roster-mobile1.netlify.app',
    'https://tcs-roster-mobile.netlify.app',
    'https://tcs-roster-mobile-q0kpv8uoy-asads-projects-eb6117b2.vercel.app',
    'https://tcs-roster-mobile-d6valrbyz-asads-projects-eb6117b2.vercel.app',
    'https://tcs-roster-mobile.vercel.app',
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

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'TCS Roster Mobile API',
    status: 'running',
    version: '1.0.0',
    database: 'PostgreSQL',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      roster: '/api/roster/*'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TCS Roster Mobile API'
  });
});

// Debug endpoint to check database status
app.get('/debug/database', async (req, res) => {
  try {
    const debugInfo = {
      environment: process.env.NODE_ENV,
      databaseType: 'PostgreSQL',
      timestamp: new Date().toISOString()
    };

    // Test database connection
    const client = await db.connect();
    debugInfo.connectionStatus = 'Connected';
    client.release();

    // Check users and rosters count
    const userResult = await db.query('SELECT COUNT(*) as count FROM users');
    debugInfo.userCount = parseInt(userResult.rows[0].count);

    const rosterResult = await db.query('SELECT COUNT(*) as count FROM rosters');
    debugInfo.rosterCount = parseInt(rosterResult.rows[0].count);

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      environment: process.env.NODE_ENV,
      databaseType: 'PostgreSQL',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Carer role selection (no password required)
app.post('/api/auth/carer-login', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Carer name is required' });
    }

    const username = name.trim().toLowerCase().replace(/\s+/g, '_');

    // Insert or get carer user
    const insertResult = await db.query(
      `INSERT INTO users (username, role) VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING RETURNING *`,
      [username, 'carer']
    );

    let user;
    if (insertResult.rows.length > 0) {
      user = insertResult.rows[0];
    } else {
      const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      user = userResult.rows[0];
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
  } catch (error) {
    console.error('Carer login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Roster routes
app.get('/api/roster/current', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 User ${req.user.username} requesting current roster`);

    const result = await db.query(
      `SELECT * FROM rosters ORDER BY updated_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('📭 No roster found in database');
      return res.json({ roster: null });
    }

    const roster = result.rows[0];
    console.log(`✅ Found roster: ID ${roster.id}, Name: ${roster.name}, Updated: ${roster.updated_at}`);

    const rosterData = {
      id: roster.id,
      name: roster.name,
      data: JSON.parse(roster.data),
      activeDays: JSON.parse(roster.active_days),
      createdAt: roster.created_at,
      updatedAt: roster.updated_at
    };

    res.json({ roster: rosterData });
  } catch (error) {
    console.error('❌ Database error fetching current roster:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/roster/:id', authenticateToken, async (req, res) => {
  try {
    const rosterId = req.params.id;

    const result = await db.query(`SELECT * FROM rosters WHERE id = $1`, [rosterId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    const roster = result.rows[0];
    const rosterData = {
      id: roster.id,
      name: roster.name,
      data: JSON.parse(roster.data),
      activeDays: JSON.parse(roster.active_days),
      createdAt: roster.created_at,
      updatedAt: roster.updated_at
    };

    res.json({ roster: rosterData });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/roster', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, data, activeDays } = req.body;

    if (!name || !data || !activeDays) {
      return res.status(400).json({ error: 'Name, data, and activeDays are required' });
    }

    console.log(`📝 Admin ${req.user.username} creating roster: ${name}`);

    const result = await db.query(
      `INSERT INTO rosters (name, data, active_days, created_by) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, JSON.stringify(data), JSON.stringify(activeDays), req.user.id]
    );

    console.log(`✅ Roster created successfully with ID: ${result.rows[0].id}`);
    res.json({
      message: 'Roster created successfully',
      rosterId: result.rows[0].id
    });
  } catch (error) {
    console.error('❌ Database error creating roster:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/roster/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rosterId = req.params.id;
    const { name, data, activeDays } = req.body;

    if (!name || !data || !activeDays) {
      return res.status(400).json({ error: 'Name, data, and activeDays are required' });
    }

    const result = await db.query(
      `UPDATE rosters SET name = $1, data = $2, active_days = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [name, JSON.stringify(data), JSON.stringify(activeDays), rosterId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    res.json({ message: 'Roster updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/rosters', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`SELECT id, name, created_at, updated_at FROM rosters ORDER BY updated_at DESC`);
    res.json({ rosters: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Change Password endpoint
app.post('/api/auth/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current user data
    const userResult = await db.query(`SELECT password FROM users WHERE id = $1`, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedNewPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
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
  console.log(`🐘 Using PostgreSQL database for persistence\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  db.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.end();
  process.exit(0);
});