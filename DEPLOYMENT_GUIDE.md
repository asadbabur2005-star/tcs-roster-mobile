# TCS Roster Mobile - Complete Deployment Guide

## 🚀 Current Live Deployment Status

### Frontend (Vercel)
- **Production URL:** https://tcs-roster-mobile.vercel.app
- **Status:** ✅ WORKING
- **Platform:** Vercel
- **Repository:** Connected to GitHub (auto-deploy on push)
- **Build Command:** `npm run build`
- **Environment Variables:** Configured in `vercel.json`

### Backend (Render)
- **Production URL:** https://tcs-roster-mobile-1.onrender.com
- **Status:** ✅ WORKING
- **Platform:** Render
- **Repository:** Connected to GitHub (auto-deploy on push)
- **Build Command:** `cd mobile-server && npm install && npm start`
- **Health Check:** https://tcs-roster-mobile-1.onrender.com/health

## 📁 Project Structure

```
tcs-roster-mobile/
├── src/                          # React frontend source
│   └── services/api.js          # API configuration (uses production backend)
├── mobile-server/               # Node.js backend
│   ├── server.js               # Main server file with CORS config
│   └── package.json            # Backend dependencies
├── build/                      # Production build output
├── .env                        # Local environment variables (gitignored)
├── .env.production             # Production environment variables
├── vercel.json                 # Vercel deployment configuration
├── netlify.toml               # Legacy Netlify config (not used)
└── package.json               # Frontend dependencies and build scripts
```

## 🔧 Critical Configuration Files

### 1. API Configuration (`src/services/api.js`)
```javascript
// IMPORTANT: Uses production backend URL as fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tcs-roster-mobile-1.onrender.com';
```

### 2. CORS Configuration (`mobile-server/server.js`)
```javascript
// Current whitelisted domains:
origin: [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://tcs-roster-mobile.vercel.app',  // Current production frontend
  'https://tcs-roster-mobile1.netlify.app',
  // ... other domains
]
```

### 3. Vercel Configuration (`vercel.json`)
```json
{
  "framework": "create-react-app",
  "env": {
    "REACT_APP_API_URL": "https://tcs-roster-mobile-1.onrender.com"
  }
}
```

## 🔑 Environment Variables & Credentials

### Backend (Render Environment Variables)
- `NODE_ENV=production`
- `JWT_SECRET=[set in Render dashboard]`
- `ADMIN_PASSWORD=[set in Render dashboard]`
- `CORS_ORIGINS=[comma-separated frontend URLs]`
- `PORT=10000` (auto-set by Render)

### Frontend (Vercel)
- `REACT_APP_API_URL=https://tcs-roster-mobile-1.onrender.com`

### Default Admin Credentials
- **Username:** admin
- **Password:** [check ADMIN_PASSWORD in Render dashboard]

## 🚨 Common Issues & Solutions

### Issue 1: "Network request failed: Failed to fetch"
**Symptoms:** Login attempts fail with network errors
**Causes & Solutions:**

1. **Frontend using localhost instead of production backend**
   ```bash
   # Check if build contains localhost
   grep -r "localhost:5001" build/

   # Solution: Verify api.js fallback URL is production
   # File: src/services/api.js
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tcs-roster-mobile-1.onrender.com';
   ```

2. **CORS blocking requests**
   ```bash
   # Add new frontend URL to backend CORS
   # File: mobile-server/server.js
   origin: [...existing_urls, 'https://new-frontend-url.com']

   git add mobile-server/server.js
   git commit -m "Add new URL to CORS whitelist"
   git push  # Triggers Render redeploy
   ```

3. **Backend is sleeping (Render free tier)**
   ```bash
   # Wake up backend
   curl https://tcs-roster-mobile-1.onrender.com/health

   # Should return: {"status":"OK","timestamp":"...","service":"TCS Roster Mobile API"}
   ```

### Issue 2: Environment Variables Not Working
**Solutions:**

1. **For Vercel:** Check `vercel.json` has correct API URL
2. **For local development:** Update `.env` file (gitignored)
3. **For production:** Hardcoded fallback in `api.js` should work

### Issue 3: "Cannot GET /" on Backend
**Solution:** Backend has root route that shows API info - this is normal and working.

### Issue 4: Build Failures
**Frontend Build Issues:**
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Backend Build Issues:**
```bash
# Check backend dependencies
cd mobile-server
npm install
npm start  # Test locally
```

## 🔄 Deployment Process

### Quick Redeploy (Both Platforms Auto-Deploy)
```bash
git add .
git commit -m "Your change description"
git push
```
- Vercel: Rebuilds frontend automatically (~2 minutes)
- Render: Rebuilds backend automatically (~3-5 minutes)

### Force Redeploy
```bash
# Vercel
vercel --prod

# Render: Push any change to trigger redeploy
git commit --allow-empty -m "Force Render redeploy"
git push
```

## 🧪 Testing Checklist

### After Any Deployment:
1. ✅ **Backend Health Check:** https://tcs-roster-mobile-1.onrender.com/health
2. ✅ **Frontend Loads:** https://tcs-roster-mobile.vercel.app
3. ✅ **Admin Login Works:** admin / [password from Render dashboard]
4. ✅ **API Calls Work:** Check browser console for successful API requests
5. ✅ **CORS is Working:** No CORS errors in browser console

### Debug Steps:
1. **Check browser console** for error messages
2. **Check network tab** to see actual API URLs being called
3. **Verify backend is responding:** Visit health endpoint
4. **Check CORS:** Look for "blocked by CORS policy" errors

## 📋 Platform-Specific Info

### Vercel Dashboard
- **URL:** https://vercel.com/dashboard
- **Project:** tcs-roster-mobile
- **Auto-deploy:** ✅ Connected to GitHub main branch

### Render Dashboard
- **URL:** https://render.com/dashboard
- **Service:** tcs-roster-mobile-1
- **Auto-deploy:** ✅ Connected to GitHub main branch
- **Logs:** Available in Render dashboard for debugging

## 🔧 Emergency Recovery

### If Everything Breaks:
1. **Check if services are up:**
   - Backend: https://tcs-roster-mobile-1.onrender.com/health
   - Frontend: https://tcs-roster-mobile.vercel.app

2. **Redeploy from scratch:**
   ```bash
   # Frontend
   vercel --prod

   # Backend (push any change)
   git commit --allow-empty -m "Emergency redeploy"
   git push
   ```

3. **Local testing:**
   ```bash
   # Test backend locally
   cd mobile-server && npm start

   # Test frontend locally (update .env to point to localhost:5001)
   npm start
   ```

### Nuclear Option - Fresh Deploy:
1. Create new Render service from GitHub
2. Create new Vercel project from GitHub
3. Update CORS in backend with new URLs
4. Update API URL in frontend configuration

## 🏗️ Architecture Overview

```
User Browser
    ↓
Vercel Frontend (React)
    ↓ HTTPS API calls
Render Backend (Node.js + Express)
    ↓
SQLite Database (persistent storage)
```

### Key Learnings:
- **Always check CORS** when adding new frontend URLs
- **Environment variables** can be tricky - hardcoded fallbacks work reliably
- **Render free tier** backends sleep after 15 minutes of inactivity
- **Both platforms auto-deploy** from GitHub main branch
- **Mobile browsers** may have issues with long auto-generated URLs

## 📝 Deployment History & Issues Resolved

### September 27, 2025 - Final Working Deployment
**Issues Encountered:**
1. **Netlify environment variables not working** - Tried `.env.production`, `netlify.toml`, and build command approaches
2. **Windows vs Linux syntax** - Environment variable syntax in `package.json` failed on Windows
3. **CORS blocking all requests** - Required multiple CORS updates as frontend URLs changed
4. **Frontend stuck on localhost** - Despite environment variable attempts, build kept using localhost:5001
5. **Mobile authentication prompts** - Long Vercel URLs triggered security checks

**Final Solution:**
- **Direct API URL fallback** - Hardcoded production URL in `src/services/api.js`
- **Vercel with custom domain** - Used `tcs-roster-mobile.vercel.app` for clean URLs
- **Comprehensive CORS whitelist** - Added all frontend URLs to backend CORS configuration
- **Abandoned Netlify** - Switched to Vercel due to environment variable issues

### Root Cause Analysis:
The main issue was **environment variable injection during build time**. Different platforms handle React environment variables differently:
- **Local development:** Uses `.env` files (gitignored)
- **Netlify:** Has complex environment variable precedence that failed
- **Vercel:** Uses `vercel.json` or dashboard settings, but fallback approach was more reliable

---

**Last Updated:** 2025-09-27
**Current Status:** ✅ FULLY OPERATIONAL
**Frontend:** https://tcs-roster-mobile.vercel.app
**Backend:** https://tcs-roster-mobile-1.onrender.com