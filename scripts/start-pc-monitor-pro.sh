#!/bin/bash

# Production PC Monitoring Service Startup Script
# Usage: ./start-pc-monitor-pro.sh [central_url] [port]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/pc-monitoring-pro.log"

# Configuration
CENTRAL_URL=${1:-"http://localhost:3001"}
PC_PORT=${2:-3002}
ENVIRONMENT=${NODE_ENV:-development}

echo "🚀 Starting PC Monitoring Service (Production)"
echo "=============================================="
echo "📁 Project Directory: $PROJECT_DIR"
echo "🌐 Central Service: $CENTRAL_URL"
echo "🚪 PC Monitor Port: $PC_PORT"
echo "🌍 Environment: $ENVIRONMENT"
echo "📝 Log File: $LOG_FILE"
echo ""

# Export environment variables
export CENTRAL_SERVICE_URL="$CENTRAL_URL"
export PC_MONITOR_PORT="$PC_PORT"
export NODE_ENV="$ENVIRONMENT"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Kill any existing PC monitoring processes
echo "🔍 Checking for existing PC monitoring processes..."
if pgrep -f "monitoring-service" > /dev/null; then
    echo "🛑 Stopping existing monitoring services..."
    pkill -f "monitoring-service" || true
    sleep 2
fi

# Start the new service
echo "💻 Starting PC Monitoring Service (Production)..."
cd "$PROJECT_DIR"

# Start in background and redirect output to log file
nohup node monitoring-service-pro.js > "$LOG_FILE" 2>&1 &
SERVICE_PID=$!

echo "✅ PC Monitoring Service started!"
echo "📊 PID: $SERVICE_PID"
echo "📝 Log file: $LOG_FILE"
echo ""

# Wait a moment for the service to start
sleep 3

# Check if the service is running
if ps -p $SERVICE_PID > /dev/null; then
    echo "✅ Service is running successfully!"
    echo ""
    echo "💻 PC Monitor Access Points:"
    echo "  📊 Dashboard: http://localhost:$PC_PORT/dashboard"
    echo "  📈 Metrics: http://localhost:$PC_PORT/metrics"
    echo "  💚 Health: http://localhost:$PC_PORT/health"
    echo ""
    echo "🌐 Central Service Integration:"
    echo "  🔗 Central URL: $CENTRAL_URL"
    echo "  🔑 API Key: Auto-generated on first connection"
    echo ""
    echo "🔧 Management Commands:"
    echo "  📝 View logs: tail -f $LOG_FILE"
    echo "  🛑 Stop service: kill $SERVICE_PID"
    echo "  📊 Check status: ps -p $SERVICE_PID"
    echo ""
    
    # Test local connection
    echo "📝 Testing local connection..."
    if curl -s http://localhost:$PC_PORT/health > /dev/null; then
        echo "✅ Local PC monitoring endpoint is accessible"
    else
        echo "⚠️ Local PC monitoring endpoint test failed"
    fi
    
    # Test central service connection
    echo "📝 Testing central service connection..."
    if curl -s "$CENTRAL_URL/health" > /dev/null; then
        echo "✅ Central service is accessible"
        echo "🔑 API key will be auto-generated on first report"
    else
        echo "⚠️ Central service connection failed"
        echo "   Make sure central service is running at: $CENTRAL_URL"
    fi
    
    echo ""
    echo "📝 Follow logs in real-time:"
    echo "tail -f $LOG_FILE"
else
    echo "❌ Service failed to start. Check the log file for errors:"
    echo "cat $LOG_FILE"
    exit 1
fi