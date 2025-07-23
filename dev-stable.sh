#!/bin/bash

# Stable Development Script for Solidity Learning Platform
# This script runs a production build locally to avoid chunk loading errors

echo "🚀 Starting Stable Development Environment..."
echo "========================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please update .env with your configuration values."
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Starting production server..."
    echo "========================================"
    echo "Access the app at: http://localhost:3000"
    echo "========================================"
    echo ""
    
    # Start the production server
    npm run start
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi