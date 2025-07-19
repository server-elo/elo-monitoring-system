#!/bin/bash

# Ngrok Tunnel Setup Script for Remote Monitoring Access
# Usage: ./setup-ngrok.sh [port] [subdomain]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

PORT=${1:-3001}
SUBDOMAIN=${2:-""}
CONFIG_FILE="$PROJECT_DIR/.ngrok.conf"
LOG_FILE="$PROJECT_DIR/ngrok.log"

echo "🌐 Setting up Ngrok Tunnel for Remote Access"
echo "============================================="
echo "📊 Port: $PORT"
echo "🏷️ Subdomain: ${SUBDOMAIN:-'auto-generated'}"
echo "📝 Config: $CONFIG_FILE"
echo "📋 Log: $LOG_FILE"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Ngrok not found. Installing..."
    
    # Try to install ngrok
    if command -v npm &> /dev/null; then
        echo "📦 Installing ngrok via npm..."
        npm install -g ngrok
    elif command -v curl &> /dev/null; then
        echo "📦 Downloading ngrok binary..."
        cd /tmp
        curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip -o ngrok.zip
        unzip -q ngrok.zip
        sudo mv ngrok /usr/local/bin/
        rm ngrok.zip
        cd - > /dev/null
    else
        echo "❌ Cannot install ngrok automatically. Please install manually:"
        echo "   npm install -g ngrok"
        echo "   OR download from: https://ngrok.com/download"
        exit 1
    fi
fi

# Check if ngrok is now available
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok installation failed. Please install manually."
    exit 1
fi

echo "✅ Ngrok found: $(which ngrok)"

# Create ngrok configuration
echo "📝 Creating ngrok configuration..."
cat > "$CONFIG_FILE" << EOF
version: "2"
authtoken: ${NGROK_AUTHTOKEN:-""}

tunnels:
  monitoring:
    proto: http
    addr: $PORT
    bind_tls: true
    inspect: true
    host_header: "localhost:$PORT"
    schemes:
      - https
      - http
    web_addr: localhost:4040
EOF

# Add subdomain if provided
if [ -n "$SUBDOMAIN" ]; then
    echo "    subdomain: $SUBDOMAIN" >> "$CONFIG_FILE"
fi

echo "✅ Configuration created at $CONFIG_FILE"

# Function to start ngrok tunnel
start_tunnel() {
    echo "🚀 Starting ngrok tunnel..."
    
    # Kill existing ngrok processes
    pkill ngrok 2>/dev/null || true
    sleep 2
    
    # Start ngrok with configuration
    if [ -n "$SUBDOMAIN" ]; then
        nohup ngrok start monitoring --config="$CONFIG_FILE" > "$LOG_FILE" 2>&1 &
    else
        nohup ngrok http $PORT --config="$CONFIG_FILE" > "$LOG_FILE" 2>&1 &
    fi
    
    NGROK_PID=$!
    echo "📊 Ngrok PID: $NGROK_PID"
    
    # Wait for ngrok to start
    echo "⏳ Waiting for ngrok to initialize..."
    sleep 5
    
    # Get the public URL
    if command -v curl &> /dev/null; then
        PUBLIC_URL=$(curl -s localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
        if [ -n "$PUBLIC_URL" ]; then
            echo "✅ Ngrok tunnel active!"
            echo "🌐 Public URL: $PUBLIC_URL"
            echo "📊 Dashboard: http://localhost:4040"
            echo ""
            
            # Update environment configuration
            echo "📝 Updating environment configuration..."
            ENV_FILE="$PROJECT_DIR/.env.development"
            if [ -f "$ENV_FILE" ]; then
                # Update CENTRAL_SERVICE_URL
                if grep -q "CENTRAL_SERVICE_URL=" "$ENV_FILE"; then
                    sed -i "s|CENTRAL_SERVICE_URL=.*|CENTRAL_SERVICE_URL=$PUBLIC_URL|" "$ENV_FILE"
                else
                    echo "CENTRAL_SERVICE_URL=$PUBLIC_URL" >> "$ENV_FILE"
                fi
                
                # Update NGROK_ENABLED
                if grep -q "NGROK_ENABLED=" "$ENV_FILE"; then
                    sed -i "s|NGROK_ENABLED=.*|NGROK_ENABLED=true|" "$ENV_FILE"
                else
                    echo "NGROK_ENABLED=true" >> "$ENV_FILE"
                fi
                
                echo "✅ Environment updated with ngrok URL"
            fi
            
            # Create connection info file for PCs
            cat > "$PROJECT_DIR/remote-connection.json" << EOF
{
  "centralServiceUrl": "$PUBLIC_URL",
  "ngrokEnabled": true,
  "publicUrl": "$PUBLIC_URL",
  "dashboardUrl": "$PUBLIC_URL/dashboard",
  "apiUrl": "$PUBLIC_URL/api",
  "healthUrl": "$PUBLIC_URL/health",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "instructions": {
    "forRemotePCs": "Use the centralServiceUrl in your PC monitoring configuration",
    "apiKeyGeneration": "POST $PUBLIC_URL/api/generate-key with {\\\"pcId\\\": \\\"your-pc-name\\\"}",
    "testConnection": "curl $PUBLIC_URL/health"
  }
}
EOF
            
            echo ""
            echo "🎯 Remote Access Information:"
            echo "  🌐 Central Service: $PUBLIC_URL"
            echo "  📊 Dashboard: $PUBLIC_URL/dashboard"
            echo "  📈 API: $PUBLIC_URL/api"
            echo "  💚 Health Check: $PUBLIC_URL/health"
            echo ""
            echo "📝 Connection info saved to: remote-connection.json"
            echo ""
            echo "🔧 For Remote PCs:"
            echo "  1. Copy remote-connection.json to remote PC"
            echo "  2. Generate API key: curl -X POST $PUBLIC_URL/api/generate-key -H 'Content-Type: application/json' -d '{\"pcId\":\"remote-pc-name\"}'"
            echo "  3. Update PC monitoring to use: $PUBLIC_URL"
            echo ""
            echo "🛑 To stop ngrok: kill $NGROK_PID"
            echo "📝 View logs: tail -f $LOG_FILE"
            
        else
            echo "❌ Could not retrieve ngrok public URL"
            echo "📝 Check logs: cat $LOG_FILE"
            echo "📊 Visit http://localhost:4040 for ngrok dashboard"
        fi
    else
        echo "⚠️ curl not found. Please check http://localhost:4040 for ngrok status"
        echo "📊 Ngrok dashboard: http://localhost:4040"
    fi
}

# Check if ngrok authtoken is configured
if [ -z "$NGROK_AUTHTOKEN" ] && ! ngrok authtoken 2>/dev/null | grep -q "Authtoken saved"; then
    echo "⚠️ Ngrok authtoken not configured"
    echo "📝 To use custom subdomains and avoid limits:"
    echo "   1. Sign up at https://ngrok.com"
    echo "   2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   3. Set it: export NGROK_AUTHTOKEN=your_token_here"
    echo "   4. Or run: ngrok authtoken your_token_here"
    echo ""
    echo "⚡ Proceeding with free tier (random subdomain, 2 hour limit)..."
    echo ""
fi

# Start the tunnel
start_tunnel