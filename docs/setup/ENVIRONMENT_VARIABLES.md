# Environment Variables Reference

This document provides detailed explanations for all environment variables used in the Solidity Learning Platform.

## 📋 Variable Categories

- [Application Configuration](#application-configuration)
- [Database Configuration](#database-configuration)
- [Authentication & OAuth](#authentication--oauth)
- [AI Integration](#ai-integration)
- [Real-time Collaboration](#real-time-collaboration)
- [File Storage](#file-storage)
- [Caching & Performance](#caching--performance)
- [PWA & Service Worker](#pwa--service-worker)
- [Accessibility](#accessibility)
- [Monitoring & Analytics](#monitoring--analytics)
- [Security & Rate Limiting](#security--rate-limiting)
- [Feature Flags](#feature-flags)
- [Development & Testing](#development--testing)

## 🔧 Application Configuration

### Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | `development` | Environment mode (`development`, `production`, `test`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | Base URL for the application |
| `NEXT_PUBLIC_APP_NAME` | ❌ | `"Solidity Learning Platform"` | Application display name |
| `NEXT_PUBLIC_APP_VERSION` | ❌ | `1.0.0` | Application version number |

**Example:**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://solidity-learn.vercel.app
NEXT_PUBLIC_APP_NAME="Solidity Learning Platform"
NEXT_PUBLIC_APP_VERSION=1.2.0
```

## 🗄️ Database Configuration

### PostgreSQL Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string with SSL |
| `DIRECT_URL` | ❌ | Direct database connection (for migrations) |
| `DATABASE_POOL_MIN` | ❌ | Minimum connection pool size (default: 2) |
| `DATABASE_POOL_MAX` | ❌ | Maximum connection pool size (default: 10) |
| `DATABASE_POOL_TIMEOUT` | ❌ | Connection timeout in ms (default: 30000) |

**Format Examples:**
```bash
# Local development
DATABASE_URL="postgresql://username:password@localhost:5432/solidity_learning_dev"

# Production (with SSL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true&connection_limit=1"

# PlanetScale (MySQL)
DATABASE_URL="mysql://[username]:[password]@[host]/[database]?sslaccept=strict"
```

### Redis Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | ❌ | Redis connection string |
| `REDIS_PASSWORD` | ❌ | Redis password (if required) |
| `REDIS_DB` | ❌ | Redis database number (default: 0) |

**Examples:**
```bash
# Local Redis
REDIS_URL="redis://localhost:6379"

# Upstash Redis
REDIS_URL="redis://:[password]@[host]:[port]"

# Redis with auth
REDIS_URL="redis://username:password@host:port/db"
```

## 🔐 Authentication & OAuth

### NextAuth.js Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | ✅ | Canonical URL of your site |
| `NEXTAUTH_SECRET` | ✅ | Secret for JWT encryption (min 32 chars) |
| `SESSION_TIMEOUT` | ❌ | Session timeout in seconds (default: 86400) |
| `SESSION_UPDATE_AGE` | ❌ | Session update frequency (default: 3600) |

**Generate Secret:**
```bash
# Generate secure secret
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### OAuth Providers

#### Google OAuth
| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth Client Secret |

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://your-domain.com/api/auth/callback/google`

#### GitHub OAuth
| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth App Client Secret |

**Setup Instructions:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### Discord OAuth (Optional)
| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_CLIENT_ID` | ❌ | Discord Application Client ID |
| `DISCORD_CLIENT_SECRET` | ❌ | Discord Application Client Secret |

## 🤖 AI Integration

### Google Gemini API

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Google Gemini Pro API key |
| `GOOGLE_AI_MODEL` | ❌ | Model name (default: "gemini-pro") |
| `GOOGLE_AI_TEMPERATURE` | ❌ | Response creativity (0-1, default: 0.7) |
| `GOOGLE_AI_MAX_TOKENS` | ❌ | Max response tokens (default: 2048) |

**Get API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy key to environment variable

### OpenAI API (Alternative)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ❌ | OpenAI API key |
| `OPENAI_MODEL` | ❌ | Model name (default: "gpt-4") |
| `OPENAI_MAX_TOKENS` | ❌ | Max response tokens (default: 2048) |
| `OPENAI_TEMPERATURE` | ❌ | Response creativity (0-1, default: 0.7) |

### AI Rate Limiting

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_REQUESTS_PER_MINUTE` | ❌ | AI requests per minute limit (default: 60) |
| `AI_REQUESTS_PER_HOUR` | ❌ | AI requests per hour limit (default: 1000) |
| `AI_REQUESTS_PER_DAY` | ❌ | AI requests per day limit (default: 10000) |

## 🔄 Real-time Collaboration

### Socket.io Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SOCKET_IO_PORT` | ❌ | Socket.io server port (default: 3001) |
| `SOCKET_IO_CORS_ORIGINS` | ❌ | Allowed CORS origins |
| `SOCKET_IO_MAX_CONNECTIONS` | ❌ | Max concurrent connections (default: 1000) |
| `SOCKET_IO_CONNECTION_TIMEOUT` | ❌ | Connection timeout in ms (default: 60000) |

### Collaboration Limits

| Variable | Required | Description |
|----------|----------|-------------|
| `MAX_COLLABORATION_SESSIONS` | ❌ | Max active sessions (default: 100) |
| `MAX_PARTICIPANTS_PER_SESSION` | ❌ | Max users per session (default: 10) |
| `SESSION_IDLE_TIMEOUT` | ❌ | Session idle timeout in ms (default: 1800000) |

**Example:**
```bash
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGINS="http://localhost:3000,https://your-domain.com"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

## 📁 File Storage

### Cloudinary (Recommended)

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | ❌ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ❌ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ❌ | Cloudinary API secret |

**Setup:**
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get credentials from Dashboard
3. Configure upload presets for security

### AWS S3 (Alternative)

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | ❌ | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | ❌ | AWS secret key |
| `AWS_REGION` | ❌ | AWS region (default: "us-east-1") |
| `AWS_S3_BUCKET` | ❌ | S3 bucket name |

### File Upload Limits

| Variable | Required | Description |
|----------|----------|-------------|
| `MAX_FILE_SIZE` | ❌ | Max file size in bytes (default: 10485760 = 10MB) |
| `ALLOWED_FILE_TYPES` | ❌ | Comma-separated MIME types |

## ⚡ Caching & Performance

### Cache Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `CACHE_TTL_SHORT` | ❌ | Short cache TTL in seconds (default: 300) |
| `CACHE_TTL_MEDIUM` | ❌ | Medium cache TTL in seconds (default: 1800) |
| `CACHE_TTL_LONG` | ❌ | Long cache TTL in seconds (default: 3600) |
| `CACHE_TTL_STATIC` | ❌ | Static cache TTL in seconds (default: 86400) |

### Performance Monitoring

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING` | ❌ | Enable performance tracking |
| `NEXT_PUBLIC_PERFORMANCE_SAMPLE_RATE` | ❌ | Performance sampling rate (0-1) |
| `LIGHTHOUSE_CI_TOKEN` | ❌ | Lighthouse CI token for automated audits |

## 📱 PWA & Service Worker

### Progressive Web App

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PWA_ENABLED` | ❌ | Enable PWA features (default: true) |
| `NEXT_PUBLIC_PWA_CACHE_STRATEGY` | ❌ | Cache strategy ("CacheFirst", "NetworkFirst") |
| `NEXT_PUBLIC_PWA_OFFLINE_FALLBACK` | ❌ | Offline fallback page (default: "/offline") |

### Service Worker

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SW_ENABLED` | ❌ | Enable service worker (default: true) |
| `NEXT_PUBLIC_SW_CACHE_NAME` | ❌ | Service worker cache name |
| `NEXT_PUBLIC_SW_PRECACHE_URLS` | ❌ | Comma-separated URLs to precache |

### Background Sync

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BACKGROUND_SYNC_ENABLED` | ❌ | Enable background sync |
| `NEXT_PUBLIC_SYNC_TAG_PREFIX` | ❌ | Background sync tag prefix |

## ♿ Accessibility

### Accessibility Features

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_A11Y_ENABLED` | ❌ | Enable accessibility features (default: true) |
| `NEXT_PUBLIC_A11Y_TESTING_ENABLED` | ❌ | Enable accessibility testing |
| `NEXT_PUBLIC_HIGH_CONTRAST_SUPPORT` | ❌ | Enable high contrast mode |
| `NEXT_PUBLIC_REDUCED_MOTION_SUPPORT` | ❌ | Enable reduced motion support |

### Screen Reader Support

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SCREEN_READER_ANNOUNCEMENTS` | ❌ | Enable screen reader announcements |
| `NEXT_PUBLIC_LIVE_REGION_POLITENESS` | ❌ | Live region politeness level |

### Keyboard Navigation

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_KEYBOARD_SHORTCUTS_ENABLED` | ❌ | Enable keyboard shortcuts |
| `NEXT_PUBLIC_FOCUS_VISIBLE_ENABLED` | ❌ | Enable focus-visible polyfill |

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)

| Variable | Required | Description |
|----------|----------|-------------|
| `SENTRY_DSN` | ❌ | Sentry Data Source Name |
| `SENTRY_ORG` | ❌ | Sentry organization |
| `SENTRY_PROJECT` | ❌ | Sentry project name |
| `SENTRY_AUTH_TOKEN` | ❌ | Sentry authentication token |

### Analytics

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ❌ | Google Analytics 4 Measurement ID |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | ❌ | Plausible Analytics domain |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ | PostHog project API key |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | ❌ | Mixpanel project token |

### Web Vitals

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_TRACK_WEB_VITALS` | ❌ | Enable Core Web Vitals tracking |
| `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` | ❌ | Endpoint for Web Vitals data |

## 🔒 Security & Rate Limiting

### Rate Limiting

| Variable | Required | Description |
|----------|----------|-------------|
| `RATE_LIMIT_WINDOW_MS` | ❌ | Rate limit window in ms (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | Max requests per window (default: 100) |
| `API_RATE_LIMIT_PER_MINUTE` | ❌ | API requests per minute (default: 60) |
| `AUTH_RATE_LIMIT_PER_MINUTE` | ❌ | Auth requests per minute (default: 5) |

### Security Headers

| Variable | Required | Description |
|----------|----------|-------------|
| `CONTENT_SECURITY_POLICY_REPORT_URI` | ❌ | CSP violation report URI |
| `HSTS_MAX_AGE` | ❌ | HSTS max age in seconds (default: 31536000) |

## 🚩 Feature Flags

### Core Features

| Variable | Required | Description |
|----------|----------|-------------|
| `FEATURE_AI_TUTORING` | ❌ | Enable AI tutoring features |
| `FEATURE_COLLABORATION` | ❌ | Enable real-time collaboration |
| `FEATURE_CODE_COMPILATION` | ❌ | Enable code compilation |
| `FEATURE_BLOCKCHAIN_INTEGRATION` | ❌ | Enable blockchain features |
| `FEATURE_GAMIFICATION` | ❌ | Enable gamification system |

### Performance Features

| Variable | Required | Description |
|----------|----------|-------------|
| `FEATURE_LAZY_LOADING` | ❌ | Enable lazy loading |
| `FEATURE_IMAGE_OPTIMIZATION` | ❌ | Enable image optimization |
| `FEATURE_BUNDLE_ANALYSIS` | ❌ | Enable bundle analysis |
| `FEATURE_PERFORMANCE_MONITORING` | ❌ | Enable performance monitoring |

### Beta Features

| Variable | Required | Description |
|----------|----------|-------------|
| `BETA_VOICE_CHAT` | ❌ | Enable voice chat (beta) |
| `BETA_VIDEO_COLLABORATION` | ❌ | Enable video collaboration (beta) |
| `BETA_AI_CODE_REVIEW` | ❌ | Enable AI code review (beta) |
| `BETA_OFFLINE_MODE` | ❌ | Enable offline mode (beta) |

## 🧪 Development & Testing

### Development Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DEBUG` | ❌ | Enable debug mode |
| `VERBOSE_LOGGING` | ❌ | Enable verbose logging |
| `ENABLE_QUERY_LOGGING` | ❌ | Enable database query logging |

### Testing Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_DATABASE_URL` | ❌ | Test database connection string |
| `TEST_REDIS_URL` | ❌ | Test Redis connection string |
| `ENABLE_A11Y_TESTING` | ❌ | Enable accessibility testing |
| `A11Y_TEST_RUNNER` | ❌ | Accessibility test runner (default: "axe-core") |
| `A11Y_COMPLIANCE_LEVEL` | ❌ | Compliance level (default: "AA") |

## 🔧 Environment-Specific Examples

### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://user:pass@localhost:5432/solidity_learning_dev"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="dev-secret-key-min-32-characters-long"
DEBUG=true
VERBOSE_LOGGING=true
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET="production-secret-64-chars-long"
REDIS_URL="redis://:[password]@host:port"
SENTRY_DSN="https://your-dsn@sentry.io/project"
```

### Testing
```bash
NODE_ENV=test
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/solidity_learning_test"
TEST_REDIS_URL="redis://localhost:6379/1"
ENABLE_A11Y_TESTING=true
ENABLE_PERFORMANCE_TESTING=true
```

## 🚨 Common Issues & Solutions

### Environment Variable Not Loading

**Problem**: Variables defined in `.env.local` are not accessible

**Solutions**:
```bash
# 1. Check file name (must be .env.local, not .env.example)
ls -la | grep env

# 2. Restart development server
npm run dev

# 3. Check variable naming (client-side variables need NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_API_URL=http://localhost:3000  # ✅ Accessible in browser
API_SECRET=secret-key                      # ✅ Server-side only

# 4. Verify no spaces around equals sign
CORRECT_VAR=value     # ✅ Correct
WRONG_VAR = value     # ❌ Wrong
```

### Database Connection Issues

**Problem**: `ECONNREFUSED` or `database does not exist`

**Solutions**:
```bash
# 1. Check PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# 2. Test connection manually
psql "postgresql://user:pass@localhost:5432/db"

# 3. Check SSL requirements for production
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# 4. Verify database exists
createdb solidity_learning_dev
```

### OAuth Redirect Errors

**Problem**: `redirect_uri_mismatch` or OAuth failures

**Solutions**:
```bash
# 1. Check redirect URIs in OAuth provider settings
# Development: http://localhost:3000/api/auth/callback/google
# Production: https://your-domain.com/api/auth/callback/google

# 2. Verify NEXTAUTH_URL matches your domain
NEXTAUTH_URL=http://localhost:3000  # Development
NEXTAUTH_URL=https://your-domain.com  # Production

# 3. Ensure no trailing slashes
NEXTAUTH_URL=http://localhost:3000/  # ❌ Wrong
NEXTAUTH_URL=http://localhost:3000   # ✅ Correct
```

### AI API Issues

**Problem**: AI features not working or rate limit errors

**Solutions**:
```bash
# 1. Verify API key is correct
curl -H "Authorization: Bearer $GOOGLE_GENERATIVE_AI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models

# 2. Check rate limits
AI_REQUESTS_PER_MINUTE=60
AI_REQUESTS_PER_HOUR=1000

# 3. Verify model name
GOOGLE_AI_MODEL="gemini-pro"  # ✅ Correct
GOOGLE_AI_MODEL="gpt-4"       # ❌ Wrong for Google AI
```

### Performance Issues

**Problem**: Slow loading or high memory usage

**Solutions**:
```bash
# 1. Enable performance monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# 2. Check bundle size
npm run build:analyze

# 3. Optimize cache settings
CACHE_TTL_STATIC=86400  # 24 hours for static assets
CACHE_TTL_API=300       # 5 minutes for API responses

# 4. Enable lazy loading
FEATURE_LAZY_LOADING=true
```

---

**For more help with environment setup, see the [Environment Setup Guide](./ENVIRONMENT_SETUP.md).**
