#!/bin/bash

# Connect PC to Cloud Monitoring Service
# Usage: ./connect-to-cloud.sh [cloud-url] [pc-name]

set -e

CLOUD_URL=${1:-"https://elo-status.onrender.com"}
PC_NAME=${2:-"$(whoami)@$(hostname)"}

echo "🌐 Connecting PC to Cloud Monitoring"
echo "===================================="
echo "☁️ Cloud URL: $CLOUD_URL"
echo "💻 PC Name: $PC_NAME"
echo ""

# Test cloud service connectivity
echo "📡 Testing cloud service connectivity..."
if curl -s "$CLOUD_URL/health" > /dev/null; then
    echo "✅ Cloud service is accessible"
else
    echo "❌ Cannot reach cloud service at $CLOUD_URL"
    echo "   Please check the URL and your internet connection"
    exit 1
fi

# Generate API key for this PC
echo "🔑 Generating API key for PC..."
API_RESPONSE=$(curl -s -X POST "$CLOUD_URL/api/generate-key" \
    -H 'Content-Type: application/json' \
    -d "{\"pcId\":\"$PC_NAME\"}")

if echo "$API_RESPONSE" | grep -q "apiKey"; then
    API_KEY=$(echo "$API_RESPONSE" | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)
    echo "✅ API key generated successfully"
    
    # Save API key
    echo "$API_KEY" > .pc-api-key
    chmod 600 .pc-api-key
    echo "💾 API key saved to .pc-api-key"
else
    echo "❌ Failed to generate API key"
    echo "Response: $API_RESPONSE"
    exit 1
fi

# Stop any existing monitoring service
echo "🛑 Stopping existing monitoring services..."
pkill -f "monitoring-service" 2>/dev/null || true
sleep 2

# Start PC monitoring with cloud URL
echo "🚀 Starting PC monitoring connected to cloud..."
export CENTRAL_SERVICE_URL="$CLOUD_URL"
export API_KEY="$API_KEY"

# Start monitoring service
./scripts/start-pc-monitor-pro.sh "$CLOUD_URL"

echo ""
echo "🎉 PC Successfully Connected to Cloud!"
echo "======================================"
echo "☁️ Cloud Dashboard: $CLOUD_URL/dashboard"
echo "💻 PC Dashboard: http://localhost:3002/dashboard"
echo "🔑 API Key: ✅ Configured"
echo ""
echo "📊 Your PC will now report to the cloud monitoring system."
echo "   Both users can view status at: $CLOUD_URL/dashboard"