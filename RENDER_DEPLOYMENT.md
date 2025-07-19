# 🚀 Deploy ELO Monitoring to Render (FREE)

## 📋 Prerequisites

1. **GitHub Account** - Repository hosting
2. **Render Account** - Free hosting (render.com)
3. **10 minutes** - Total setup time

## 🎯 Step 1: GitHub Repository Setup

### 1.1 Create GitHub Repository
1. Go to GitHub.com
2. Create new repository: `elo-monitoring-system`
3. Make it public (required for free Render)
4. Don't initialize with README (we have one)

### 1.2 Push Local Repository
```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/elo-monitoring-system.git

# Push to GitHub
git push -u origin main
```

## 🌐 Step 2: Render Deployment

### 2.1 Connect Repository
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Click "New +" → "Web Service"
4. Connect your `elo-monitoring-system` repository

### 2.2 Configure Service
**Service Settings:**
- **Name**: `elo-status`
- **Region**: Oregon (closest to US West)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: *(leave empty)*
- **Start Command**: `node central-monitoring-pro.js`

### 2.3 Environment Variables
Add these in Render dashboard:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `API_SECRET_KEY` | `[Generate random 32 chars]` |
| `JWT_SECRET` | `[Generate random 32 chars]` |
| `API_RATE_LIMIT` | `100` |
| `SSL_ENABLED` | `true` |
| `LOG_LEVEL` | `info` |
| `LOG_FORMAT` | `json` |

**Auto-generate secrets:**
```bash
# Use these commands to generate secure secrets
openssl rand -hex 32    # For API_SECRET_KEY
openssl rand -hex 32    # For JWT_SECRET
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Wait 2-3 minutes for deployment
3. Your service will be available at: `https://elo-status.onrender.com`

## ✅ Step 3: Verify Deployment

### 3.1 Test Endpoints
```bash
# Health check
curl https://elo-status.onrender.com/health

# Dashboard (open in browser)
https://elo-status.onrender.com/dashboard
```

### 3.2 Expected Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "version": "2.0.0"
}
```

## 🖥️ Step 4: Connect Your PCs

### 4.1 Update PC Configuration
On each PC you want to monitor:

```bash
# Set the Render URL as central service
export CENTRAL_SERVICE_URL="https://elo-status.onrender.com"

# Start PC monitoring
./scripts/start-pc-monitor-pro.sh "https://elo-status.onrender.com"
```

### 4.2 Generate API Keys
For each PC, generate an API key:

```bash
curl -X POST https://elo-status.onrender.com/api/generate-key \
  -H 'Content-Type: application/json' \
  -d '{"pcId":"pc-1-name"}'
```

Save the returned API key - it will be used automatically by the PC monitoring service.

## 📊 Step 5: Access Your Monitoring

### 5.1 URLs
- **Central Dashboard**: https://elo-status.onrender.com/dashboard
- **API**: https://elo-status.onrender.com/api
- **Health**: https://elo-status.onrender.com/health
- **PC Status**: https://elo-status.onrender.com/api/pcs

### 5.2 Both Users Can Access
- Share the URL with your collaborator
- Both can access the same dashboard
- Real-time updates for all PCs
- No authentication needed for viewing

## 🔧 Management Commands

### View Logs
```bash
# In Render dashboard, go to your service → Logs
```

### Restart Service
```bash
# In Render dashboard, go to your service → Settings → Restart
```

### Update Environment Variables
```bash
# In Render dashboard, go to your service → Environment
```

## 🆓 Render Free Tier Details

### ✅ What's Included (FREE)
- **Always-on service** (no sleep)
- **Custom subdomain**: elo-status.onrender.com
- **SSL certificate** (HTTPS)
- **750 hours/month** (essentially unlimited)
- **Global CDN**
- **Automatic deployments**

### ⚠️ Limitations
- **Public repository required**
- **Slower cold starts** (~30 seconds after inactivity)
- **Limited bandwidth** (100GB/month)
- **No custom domains** (upgrade needed)

## 🎯 Next Steps

### For Production Use
1. **Custom Domain**: Upgrade to add `status.elo.com`
2. **Private Repository**: Upgrade for private repos
3. **Monitoring**: Set up external uptime monitoring

### For Development
1. **Auto-deploy**: Push to GitHub → Auto-deploy to Render
2. **Environment**: Use `.env.render` for Render-specific config
3. **Scaling**: Monitor resource usage in dashboard

## 🆘 Troubleshooting

### Service Won't Start
1. Check logs in Render dashboard
2. Verify start command: `node central-monitoring-pro.js`
3. Ensure all environment variables are set

### PCs Can't Connect
1. Verify CENTRAL_SERVICE_URL is correct
2. Check if API key generation works
3. Test health endpoint manually

### Dashboard Not Loading
1. Check if service is running
2. Verify SSL certificate is active
3. Try incognito mode to bypass cache

---

## 🎉 Success!

You now have a **FREE**, production-ready monitoring system at:
**https://elo-status.onrender.com**

Both users can access it from anywhere, and all PCs will automatically connect and report their status in real-time.