#!/bin/bash

# Simple Ngrok Tunnel Starter
PORT=${1:-3001}

echo "🌐 Starting ngrok tunnel for port $PORT..."

# Kill existing ngrok
pkill ngrok 2>/dev/null || true
sleep 1

# Start ngrok in background
nohup ngrok http $PORT > ngrok-output.log 2>&1 &
NGROK_PID=$!

echo "📊 Ngrok started with PID: $NGROK_PID"
echo "⏳ Waiting 10 seconds for tunnel to establish..."
sleep 10

# Try to get the public URL
echo "🔍 Getting public URL..."
PUBLIC_URL=""

# Try multiple times to get the URL
for i in {1..5}; do
    if command -v curl &> /dev/null; then
        PUBLIC_URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
        if [ -n "$PUBLIC_URL" ]; then
            break
        fi
    fi
    echo "⏳ Attempt $i/5 - waiting for ngrok API..."
    sleep 3
done

if [ -n "$PUBLIC_URL" ]; then
    echo "✅ Ngrok tunnel established!"
    echo "🌐 Public URL: $PUBLIC_URL"
    echo "📊 Dashboard: http://localhost:4040"
    echo ""
    echo "🔧 Remote monitoring access:"
    echo "  Dashboard: $PUBLIC_URL/dashboard"
    echo "  API: $PUBLIC_URL/api"
    echo "  Health: $PUBLIC_URL/health"
    echo ""
    echo "🛑 To stop: kill $NGROK_PID"
    
    # Save the URL for other scripts
    echo "$PUBLIC_URL" > ngrok-url.txt
    
    echo ""
    echo "📝 Testing connection..."
    if curl -s "$PUBLIC_URL/health" > /dev/null; then
        echo "✅ Remote connection test successful!"
    else
        echo "⚠️ Remote connection test failed - service may still be starting"
    fi
    
else
    echo "❌ Could not get ngrok public URL"
    echo "📊 Check ngrok dashboard: http://localhost:4040"
    echo "📝 Check logs: cat ngrok-output.log"
fi