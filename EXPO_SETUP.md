# Expo Native App Setup

This document outlines the setup for the future Expo native mobile app.

## Quick Start Commands

```bash
# Create new Expo app
npx create-expo-app jazzstripe-mobile
cd jazzstripe-mobile

# Install dependencies
npm install @supabase/supabase-js expo-secure-store expo-image-picker

# Start development
npx expo start
```

## Project Structure

```
jazzstripe-mobile/
├── App.js                 # Main app component
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── src/
│   ├── components/       # Reusable components
│   ├── screens/          # Screen components
│   ├── lib/
│   │   └── supabase.js   # Supabase client
│   └── utils/            # Helper functions
└── assets/               # Images, fonts, etc.
```

## Key Dependencies

- `@supabase/supabase-js` - Supabase client
- `expo-secure-store` - Secure storage for auth tokens
- `expo-image-picker` - Camera and photo library access
- `expo-camera` - Camera functionality
- `expo-location` - Location services (for regional features)
- `expo-notifications` - Push notifications

## Migration Strategy

1. **Phase 1**: PWA version (current) - works on mobile browsers
2. **Phase 2**: Expo app - native mobile experience
3. **Phase 3**: Advanced native features (camera, notifications, etc.)

## Features to Implement

- [ ] Camera integration for outfit photos
- [ ] Push notifications for likes/comments
- [ ] Offline support with local storage
- [ ] Native sharing capabilities
- [ ] Location-based regional discovery
- [ ] Biometric authentication
- [ ] Native performance optimizations

## Environment Variables

Create `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Build Commands

```bash
# Development
npx expo start

# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Publish to Expo
npx expo publish
```
