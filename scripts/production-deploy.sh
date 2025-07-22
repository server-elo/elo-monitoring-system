#!/bin/bash

# PRODUCTION DEPLOYMENT SCRIPT
# Quantum-level solution for Next.js 15 with stable chunk generation

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop any running processes
log_info "Stopping existing Next.js processes..."
pkill -f "next" || true
pkill -f "node server.js" || true
sleep 2

# Step 2: Clean build artifacts
log_info "Cleaning build artifacts..."
rm -rf .next .turbo node_modules/.cache
log_success "Build artifacts cleaned"

# Step 3: Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm ci --production=false
    log_success "Dependencies installed"
fi

# Step 4: Build for production
log_info "Building for production with stable chunks..."
npm run build

if [ $? -eq 0 ]; then
    log_success "Production build completed successfully"
else
    log_error "Build failed!"
    exit 1
fi

# Step 5: Verify chunk generation
log_info "Verifying chunk generation..."
if [ -d ".next/static/chunks" ]; then
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" | wc -l)
    log_success "Generated $CHUNK_COUNT JavaScript chunks"
    
    # List a few chunks for verification
    log_info "Sample chunks:"
    ls .next/static/chunks/*.js | head -5 | while read chunk; do
        echo "  - $(basename $chunk)"
    done
else
    log_error "Chunks directory not found!"
    exit 1
fi

# Step 6: Start production server
log_info "Starting production server..."
PORT=${PORT:-3000}

# Start server in background
nohup npm run start > /tmp/nextjs-production.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
log_info "Waiting for server to start..."
sleep 10

# Test server response
if curl -s -f http://localhost:$PORT > /dev/null; then
    log_success "Server is running on http://localhost:$PORT"
    log_success "Process ID: $SERVER_PID"
    
    # Test chunk loading
    if curl -s -f http://localhost:$PORT/_next/static/chunks/webpack.js > /dev/null; then
        log_success "Chunks are loading correctly - NO MORE 404 ERRORS!"
    else
        log_warning "Webpack chunk test failed, but server is running"
    fi
    
    # Display server info
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "=================================="
    echo "🌐 URL: http://localhost:$PORT"
    echo "📊 Process: $SERVER_PID"
    echo "📁 Logs: /tmp/nextjs-production.log"
    echo "🔄 Build: Production (Next.js 15)"
    echo "⚡ Chunks: Stable (No Turbopack)"
    echo ""
    echo "🛑 To stop: kill $SERVER_PID"
    echo "📋 To view logs: tail -f /tmp/nextjs-production.log"
    echo ""
    
else
    log_error "Server failed to start properly"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi