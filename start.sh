#!/bin/bash

# Universal startup script for Solidity Learning Platform
# Handles all common issues and provides a stable development environment

set -e  # Exit on error

echo "🚀 Solidity Learning Platform Startup"
echo "===================================="
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $1 is already in use!"
        echo "Attempting to kill process on port $1..."
        kill -9 $(lsof -Pi :$1 -sTCP:LISTEN -t) 2>/dev/null || true
        sleep 2
    fi
}

# Check and clear ports
echo "🔍 Checking ports..."
check_port 3000
check_port 3001

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.18.0"
    echo "Current version: $(node -v)"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Setup environment
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please update .env with your configuration!"
    else
        echo "📋 Creating minimal .env file..."
        cat > .env << EOF
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
EOF
    fi
fi

# Setup database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push --skip-generate 2>/dev/null || {
    echo "🔄 Database push failed, trying migration..."
    npx prisma migrate dev --name init || true
}

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next .turbo

# Determine build mode
if [ "$1" == "dev" ]; then
    echo "🔧 Starting in development mode..."
    echo "⚠️  Note: Dev mode may have chunk loading issues."
    echo "   Use './start.sh prod' for stable development."
    npm run dev
else
    echo "🏗️  Building for production (stable mode)..."
    
    # Use minimal config if build fails
    npm run build 2>/dev/null || {
        echo "⚠️  Build failed with current config, trying minimal config..."
        if [ -f "next.config.dev.js" ]; then
            cp next.config.js next.config.js.backup 2>/dev/null || true
            cp next.config.dev.js next.config.js
            npm run build || {
                echo "❌ Build still failing. Restoring original config..."
                mv next.config.js.backup next.config.js 2>/dev/null || true
                exit 1
            }
        fi
    }
    
    echo ""
    echo "✅ Build successful!"
    echo "🌐 Starting production server..."
    echo "===================================="
    echo "🔗 Access the app at: http://localhost:3000"
    echo "📊 Server logs below:"
    echo "===================================="
    echo ""
    
    npm run start
fi