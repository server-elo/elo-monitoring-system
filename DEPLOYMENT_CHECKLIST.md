# 🚀 Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup (Supabase)
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project: "solidity-learning-platform"
- [ ] Copy database connection string from Settings → Database
- [ ] Update DATABASE_URL in Vercel environment variables

### 2. OAuth Setup (Optional)
- [ ] GitHub OAuth App: https://github.com/settings/developers
  - Homepage URL: https://your-app.vercel.app
  - Callback URL: https://your-app.vercel.app/api/auth/callback/github
- [ ] Google OAuth: https://console.cloud.google.com
  - Redirect URI: https://your-app.vercel.app/api/auth/callback/google

### 3. Vercel Project Setup
- [ ] Sign up at https://vercel.com with GitHub
- [ ] Import repository from GitHub
- [ ] Configure environment variables (see .env.vercel.template)
- [ ] Deploy project

## Post-Deployment Tasks

### 4. Database Migration
- [ ] Run: npx prisma db push (with production DATABASE_URL)
- [ ] Run: npm run db:seed (optional sample data)

### 5. Testing
- [ ] Test user registration: https://your-app.vercel.app/auth/test
- [ ] Test OAuth providers
- [ ] Test protected routes: https://your-app.vercel.app/admin
- [ ] Test authentication flows

### 6. Custom Domain (Optional)
- [ ] Add custom domain in Vercel dashboard
- [ ] Configure DNS records
- [ ] Update NEXTAUTH_URL environment variable
- [ ] Update OAuth callback URLs

## Environment Variables Checklist

### Required Variables
- [ ] NEXTAUTH_URL (your Vercel app URL)
- [ ] NEXTAUTH_SECRET (32+ character secret)
- [ ] DATABASE_URL (Supabase connection string)

### Optional Variables
- [ ] GITHUB_CLIENT_ID
- [ ] GITHUB_CLIENT_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GEMINI_API_KEY

## Verification Steps
- [ ] App loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes work
- [ ] Database connections work
- [ ] OAuth providers work (if configured)

## Troubleshooting
- Check Vercel function logs for errors
- Verify environment variables are set correctly
- Ensure database is accessible from Vercel
- Check OAuth callback URLs match exactly
- Verify NEXTAUTH_SECRET is properly set

## Support Resources
- Vercel Documentation: https://vercel.com/docs
- NextAuth.js Deployment: https://next-auth.js.org/deployment
- Supabase Documentation: https://supabase.com/docs
- Project Documentation: docs/HOSTING_DEPLOYMENT_GUIDE.md
