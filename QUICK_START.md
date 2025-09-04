# 🚀 JazzStripe App - Quick Start Guide

## 📋 Prerequisites
- Node.js installed on your computer
- A Supabase account (free at supabase.com)

## 🎯 Super Quick Start (3 Steps)

### Step 1: Open Terminal & Navigate to App
```bash
cd /Users/alexcoluna/Desktop/Project\ Folder/jazzstripe/jazzstripe-app
```

### Step 2: Start the App
```bash
npm start
```

### Step 3: Open Your Browser
Go to: **http://localhost:3000**

That's it! 🎉

---

## 🔧 If You Need to Set Up Supabase (First Time Only)

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Click "New Project"
- Choose your organization
- Enter project name: "jazzstripe"
- Set a database password
- Click "Create new project"

### 2. Get Your Credentials
- In your Supabase dashboard, go to **Settings** → **API**
- Copy your **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
- Copy your **anon public key** (long string starting with `eyJ...`)

### 3. Update Environment File
Edit the file `.env.local` in your project folder:
```bash
REACT_APP_SUPABASE_URL=https://your-actual-project-url.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Set Up Database
- In Supabase dashboard, go to **SQL Editor**
- Copy and paste the contents of `supabase-schema.sql`
- Click **Run**

---

## 🛠️ Troubleshooting

### App Won't Start?
```bash
# Make sure you're in the right folder
pwd
# Should show: /Users/alexcoluna/Desktop/Project Folder/jazzstripe/jazzstripe-app

# If not, navigate there:
cd /Users/alexcoluna/Desktop/Project\ Folder/jazzstripe/jazzstripe-app

# Then try:
npm start
```

### Blank Page?
- Check your `.env.local` file has real Supabase credentials (not placeholder text)
- Open browser console (F12) and look for error messages
- Make sure you've run the database schema in Supabase

### Port Already in Use?
```bash
# Kill any existing React servers
pkill -f "react-scripts start"

# Then start again
npm start
```

---

## 📱 What You Should See

1. **Authentication Page** - Sign up or sign in
2. **Feed View** - Browse outfit posts
3. **Header** - Logo, theme toggle, search, post button
4. **Dark Mode** - Toggle with 🌙/☀️ button

---

## 🎨 Testing Your App

### Test Authentication:
1. Click "Sign Up" 
2. Enter email, username, password
3. Check your email for verification
4. Sign in with same credentials

### Test Post Creation:
1. Sign in to your account
2. Click "+ Post" button
3. Upload an image
4. Add caption and tag brands
5. Submit post

### Test Features:
- Dark mode toggle
- Search functionality
- Brand filtering
- Like system

---

## 🆘 Need Help?

**Common Commands:**
```bash
# Start the app
npm start

# Stop the app (Ctrl+C in terminal)

# Check if app is running
curl http://localhost:3000

# Kill all React processes
pkill -f "react-scripts start"
```

**Your app should be running at: http://localhost:3000**

---

## 📁 Project Structure
```
jazzstripe-app/
├── src/
│   ├── App.jsx          # Main app component
│   ├── App.css          # Styles
│   └── lib/
│       └── supabase.js  # Database connection
├── .env.local           # Your Supabase credentials
├── supabase-schema.sql  # Database setup
└── package.json         # Dependencies
```

**Happy coding! 🎉**
