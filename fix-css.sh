#!/bin/bash
echo "🔧 Running CSS fix script..."

# Kill any running Next.js processes
echo "Stopping Next.js processes..."
pkill -f "next" || true

# Clear caches
echo "Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

# Reinstall CSS dependencies
echo "Reinstalling CSS dependencies..."
npm install tailwindcss@latest autoprefixer@latest postcss@latest

# Clear browser storage (instructions)
echo ""
echo "⚠️  Manual steps required:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Application tab"
echo "3. Click 'Clear site data'"
echo "4. Unregister any service workers"
echo ""

# Start fresh
echo "Starting fresh development server..."
npm run dev
