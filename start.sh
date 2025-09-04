#!/bin/bash

# JazzStripe App Starter Script
echo "🚀 Starting JazzStripe App..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the jazzstripe-app directory"
    exit 1
fi

# Check if .env.local exists and has real credentials
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found!"
    echo "Please set up your Supabase credentials first"
    exit 1
fi

# Check if .env.local has placeholder values
if grep -q "your_supabase_project_url_here" .env.local; then
    echo "⚠️  Warning: .env.local still has placeholder values!"
    echo "Please update with your actual Supabase credentials"
    exit 1
fi

echo "✅ Environment looks good!"
echo ""

# Kill any existing React processes
echo "🔄 Stopping any existing React servers..."
pkill -f "react-scripts start" 2>/dev/null || true

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo "Your app will open at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

npm start
