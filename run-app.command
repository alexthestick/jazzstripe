#!/bin/bash

# JazzStripe App Launcher for macOS
# Double-click this file to start your app!

cd "$(dirname "$0")"

echo "🚀 JazzStripe App Launcher"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please make sure this file is in the jazzstripe-app directory"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if .env.local exists and has real credentials
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found!"
    echo "Please set up your Supabase credentials first"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if .env.local has placeholder values
if grep -q "your_supabase_project_url_here" .env.local; then
    echo "⚠️  Warning: .env.local still has placeholder values!"
    echo "Please update with your actual Supabase credentials"
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Environment looks good!"
echo ""

# Kill any existing React processes
echo "🔄 Stopping any existing React servers..."
pkill -f "react-scripts start" 2>/dev/null || true

# Start the development server
echo "🚀 Starting JazzStripe App..."
echo ""
echo "Your app will open at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Open browser automatically after a short delay
(sleep 3 && open http://localhost:3000) &

npm start
