## JazzStripe Architecture Overview

This document gives assistants and new contributors a fast, high-signal overview of the app: data model, state flow, and primary components. It's kept concise and practical.

### Stack
- Frontend: React (CRA, `react-scripts`), single-page app
- Styling: `src/App.css`
- Data & Auth: Supabase (`@supabase/supabase-js` v2)
- Storage: Supabase Storage bucket `outfits`
- Mobile: PWA with Vercel deployment (future: Expo native app)

### Key Files
- `src/lib/supabase.js`: Exports configured Supabase client using `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`.
- `src/App.jsx`: Entire UI and logic live here.
  - Auth, header, feed, search, create-post modal, like logic, filters.

### Data Model (Supabase)
- Table `profiles`: `{ id (uuid, auth.users), username text, theme_preference text, style_eras jsonb, region text, created_at }`
- Table `posts`: `{ id uuid, user_id uuid, image_url text, caption text, clothing_items jsonb, is_full_brand bool, full_brand_name text, post_mode text, color_mood text, silhouette_type text, brand_tier text, region text, created_at }`
- Table `likes`: `{ id uuid, post_id uuid, user_id uuid, created_at }` (unique on post_id+user_id)
- Table `comments`: `{ id uuid, post_id uuid, user_id uuid, content text, created_at }`
- Table `follows`: `{ id uuid, follower_id uuid, following_id uuid, created_at }` (unique on follower_id+following_id)
- Table `view_patterns`: `{ id uuid, user_id uuid, post_id uuid, view_duration integer, scroll_depth float, created_at }`
- Storage bucket `outfits` (public) for image uploads

### App State (in `App.jsx`)
- `user`: current auth user (id, email, username)
- `posts`: array of normalized posts for UI
- `filter`: `{ brand, fullBrand }` filter for feed
- `darkMode`: theme toggle
- `view`: `'feed' | 'auth' | 'profile'`
- `currentProfile`: `{ userId, username }` for profile view
- `following`: array of user IDs being followed
- `feedType`: `'all' | 'following' | 'explore'` for different feed types
- `profileTheme`: `'vinyl' | 'cassette' | 'streaming'` for profile customization
- Modals: `showCreatePost`, `showSearch`
- Search: `searchFullBrand` (parent), debounced input state lives inside `SearchModal`
- Loading: `loading` for feed fetch

### Authentication Flow
1. `handleAuth` handles sign in or sign up (controlled by hidden `authType` in `AuthModal`).
2. On sign up: creates `profiles` row with `id = user.id` and `username`.
3. Session is restored via `supabase.auth.getSession()` and `onAuthStateChange` in an effect.
4. `logout` calls `supabase.auth.signOut()` and resets `user`.

### Posts Flow
- `fetchPosts()` loads: `posts` with joined `profiles(username)` and `likes(user_id)`.
- Transform to UI shape: `{ id, userId, username, imageUrl, caption, clothingItems, isFullBrand, fullBrandName, likes, timestamp, likedBy }`.
- Realtime: a Supabase channel subscribes to `postgres_changes` on `posts`; on any event, `fetchPosts()` refreshes.
- Likes: `toggleLike(postId)` inserts/deletes from `likes`, then refreshes posts.

### Create Post Flow
`CreatePostModal` handles:
1. Image selection with validation (type, ≤5MB) and preview.
2. Two modes:
   - Full brand outfit → choose `fullBrandName`.
   - Individual items → cascading picker builds `clothingItems` map with keys:
     - With subcategory: `"Category - Subcategory"` (e.g., `"Tops - T-Shirt"`)
     - Without subcategory: `"Category"` (e.g., `"Footwear"`)
3. `createPost()`
   - Uploads file to Storage `outfits`
   - Gets public URL
   - Inserts row into `posts` with `image_url`, `caption`, `clothing_items`, `is_full_brand`, `full_brand_name`
   - Refreshes feed and closes modal

### Search & Filter
- `SearchModal` uses debounced local input (300ms) to filter `BRANDS`.
- `searchFullBrand` toggles whether filtering targets full-brand posts only.
- Clicking a brand applies `filter` in parent; `Feed` renders filtered posts.

### UI Components (all in `App.jsx`)
- `Header`: theme toggle, home button, search, create-post, profile, auth button
- `FilterBar`: shows current filter with a clear button
- `Feed`: renders posts; respects `filter` and `loading` state
- `FeedTabs`: "For You", "Following", "Explore" feed navigation
- `Post`: displays avatar (initial), image, likes, comments, three-dot menu, brand chips
- `Profile`: user profile with posts, stats, theme selector
- `Comments`: modal for viewing and adding comments
- `SearchModal`: debounced brand search with vibe matching
- `CreatePostModal`: image upload, caption, post modes, full brand vs cascading item picker
- `AuthModal`: toggles between Sign In / Sign Up; uses hidden `authType`

### Core Features (Music-Inspired Discovery)

#### 1. Smart Explore Algorithm (70% taste-based, 30% discovery)
- **View tracking**: Intersection Observer measures post view duration
- **Preference learning**: Analyzes brand affinity, silhouette, color mood from viewing patterns
- **Smart mixing**: 70% taste-matched content + 30% random discovery
- **Non-prescriptive**: Learns from behavior, not explicit tags

#### 2. "Find Similar Vibes" Feature
- **Three-dot menu**: "🎵 Find Similar Vibes" option on each post
- **Vibe matching**: Based on brand tier (designer vs streetwear) and aesthetic
- **Modal display**: Shows up to 20 similar posts
- **Organic feel**: Matches overall aesthetic, not exact items

#### 3. Regional Style Discovery (Foundation)
- **Profile region field**: Ready for location detection
- **Database structure**: Prepared for regional content seeding
- **Privacy-first**: Optional location sharing

#### 4. "Advice Mode" for Posts
- **Post modes**: Regular, Need Advice, Work in Progress
- **Enhanced visibility**: Advice posts shown to wider audience
- **Helpful context**: Explains when advice mode is selected
- **Database integration**: `post_mode` field

#### 5. Music-Influenced Profile Customization
- **Three themes**: Vinyl (circular), Cassette (two-column), Streaming (continuous)
- **Visual customization**: Different layouts and hover effects
- **Theme selector**: Modal with music-inspired icons
- **Database storage**: Theme preferences in profiles

#### 6. Smart Brand Search
- **Enhanced search**: Finds exact brand matches first
- **Vibe matching**: Includes similar aesthetic posts
- **Natural results**: Feels like discovery, not rigid search
- **Brand tier awareness**: Designer vs streetwear grouping

### Constants
- `BRANDS`: curated and sorted list of brands (used by search, brand pickers)
- `CATEGORIES`: `{ Category: string[] subcategories }` used to build cascading picker keys

### Extension Points
- Add pagination to `fetchPosts()` and `Feed`
- Add optimistic updates for likes to avoid full refresh
- Replace inline styles in cascading picker with class-based CSS
- Add `BrandSelector` with custom-brand support if desired (keep `clothingItems` shape)
- Add image transformations (thumbnails) via Storage edge functions/CDN rules

### Mobile Deployment
- **PWA**: Progressive Web App with `manifest.json` and mobile-optimized viewport
- **Vercel**: Configured with `vercel.json` for optimal mobile performance
- **Icons**: `icon-192.png` and `icon-512.png` for app installation
- **Future**: Expo native app setup documented in `EXPO_SETUP.md`

### Env & Scripts
- `.env.local` must include:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`
- Useful scripts:
  - `npm start` / `npm run dev`
  - `npm run stop` / `npm run restart` / `npm run check`
  - `./run-app.command` (macOS double-click launcher)

### Diagram

See `Mermaid` diagram in PR/assistant messages for end-to-end flow (Auth, Feed, Create, Realtime).

### Gotchas
- Ensure Storage bucket `outfits` is public and policies allow read; authenticated users can write.
- Ensure RLS policies exist for `profiles`, `posts`, `likes` as defined in `supabase-schema.sql`.
- `searchFullBrand` only affects filtering logic; it doesn’t change post creation.
- Keep `clothingItems` keys stable (`Category - Subcategory`), as Feed/filters rely on them.

This doc should be enough for an assistant to reason about changes safely and quickly.


