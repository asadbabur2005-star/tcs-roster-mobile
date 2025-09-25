# TCS Roster Mobile App

A mobile-native version of the TCS Roster web application built with React and Capacitor for Android devices.

## Features

- **Mobile-First Design**: Touch-optimized UI with 48px minimum touch targets
- **Offline Support**: Service worker caching for offline roster viewing
- **Native Android App**: Built with Capacitor for native mobile experience
- **Same Functionality**: All features from web app (admin/carer roles, roster management)
- **Real-time Updates**: Live roster updates via API
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support

## Quick Start

### Prerequisites
- Node.js 18+
- Android Studio (for APK building)
- Java JDK 11+

### Development Setup

```bash
# Start backend server
cd mobile-server
npm start
# Server runs on http://localhost:5001

# In another terminal, start React app
npm start
# App runs on http://localhost:3000
```

### Building APK

```bash
# Build React app
npm run build

# Sync with Capacitor
npx cap sync

# Open in Android Studio
npx cap open android
# Then build APK from Android Studio
```

### Quick Commands

```bash
# Start both servers
npm run dev

# Build for production
npm run build:prod

# Android development
npm run android:build
```

## Architecture

- **Frontend**: React 18 with mobile-optimized components
- **Backend**: Express.js + SQLite (port 5001)
- **Mobile**: Capacitor 7 for native Android features
- **Authentication**: JWT with secure cookies
- **Offline**: Service worker with cache-first strategy

## Project Structure

```
tcs-roster-mobile/
├── src/                    # React mobile components
│   ├── components/        # UI components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   └── services/          # API services
├── mobile-server/         # Express.js backend
├── android/               # Capacitor Android project
├── public/                # Static assets + service worker
└── build/                 # Production build output
```

## Differences from Web App

1. **Mobile-optimized CSS**: Touch-friendly interface
2. **Separate backend**: Independent SQLite database (port 5001)
3. **Enhanced accessibility**: Mobile screen reader support
4. **Offline capability**: Service worker caching
5. **Native features**: Android notifications, splash screen

## User Roles

- **Admin**: Full access (create/edit rosters) - login: admin/admin123
- **Carer**: Read-only access (view rosters) - enter name to continue

## API Endpoints

- `GET /health` - Server health check
- `POST /api/auth/login` - Admin login
- `POST /api/auth/carer-login` - Carer access
- `GET /api/roster/current` - Get current roster
- `POST /api/roster` - Create new roster
- `PUT /api/roster/:id` - Update roster

## Building APK

1. Ensure Android Studio is installed
2. Run `npm run build` to create production build
3. Run `npx cap sync` to sync with Capacitor
4. Run `npx cap open android` to open in Android Studio
5. Build APK from Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)

## Testing

The app can be tested via:
- **Local development**: React dev server + mobile backend
- **Android emulator**: APK installed in Android Studio emulator
- **Physical device**: APK installed via USB debugging
- **Screen sharing**: TeamViewer for remote testing

## Troubleshooting

### Build Issues
```bash
# Clear node_modules and rebuild
rm -rf node_modules
npm install --legacy-peer-deps
npm run build
```

### Android Issues
```bash
# Clean Capacitor cache
npx cap sync --clean
```

### Backend Issues
```bash
# Check server is running
curl http://localhost:5001/health

# Restart mobile server
cd mobile-server
npm start
```

## Production Deployment

For production use:
1. Deploy mobile backend to cloud service (Railway, Render, etc.)
2. Update API URLs in `src/services/api.js`
3. Build and distribute APK files directly to users
4. No app store submission required

---

Built with ❤️ for TC's care team