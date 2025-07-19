# 🚀 Production Deployment Guide

This comprehensive guide will help you deploy your Solidity Learning Platform to production with a reliable database backend.

## 📋 Prerequisites Checklist

Before deploying to production, ensure you have completed:

- [ ] ✅ Database setup (Supabase recommended)
- [ ] ✅ Environment variables configured
- [ ] ✅ OAuth applications created (GitHub, Google)
- [ ] ✅ Gemini API key obtained
- [ ] ✅ Build process working locally
- [ ] ✅ All TypeScript errors resolved

## 🎯 Quick Start Commands

```bash
# 1. Set up environment variables
npm run setup:env

# 2. Validate configuration
npm run validate:env

# 3. Set up database
npm run setup:db

# 4. Test everything
npm run test:db

# 5. Build for production
npm run build
```

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click "New Project"
4. Fill in details:
   - **Name**: `solidity-learning-platform`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
5. Wait for project creation (2-3 minutes)

### Step 2: Get Connection String

1. Go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy the **URI** format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

## 🔐 Authentication Setup

### GitHub OAuth

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/applications/new)
2. Create new OAuth App:
   - **Application name**: `Solidity Learning Platform`
   - **Homepage URL**: `https://your-domain.vercel.app`
   - **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`
3. Copy **Client ID** and **Client Secret**

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure consent screen if prompted
6. Choose **Web application**
7. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
8. Copy **Client ID** and **Client Secret**

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated API key

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

**Why Vercel:**
- ✅ Built for Next.js
- ✅ Automatic deployments
- ✅ Edge functions
- ✅ Free tier available

**Setup:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to link project
4. Set environment variables in Vercel dashboard
5. Deploy: `vercel --prod`

**Environment Variables in Vercel:**
```bash
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-app.vercel.app
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

### Option 2: Railway

**Why Railway:**
- ✅ Simple deployment
- ✅ Built-in database options
- ✅ Automatic HTTPS
- ✅ Git-based deployments

**Setup:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Run: `railway login`
3. Run: `railway init`
4. Set environment variables: `railway variables set KEY=value`
5. Deploy: `railway up`

### Option 3: Netlify

**Setup:**
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Enable Next.js runtime

## 🔧 Environment Variables Reference

### Required Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="https://your-production-domain.com"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"
```

### Optional Variables

```env
# Redis (for enhanced performance)
REDIS_URL="redis://default:password@host:port"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

## 🧪 Testing Before Deployment

### Local Testing

```bash
# Test environment configuration
npm run validate:env

# Test database connection
npm run test:db

# Test build process
npm run build

# Test production build locally
npm run start
```

### Pre-deployment Checklist

- [ ] All environment variables set
- [ ] Database connection working
- [ ] OAuth applications configured with production URLs
- [ ] Build process completes without errors
- [ ] No TypeScript errors
- [ ] API routes responding correctly

## 🔄 Deployment Workflow

### 1. Initial Deployment

```bash
# 1. Ensure everything works locally
npm run test:db

# 2. Build for production
npm run build

# 3. Deploy to chosen platform
# Vercel: vercel --prod
# Railway: railway up
# Netlify: git push (auto-deploy)
```

### 2. Update OAuth URLs

After deployment, update OAuth callback URLs:

**GitHub:**
- Update callback URL to: `https://your-domain.com/api/auth/callback/github`

**Google:**
- Update redirect URI to: `https://your-domain.com/api/auth/callback/google`

### 3. Test Production Deployment

1. Visit your production URL
2. Test user registration/login
3. Test AI chat functionality
4. Test code compilation
5. Check database operations

## 🚨 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Fix TypeScript errors
npm run fix:ts

# Clean and rebuild
npm run clean && npm run build
```

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check Supabase project status
- Ensure IP whitelist includes deployment platform

**Authentication Issues:**
- Verify OAuth callback URLs
- Check NEXTAUTH_SECRET length (min 32 chars)
- Ensure NEXTAUTH_URL matches production domain

**API Route Errors:**
- Check environment variables in deployment platform
- Verify database schema is up to date
- Check deployment logs for specific errors

### Getting Help

- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Vercel**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Project Issues**: [GitHub Issues](https://github.com/ezekaj/learning_sol/issues)

## 🎉 Success!

Once deployed successfully, your Solidity Learning Platform will be live with:

- ✅ Production database with user data persistence
- ✅ OAuth authentication with GitHub and Google
- ✅ AI-powered tutoring with Google Gemini
- ✅ Real-time collaboration features
- ✅ Code compilation and testing
- ✅ Gamification and progress tracking

**Next Steps:**
1. Monitor application performance
2. Set up error tracking (Sentry)
3. Configure analytics (Google Analytics)
4. Plan feature updates and improvements

## 📊 Deployment Checklist Script

Run this final checklist before deploying:

```bash
npm run deployment:checklist
```

This script will verify:
- ✅ Environment variables
- ✅ Database connection
- ✅ Build process
- ✅ TypeScript errors
- ✅ OAuth configuration
- ✅ API endpoints

---

**🎯 Your production-ready Solidity Learning Platform is now live!**
