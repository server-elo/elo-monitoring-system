# 🚀 Production Database Setup Guide

This guide will help you set up a production-ready PostgreSQL database using Supabase and configure your Solidity Learning Platform for deployment.

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Google account (for OAuth and Gemini API)
- [ ] Basic understanding of environment variables

## 🎯 Step 1: Create Supabase Database

### 1.1 Sign Up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign in with GitHub (recommended)

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `solidity-learning-platform`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (perfect for getting started)
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### 1.3 Get Database Connection String
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you created

## 🔐 Step 2: Set Up Authentication Providers

### 2.1 GitHub OAuth Application
1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `Solidity Learning Platform`
   - **Homepage URL**: `https://your-domain.vercel.app` (or your domain)
   - **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. Copy **Client ID** and generate **Client Secret**

### 2.2 Google OAuth Application
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure consent screen if prompted
6. Choose **Web application**
7. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
8. Copy **Client ID** and **Client Secret**

### 2.3 Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated API key

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Update Local Environment
1. Copy `.env.production.template` to `.env.local`
2. Fill in all the values you collected:

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# AI Services
GEMINI_API_KEY="your_gemini_api_key"

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3.2 Generate NextAuth Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## 🗄️ Step 4: Initialize Database Schema

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Generate Prisma Client
```bash
npm run db:generate
```

### 4.3 Push Schema to Database
```bash
npm run db:push
```

### 4.4 Seed Database (Optional)
```bash
npm run db:seed
```

## ✅ Step 5: Test Local Setup

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test Database Connection
1. Open [http://localhost:3000](http://localhost:3000)
2. Try to sign up/sign in with GitHub or Google
3. Check if user data is saved in Supabase dashboard

### 5.3 Test API Routes
1. Open browser dev tools
2. Navigate to different pages
3. Check for any console errors
4. Test AI chat functionality

## 🚀 Step 6: Prepare for Production Deployment

### 6.1 Build Test
```bash
npm run build
```
Ensure this completes without errors.

### 6.2 Type Check
```bash
npm run type-check
```
Fix any TypeScript errors.

### 6.3 Lint Check
```bash
npm run lint
```
Fix any linting issues.

## 📊 Step 7: Monitor Database Usage

### 7.1 Supabase Dashboard
- Monitor database size (500MB free tier limit)
- Check API requests (2GB bandwidth limit)
- Review authentication usage

### 7.2 Upgrade Path
When you need more resources:
- **Pro Plan**: $25/month (8GB database, 250GB bandwidth)
- **Team Plan**: $599/month (unlimited projects)

## 🔧 Troubleshooting

### Common Issues:
1. **Connection timeout**: Check if your IP is whitelisted in Supabase
2. **Authentication errors**: Verify OAuth callback URLs
3. **Build errors**: Ensure all environment variables are set
4. **API errors**: Check Supabase logs in dashboard

### Getting Help:
- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js Documentation: [https://nextjs.org/docs](https://nextjs.org/docs)
- Project Issues: [GitHub Issues](https://github.com/ezekaj/learning_sol/issues)

## ✨ Next Steps

Once everything is working locally:
1. Deploy to Vercel/Railway/Netlify
2. Set environment variables in deployment platform
3. Update OAuth callback URLs to production domain
4. Test production deployment
5. Monitor performance and usage

---

**🎉 Congratulations!** You now have a production-ready database setup for your Solidity Learning Platform!
