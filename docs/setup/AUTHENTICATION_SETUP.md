# Authentication System Setup Guide

This guide will help you set up the complete authentication system for the Solidity Learning Platform.

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/solidity_learning_dev"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-characters-long"

# OAuth Providers (Optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database: `createdb solidity_learning_dev`
3. Run migrations: `npx prisma migrate dev`

#### Option B: Cloud Database (Recommended)
1. Sign up for a free PostgreSQL database:
   - **Supabase**: https://supabase.com (Free tier: 500MB)
   - **PlanetScale**: https://planetscale.com (Free tier: 1GB)
   - **Railway**: https://railway.app (Free tier: 512MB)

2. Copy the connection string to your `.env.local`
3. Run migrations: `npx prisma migrate dev`

### 3. OAuth Setup (Optional)

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App:
   - Application name: "Solidity Learning Platform"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env.local`

#### Google OAuth
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID and Client Secret to `.env.local`

## 🔧 Features Included

### ✅ Authentication Methods
- **Email/Password**: Traditional signup and login
- **GitHub OAuth**: Sign in with GitHub account
- **Google OAuth**: Sign in with Google account
- **MetaMask**: Web3 wallet authentication (coming soon)

### ✅ Security Features
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Zod schema validation
- **CSRF Protection**: Built-in NextAuth.js protection
- **Session Management**: JWT tokens with secure defaults

### ✅ User Experience
- **Responsive Design**: Works on all devices
- **Real-time Validation**: Instant feedback on forms
- **Password Strength**: Visual strength indicator
- **Error Handling**: User-friendly error messages
- **Loading States**: Smooth loading indicators

### ✅ Developer Experience
- **TypeScript**: Full type safety
- **React Hook Form**: Efficient form handling
- **Framer Motion**: Smooth animations
- **Protected Routes**: Easy route protection
- **Permission System**: Role-based access control

## 🎯 Usage Examples

### Basic Authentication
```tsx
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <button onClick={() => login()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### Protected Routes
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </ProtectedRoute>
  );
}
```

### Permission Checking
```tsx
import { usePermissions } from '@/lib/hooks/useAuth';

function FeatureComponent() {
  const { hasPermission } = usePermissions();

  if (!hasPermission('write:lessons')) {
    return <p>You don't have permission to create lessons.</p>;
  }

  return <CreateLessonForm />;
}
```

## 🔐 User Roles & Permissions

### Student (Default)
- View lessons and courses
- Submit code and track progress
- Participate in collaborations
- Earn achievements

### Mentor
- All student permissions
- View student progress
- Provide mentorship
- Access collaboration tools

### Instructor
- All mentor permissions
- Create and edit lessons
- Grade submissions
- Access analytics dashboard

### Admin
- All permissions
- Manage users and roles
- System configuration
- Full platform access

## 🚨 Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Strong Secrets**: Use long, random strings for `NEXTAUTH_SECRET`
3. **HTTPS in Production**: Always use HTTPS in production
4. **Database Security**: Use connection pooling and read replicas
5. **Rate Limiting**: Monitor and adjust rate limits as needed
6. **Regular Updates**: Keep dependencies updated

## 🐛 Troubleshooting

### Common Issues

#### "Can't reach database server"
- Check your `DATABASE_URL` is correct
- Ensure your database server is running
- Verify network connectivity

#### "Invalid client credentials"
- Double-check OAuth client IDs and secrets
- Ensure callback URLs match exactly
- Verify OAuth app is enabled

#### "Session not found"
- Clear browser cookies and localStorage
- Check `NEXTAUTH_SECRET` is set
- Restart the development server

#### "Permission denied"
- Check user role assignments in database
- Verify permission logic in components
- Review protected route configuration

### Getting Help

1. Check the [NextAuth.js documentation](https://next-auth.js.org/)
2. Review [Prisma documentation](https://www.prisma.io/docs/)
3. Search existing GitHub issues
4. Create a new issue with detailed error information

## 🚀 Deployment

### Environment Variables for Production
```bash
# Update these for production
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret-key"

# OAuth callback URLs should use your production domain
# GitHub: https://yourdomain.com/api/auth/callback/github
# Google: https://yourdomain.com/api/auth/callback/google
```

### Database Migration
```bash
# Run this in production to apply database changes
npx prisma migrate deploy
```

## 📝 Next Steps

1. **Test the authentication flow** with different providers
2. **Customize the UI** to match your brand
3. **Add email verification** for enhanced security
4. **Implement password reset** functionality
5. **Add two-factor authentication** for admin accounts
6. **Set up monitoring** and error tracking
7. **Configure backup** and disaster recovery

The authentication system is now ready for production use! 🎉
