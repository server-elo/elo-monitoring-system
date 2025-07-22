#!/bin/bash

# Quantum Port Cleanup Script
# Ensures clean port availability for development

echo "🧹 Quantum Port Cleanup Initiated..."
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    echo "Checking port $port..."
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo "  Found process $pid on port $port"
        # Try graceful termination first
        kill -TERM $pid 2>/dev/null || true
        sleep 1
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            echo "  Force killing process $pid"
            kill -9 $pid 2>/dev/null || true
        fi
        echo "  ✅ Port $port cleared"
    else
        echo "  ✅ Port $port is already free"
    fi
}

# Clean common development ports
echo "🔍 Scanning development ports (3000-3010)..."
echo ""

for port in {3000..3010}; do
    kill_port $port
done

# Clean up stale lock files
echo ""
echo "🗑️  Cleaning up stale lock files..."

# Remove Next.js lock files
rm -f .next/cache/*.lock 2>/dev/null
rm -f node_modules/.cache/*.lock 2>/dev/null

# Clean temporary socket files
find /tmp -name "*.sock" -user $USER -delete 2>/dev/null || true
find /tmp -name "*.lock" -user $USER -delete 2>/dev/null || true

echo ""
echo "✨ Port cleanup complete!"
echo ""

# Show available ports
echo "📊 Port availability:"
for port in {3000..3005}; do
    if ! lsof -i:$port >/dev/null 2>&1; then
        echo "  ✅ Port $port: Available"
    else
        echo "  ❌ Port $port: In use"
    fi
done

echo ""
echo "💡 Tip: Use 'PORT=3001 npm run dev' to specify a different port"