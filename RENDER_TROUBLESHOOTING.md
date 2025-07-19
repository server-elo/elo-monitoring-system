# 🔧 Render Deployment Troubleshooting

## ✅ GitHub Push Complete
Your code is now at: https://github.com/server-elo/elo-monitoring-system

## 🔍 Debug Render "Not Found" Error

### Step 1: Verify Render Service Setup

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Look for your `elo-status` service

2. **Check Service Configuration**
   - **Name**: `elo-status` 
   - **Repository**: `server-elo/elo-monitoring-system`
   - **Branch**: `main`
   - **Build Command**: *(leave empty)*
   - **Start Command**: `node central-monitoring-pro.js`

### Step 2: Common Issues & Fixes

#### Issue 1: Wrong Start Command
**Symptom**: Service fails to start
**Fix**: Set start command to exactly:
```
node central-monitoring-pro.js
```

#### Issue 2: Missing Environment Variables
**Symptom**: Service starts but returns errors
**Fix**: Add these environment variables in Render:
```
NODE_ENV=production
API_SECRET_KEY=your-32-char-secret
JWT_SECRET=your-32-char-secret
API_RATE_LIMIT=100
```

#### Issue 3: Wrong Port Configuration
**Symptom**: "Not Found" or connection refused
**Fix**: Render automatically sets PORT environment variable. Our code uses:
```javascript
const port = parseInt(process.env.PORT) || 3001
```

#### Issue 4: Repository Not Connected
**Symptom**: Render can't find your repo
**Fix**: 
1. Reconnect repository in Render
2. Make sure repository is public
3. Grant Render access to your GitHub account

### Step 3: Quick Deployment Check

#### Manual Deploy Button
1. In Render dashboard → Your service
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Watch the build logs for errors

#### Expected Build Output
```
==> Downloading...
==> Installing dependencies...
==> Build succeeded 🎉
==> Starting server...
```

### Step 4: Test Endpoints After Deploy

Once deployed, test these URLs (replace with your actual URL):

```bash
# Health check (should return JSON)
curl https://your-service.onrender.com/health

# Dashboard (should return HTML)
curl https://your-service.onrender.com/dashboard

# Root page (should return service info)
curl https://your-service.onrender.com/
```

### Step 5: Debug with Logs

1. **Render Logs**
   - Go to your service → Logs tab
   - Look for startup errors

2. **Common Log Errors**
   ```
   Error: Cannot find module
   → Missing dependencies (check package.json)
   
   Error: EADDRINUSE
   → Port conflict (check PORT environment variable)
   
   Error: Permission denied
   → Check file permissions in scripts/
   ```

### Step 6: Alternative Deployment Method

If Render continues to fail, try Railway (also free):

1. **Railway Setup**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Railway Configuration**
   - Automatically detects Node.js
   - Uses `package.json` start script
   - Provides immediate public URL

### Step 7: Local Testing

Before deploying, test locally with production settings:

```bash
# Set production environment
export NODE_ENV=production
export PORT=3001

# Start service
node central-monitoring-pro.js

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/dashboard
```

## 🆘 If Still Not Working

### Quick Fixes

1. **Check Render Status**
   - Go to https://status.render.com
   - Verify no platform issues

2. **Repository Issues**
   - Make repository public temporarily
   - Check if `render.yaml` is in root directory

3. **Manual Verification**
   - Clone your own repository locally
   - Verify all files are present
   - Test `node central-monitoring-pro.js` locally

### Contact Points

- **Render Support**: https://render.com/docs
- **GitHub Repository**: https://github.com/server-elo/elo-monitoring-system
- **Local Testing**: Run locally first to isolate issues

## 📝 Next Steps

1. **Follow this troubleshooting guide step by step**
2. **Share any specific error messages you see**
3. **Test locally first to ensure code works**
4. **Then deploy to Render with correct configuration**

Your ELO monitoring system is ready - just need to get the deployment configuration right!