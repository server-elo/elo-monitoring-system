#!/bin/bash

# Heroku Deployment Script for Enterprise Monitoring System
# Usage: ./deploy-heroku.sh [app-name]

set -e

APP_NAME=${1:-""}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Enterprise Monitoring System to Heroku"
echo "=================================================="
echo "📁 Project Directory: $PROJECT_DIR"
echo ""

cd "$PROJECT_DIR"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please log in to Heroku first:"
    heroku login
fi

# Create Heroku app if name is provided, otherwise use existing
if [ -n "$APP_NAME" ]; then
    echo "📱 Creating Heroku app: $APP_NAME"
    if heroku create "$APP_NAME" 2>/dev/null; then
        echo "✅ Heroku app created: $APP_NAME"
    else
        echo "⚠️ App might already exist or name is taken. Continuing..."
    fi
    
    # Set git remote
    heroku git:remote -a "$APP_NAME"
else
    echo "⚠️ No app name provided. Make sure you have a Heroku remote configured."
    echo "   Run: heroku git:remote -a your-app-name"
fi

# Set environment variables
echo "🔧 Setting environment variables..."
heroku config:set NODE_ENV=production
heroku config:set API_SECRET_KEY="$(openssl rand -hex 32)" 2>/dev/null || heroku config:set API_SECRET_KEY="$(date +%s | sha256sum | base64 | head -c 32)"
heroku config:set JWT_SECRET="$(openssl rand -hex 32)" 2>/dev/null || heroku config:set JWT_SECRET="$(date +%s | sha256sum | base64 | head -c 32)"
heroku config:set API_RATE_LIMIT=100
heroku config:set SSL_ENABLED=true
heroku config:set LOG_LEVEL=info
heroku config:set LOG_FORMAT=json

# Get app URL and set CORS
APP_URL=$(heroku info --json | grep -o '"web_url":"[^"]*' | cut -d'"' -f4 | sed 's|/$||')
if [ -n "$APP_URL" ]; then
    heroku config:set CORS_ORIGINS="$APP_URL"
    heroku config:set CENTRAL_SERVICE_URL="$APP_URL"
    echo "🌐 App URL: $APP_URL"
fi

# Prepare for deployment
echo "📦 Preparing deployment..."

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    cat > .gitignore << EOF
node_modules/
*.log
.env.*
!.env.example
.pc-api-key
.ngrok.conf
ngrok-output.log
ngrok-url.txt
remote-connection.json
EOF
fi

# Initialize git if needed
if [ ! -d .git ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Enterprise Monitoring System"
fi

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
if git push heroku main 2>/dev/null || git push heroku master 2>/dev/null; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed. Check the logs:"
    heroku logs --tail
    exit 1
fi

# Open the app
echo ""
echo "🎉 Deployment Complete!"
echo "========================"

if [ -n "$APP_URL" ]; then
    echo "🌐 Your monitoring system is live at: $APP_URL"
    echo "📊 Dashboard: $APP_URL/dashboard"
    echo "📈 API: $APP_URL/api"
    echo "💚 Health: $APP_URL/health"
    echo ""
    echo "🔑 To connect PCs to this central service:"
    echo "   export CENTRAL_SERVICE_URL=\"$APP_URL\""
    echo "   ./scripts/start-pc-monitor-pro.sh \"$APP_URL\""
    echo ""
    echo "📱 Generate API key for PC:"
    echo "   curl -X POST $APP_URL/api/generate-key -H 'Content-Type: application/json' -d '{\"pcId\":\"your-pc-name\"}'"
fi

echo ""
echo "🔧 Useful Heroku commands:"
echo "   heroku logs --tail              # View live logs"
echo "   heroku config                   # View environment variables"
echo "   heroku ps                       # View running dynos"
echo "   heroku restart                  # Restart the app"
echo "   heroku open                     # Open the app in browser"

# Optionally open the app
read -p "🌐 Open the app in your browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    heroku open
fi