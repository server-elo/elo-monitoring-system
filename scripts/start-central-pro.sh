#!/bin/bash

# Production Central Monitoring Service Startup Script
# Usage: ./start-central-pro.sh [environment]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/central-monitoring-pro.log"

# Environment setup
ENVIRONMENT=${1:-development}
export NODE_ENV="$ENVIRONMENT"

echo "🚀 Starting Central Monitoring Service (Production)"
echo "=================================================="
echo "📁 Project Directory: $PROJECT_DIR"
echo "🌍 Environment: $ENVIRONMENT"
echo "📝 Log File: $LOG_FILE"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if config file exists
if [ ! -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    echo "⚠️ Environment file .env.$ENVIRONMENT not found"
    echo "📝 Using default development configuration"
fi

# Kill any existing central monitoring processes
echo "🔍 Checking for existing processes..."
if pgrep -f "central-monitoring-pro.js" > /dev/null; then
    echo "🛑 Stopping existing central monitoring service..."
    pkill -f "central-monitoring-pro.js" || true
    sleep 2
fi

# Start the new service
echo "🌐 Starting Central Monitoring Service (Production)..."
cd "$PROJECT_DIR"

# Start in background and redirect output to log file
nohup node central-monitoring-pro.js > "$LOG_FILE" 2>&1 &
SERVICE_PID=$!

echo "✅ Central Monitoring Service started!"
echo "📊 PID: $SERVICE_PID"
echo "📝 Log file: $LOG_FILE"
echo ""

# Wait a moment for the service to start
sleep 3

# Check if the service is running
if ps -p $SERVICE_PID > /dev/null; then
    echo "✅ Service is running successfully!"
    echo ""
    echo "🌐 Access Points:"
    echo "  📊 Dashboard: http://localhost:3001/dashboard"
    echo "  📈 API: http://localhost:3001/api"
    echo "  💚 Health: http://localhost:3001/health"
    echo ""
    echo "🔧 Management Commands:"
    echo "  📝 View logs: tail -f $LOG_FILE"
    echo "  🛑 Stop service: kill $SERVICE_PID"
    echo "  📊 Check status: ps -p $SERVICE_PID"
    echo ""
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo "🔑 Generate API Keys: curl -X POST http://localhost:3001/api/generate-key -H 'Content-Type: application/json' -d '{\"pcId\":\"your-pc-name\"}'"
        echo ""
    fi
    
    echo "📝 Follow logs in real-time:"
    echo "tail -f $LOG_FILE"
else
    echo "❌ Service failed to start. Check the log file for errors:"
    echo "cat $LOG_FILE"
    exit 1
fi