# Database Setup Guide - Supabase Integration

This guide will help you set up a free PostgreSQL database using Supabase for the Solidity Learning Platform.

## 🚀 Quick Setup with Supabase (Recommended)

### Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### Step 2: Create New Project
1. Click "New Project" in your dashboard
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `solidity-learning-platform`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free (up to 500MB, 2 CPU hours)
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 3: Get Database Connection String
1. In your project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection parameters**
3. Copy the **Connection string** (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the password you created in Step 2

### Step 4: Configure Environment Variables
1. Open your `.env.local` file in the project root
2. Update the `DATABASE_URL` with your Supabase connection string:
   ```bash
   DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"
   ```

### Step 5: Run Database Setup
```bash
# Install dependencies (if not already done)
npm install

# Run the database setup script
npm run setup:db

# Or run manually:
npx prisma generate
npx prisma db push
npm run db:seed
```

## 🧪 Testing the Database Connection

### Test Database Connection
```bash
node scripts/test-database.js
```

### Test Authentication Flow
```bash
npm run dev
```
Then visit: `http://localhost:3000/auth/test`

## 📊 Database Schema Overview

Our Prisma schema includes:

### Core Authentication Tables
- **User** - User accounts with roles and basic info
- **Account** - OAuth account connections (GitHub, Google)
- **Session** - User sessions for NextAuth.js
- **VerificationToken** - Email verification tokens

### User Profile & Progress
- **UserProfile** - Extended user information, XP, level, preferences
- **UserProgress** - Learning progress tracking
- **UserAchievement** - Gamification achievements

### Learning Content
- **Course** - Learning courses
- **Module** - Course modules
- **Lesson** - Individual lessons
- **CodeSubmission** - User code submissions

### Social Features
- **Collaboration** - Real-time collaboration sessions
- **ChatMessage** - Chat messages
- **Mentorship** - Mentor-student relationships

## 🔧 Database Management Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and run migrations (production)
npx prisma migrate dev

# Reset database (⚠️ DESTRUCTIVE)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with sample data
npm run db:seed
```

## 🌱 Database Seeding

The platform includes a comprehensive seed script that creates:

### Sample Users
- **Admin User**: Full platform access
- **Instructor**: Can create courses and grade submissions  
- **Mentor**: Can guide students
- **Student**: Basic learning access

### Sample Content
- **Solidity Fundamentals Course**
- **Smart Contract Development Course**
- **DeFi Development Course**
- **NFT Development Course**

### Sample Data
- User progress records
- Achievements and badges
- Sample code submissions
- Collaboration sessions

## 🔍 Troubleshooting

### Common Issues

#### "Can't reach database server"
- Check your internet connection
- Verify the DATABASE_URL is correct
- Ensure Supabase project is running (check dashboard)
- Try regenerating the connection string

#### "Authentication failed"
- Double-check your database password
- Make sure you replaced `[YOUR-PASSWORD]` in the connection string
- Try resetting your database password in Supabase

#### "SSL connection required"
- Supabase requires SSL connections
- Make sure your connection string includes SSL parameters
- Add `?sslmode=require` to the end if needed

#### "Migration failed"
- Try `npx prisma db push` instead of migrate for development
- Check if tables already exist in Supabase dashboard
- Reset and try again: `npx prisma migrate reset`

### Getting Help

1. Check Supabase dashboard for project status
2. Review Supabase logs in the dashboard
3. Test connection with Prisma Studio: `npx prisma studio`
4. Check our troubleshooting guide: `docs/TROUBLESHOOTING.md`

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Production database (separate from development)
DATABASE_URL="postgresql://postgres:prod-password@db.prod-project.supabase.co:5432/postgres"

# Run migrations (not db push)
npx prisma migrate deploy
```

### Supabase Production Setup
1. Create a separate Supabase project for production
2. Use different database passwords
3. Set up proper backup schedules
4. Configure row-level security (RLS) if needed
5. Monitor usage in Supabase dashboard

## 📈 Monitoring & Maintenance

### Supabase Dashboard Features
- **Database**: View tables, run SQL queries
- **Authentication**: Manage users and auth settings
- **Storage**: File uploads and management
- **Edge Functions**: Serverless functions
- **Logs**: Real-time logs and debugging

### Regular Maintenance
- Monitor database usage (500MB free tier limit)
- Review slow queries in Supabase dashboard
- Backup important data regularly
- Update dependencies and Prisma schema as needed

## 🎯 Next Steps

After database setup:
1. ✅ Test user registration and login
2. ✅ Verify role-based access control
3. ✅ Test course enrollment and progress tracking
4. ✅ Set up OAuth providers (GitHub, Google)
5. ✅ Configure email notifications
6. ✅ Set up monitoring and analytics

Your database is now ready for the Solidity Learning Platform! 🎉
