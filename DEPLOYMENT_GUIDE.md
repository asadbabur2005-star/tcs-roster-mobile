# TCS Roster Mobile - Production Deployment Guide

## 🚀 One-Try Deployment Instructions

### Prerequisites
1. Render account with free tier
2. Netlify account with free tier
3. Git repository with latest fixes pushed

---

## 📋 Deployment Checklist

### Phase 1: Backend Deployment (Render)

1. **Deploy to Render:**
   - Go to Render Dashboard → New Web Service
   - Connect GitHub repository
   - **Root Directory:** `mobile-server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

2. **Set Environment Variables in Render:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-secret-key-minimum-32-characters-long
   ADMIN_PASSWORD=your-secure-admin-password-replace-default
   CORS_ORIGINS=https://tcs-roster-mobile.netlify.app
   ```

3. **Configure Persistent Storage:**
   - In Render service settings → Disks
   - Add disk: Name: `data`, Mount Path: `/opt/render/project/src/data`, Size: 1GB

4. **Get Backend URL:**
   - After deployment, note the URL: `https://your-app-name.onrender.com`

### Phase 2: Frontend Deployment (Netlify)

1. **Deploy to Netlify:**
   - Go to Netlify Dashboard → New Site from Git
   - Connect GitHub repository
   - **Base Directory:** (leave empty - deploys from root)
   - **Build Command:** `npm run build`
   - **Publish Directory:** `build`

2. **Set Environment Variables in Netlify:**
   ```
   REACT_APP_API_URL=https://your-render-backend-url.onrender.com
   ```

3. **Update CORS on Backend:**
   - Get Netlify URL: `https://your-netlify-app.netlify.app`
   - Update Render environment variable:
   ```
   CORS_ORIGINS=https://your-netlify-app.netlify.app
   ```

---

## ✅ Critical Fixes Applied

### 🔧 Backend Fixes (mobile-server/)
- ✅ Database persistence for Render ephemeral file system
- ✅ CORS configuration for cross-domain requests
- ✅ Cookie settings for cross-domain authentication
- ✅ Rate limiting enabled for production
- ✅ Environment-based port configuration
- ✅ Production security headers

### 🔧 Frontend Fixes (src/)
- ✅ API URL uses environment variable properly
- ✅ Fallback URL set to localhost for development only

---

## 🔍 Post-Deployment Testing

1. **Backend Health Check:**
   - Visit: `https://your-render-app.onrender.com/health`
   - Should return: `{"status":"OK","timestamp":"...","service":"TCS Roster Mobile API"}`

2. **Frontend Access:**
   - Visit: `https://your-netlify-app.netlify.app`
   - Should load the role selection page

3. **Full Authentication Flow:**
   - Admin login with username: `admin` and your secure password
   - Carer login with any name
   - Create/edit rosters
   - Password change functionality

---

## ⚠️ Important Notes

### Environment Variables
- **NEVER** use default passwords in production
- JWT_SECRET must be minimum 32 characters
- Store credentials securely

### Database Backup
- Render's persistent disk backs up automatically
- For additional safety, consider periodic manual exports

### Performance
- First load may be slow (Render free tier cold starts)
- Subsequent requests should be fast

### Security
- Rate limiting: 500 requests per 15 minutes per IP
- Secure cookies with cross-domain support
- CORS restricted to your domain only

---

## 🐛 Troubleshooting

### If Backend Won't Start:
- Check Render logs for environment variable errors
- Ensure all required env vars are set
- Verify persistent disk is mounted

### If Frontend Can't Connect:
- Check CORS_ORIGINS includes your Netlify URL
- Verify REACT_APP_API_URL points to correct Render URL
- Check browser console for CORS errors

### If Authentication Fails:
- Ensure cookies are enabled
- Check browser security settings
- Verify JWT_SECRET is set correctly

---

## 📞 Support

If deployment fails:
1. Check service logs (Render/Netlify dashboards)
2. Verify all environment variables
3. Ensure repository has latest fixes
4. Check CORS configuration matches deployed URLs

**Ready for production deployment! 🎉**