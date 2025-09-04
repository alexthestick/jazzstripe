# Vercel Deployment Guide

This guide walks you through deploying Jazzstripe to Vercel for mobile-optimized PWA access.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Setup**: Ensure your Supabase project is configured

## Quick Deployment

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd jazzstripe-app
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: jazzstripe
# - Directory: ./
# - Override settings? N
```

### Option 2: GitHub Integration

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect React settings
5. Add environment variables (see below)
6. Click "Deploy"

## Environment Variables

In Vercel dashboard, go to Project Settings → Environment Variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Mobile Optimization

The app is configured for mobile with:

- **PWA Manifest**: `public/manifest.json` for app installation
- **Mobile Viewport**: Optimized for mobile devices
- **Touch-Friendly**: Large buttons and touch targets
- **Responsive Design**: Works on all screen sizes

## Testing Mobile Features

1. **Install as PWA**:
   - Open app in mobile browser
   - Look for "Add to Home Screen" prompt
   - Or use browser menu → "Add to Home Screen"

2. **Test Core Features**:
   - ✅ Post creation with image upload
   - ✅ Find Similar Vibes (three-dot menu)
   - ✅ Profile themes (🎵 Theme button)
   - ✅ Smart search with vibe matching
   - ✅ View tracking for preferences

## Performance Optimizations

Vercel automatically provides:
- **CDN**: Global content delivery
- **Image Optimization**: Automatic image compression
- **Caching**: Static asset caching
- **HTTPS**: SSL certificates

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL will be automatically configured

## Monitoring

- **Analytics**: Built-in Vercel Analytics
- **Performance**: Core Web Vitals monitoring
- **Errors**: Real-time error tracking

## Future: Expo Native App

When ready for native features:
1. Follow `EXPO_SETUP.md` guide
2. Use same Supabase backend
3. Share components between PWA and native

## Troubleshooting

### Common Issues

**Build Fails**:
- Check environment variables are set
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

**Mobile Not Working**:
- Verify `manifest.json` is accessible
- Check viewport meta tag
- Test on actual mobile device

**Supabase Errors**:
- Verify environment variables
- Check Supabase project is active
- Ensure RLS policies are configured

### Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Project Issues: Check `ARCHITECTURE.md` for technical details
