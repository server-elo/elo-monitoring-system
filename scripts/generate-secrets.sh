#!/bin/bash

# Generate Secure Secrets for Production Deployment
# Usage: ./generate-secrets.sh

echo "🔐 Generating Secure Secrets for ELO Monitoring"
echo "=============================================="
echo ""

# Generate API Secret Key
API_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32)
echo "🔑 API_SECRET_KEY:"
echo "$API_SECRET"
echo ""

# Generate JWT Secret
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32)
echo "🔑 JWT_SECRET:"
echo "$JWT_SECRET"
echo ""

echo "📝 Use these in your Render environment variables:"
echo "================================================="
echo "API_SECRET_KEY=$API_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
echo "NODE_ENV=production"
echo "API_RATE_LIMIT=100"
echo "SSL_ENABLED=true"
echo "LOG_LEVEL=info"
echo "LOG_FORMAT=json"
echo ""

echo "🎯 Render Setup Steps:"
echo "1. Go to your service in Render dashboard"
echo "2. Click 'Environment' tab"
echo "3. Add the variables shown above"
echo "4. Click 'Save Changes'"
echo "5. Service will auto-redeploy"