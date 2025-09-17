# 🎵 Jazzstripe

**Outfit inspiration and style discovery** - A music-influenced social platform for fashion without rigid style rules.

## ✨ Features

### 🎯 Core Discovery Features
- **Smart Explore Algorithm** - 70% taste-based, 30% discovery mix
- **Find Similar Vibes** - Discover posts with matching aesthetic
- **Enhanced Posting System** - 4-stage visual tagging flow
- **Interactive Tagging** - Drag & drop clothing item tags
- **Post Modes** - Regular, Need Advice, Work in Progress
- **Music-Influenced Profiles** - Vinyl, Cassette, Streaming themes
- **Smart Brand Search** - Natural discovery with vibe matching
- **View Tracking** - Learns your preferences automatically

### 🎨 Music-Inspired Design
- **Vinyl Theme** - Circular grid layout with rotation effects
- **Cassette Theme** - Two-column layout with slide animations
- **Streaming Theme** - Continuous scroll with fade effects

### 📱 Mobile Ready
- **PWA** - Install as mobile app
- **Touch Optimized** - Large buttons, swipe-friendly
- **Responsive** - Works on all screen sizes
- **Enhanced Posting** - Mobile-first 4-stage posting flow

### 🏷️ Visual Tagging System
- **Interactive Tagging** - Tap clothing items to add tags
- **Draggable Tags** - Smooth drag interactions with visual arrows
- **Brand Selection** - Searchable brand picker with categories
- **Multi-Photo Support** - Tag up to 5 photos per post
- **Touch Optimized** - Mobile-friendly drag and drop

## 📁 Project Structure

```
src/
├── components/
│   ├── posting/                 # Enhanced posting system
│   │   ├── PostCreationFlow.jsx     # Main flow controller
│   │   ├── PhotoCaptureStage.jsx    # Stage 1: Photo capture
│   │   ├── VisualTaggingStage.jsx   # Stage 2: Visual tagging
│   │   ├── DraggableTag.jsx         # Draggable tag component
│   │   ├── BrandSelector.jsx        # Brand selection modal
│   │   ├── MetadataStage.jsx        # Stage 3: Metadata input
│   │   └── PreviewStage.jsx         # Stage 4: Preview & post
│   ├── BottomNavigation.jsx     # Mobile bottom nav
│   ├── TopHeader.jsx           # Clean header component
│   ├── HomeFeed.jsx            # Main feed component
│   ├── SearchPage.jsx          # Search page
│   ├── ActivityFeed.jsx        # Activity feed
│   ├── UserProfile.jsx         # User profile page
│   └── [other components]      # Legacy components
├── lib/
│   └── supabase.js             # Supabase configuration
├── hooks/
│   └── useIsMobile.js          # Mobile detection hook
├── styles/
│   └── modals/                 # Modal-specific styles
├── App.jsx                     # Main app component
├── App.css                     # Global styles
└── index.js                    # App entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Supabase account

### Installation
```bash
# Clone the repository
git clone https://github.com/alexthestick/jazzstripe.git
cd jazzstripe

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm start
```

### Environment Variables
Create `.env.local` with:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Mobile Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Deployment
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

## 🎵 How It Works

### Smart Discovery
- **View Tracking** - Measures how long you look at posts
- **Preference Learning** - Analyzes brand affinity, silhouette, color mood
- **Organic Mixing** - 70% your taste + 30% random discovery

### Find Similar Vibes
- Click the three dots (⋯) on any post
- Select "🎵 Find Similar Vibes"
- Discover posts with matching aesthetic

### Profile Customization
- Go to your profile
- Click "🎵 Theme" button
- Choose your style: Vinyl, Cassette, or Streaming

## 🛠 Tech Stack

- **Frontend**: React (CRA)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: CSS with CSS Variables
- **Mobile**: PWA with Vercel deployment
- **Future**: Expo native app

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md) - Technical details
- [Vercel Deployment](VERCEL_DEPLOYMENT.md) - Mobile deployment guide
- [Expo Setup](EXPO_SETUP.md) - Future native app setup
- [Quick Start](QUICK_START.md) - Development guide

## 🎯 Philosophy

Jazzstripe is like exploring music on Spotify - organic, discovery-based, and focused on vibes rather than rigid style rules. No prescriptive features that tell users what goes together.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live App**: [Deploy to Vercel](https://vercel.com)
- **GitHub**: [alexthestick/jazzstripe](https://github.com/alexthestick/jazzstripe)
- **Supabase**: [supabase.com](https://supabase.com)

---

**Built with ❤️ for the fashion community**
