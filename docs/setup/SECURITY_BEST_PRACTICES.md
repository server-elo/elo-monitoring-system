# Security Best Practices

This guide outlines security best practices for deploying and maintaining the Solidity Learning Platform.

## 🔐 Environment Variable Security

### 1. Secret Management

**Never commit secrets to version control:**

```bash
# ✅ Good: Use .env.local (gitignored)
echo "NEXTAUTH_SECRET=your-secret" >> .env.local

# ❌ Bad: Committing secrets
git add .env
git commit -m "Add environment variables"  # DON'T DO THIS
```

**Generate strong secrets:**

```bash
# Generate 32-byte base64 secret
openssl rand -base64 32

# Generate 64-byte hex secret
openssl rand -hex 64

# Generate UUID
uuidgen

# Node.js method
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Production Secret Requirements

| Variable | Minimum Length | Requirements |
|----------|----------------|--------------|
| `NEXTAUTH_SECRET` | 32 characters | Random, base64 encoded |
| `DATABASE_URL` | N/A | SSL enabled, strong password |
| `API_KEYS` | Provider specific | Rotate regularly |
| `WEBHOOK_SECRETS` | 32 characters | Random, hex encoded |

### 3. Environment-Specific Configurations

**Development (.env.local):**
```bash
# Relaxed security for development
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=lax
DEBUG=true
```

**Production:**
```bash
# Strict security for production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=strict
DEBUG=false
HSTS_MAX_AGE=31536000
```

## 🛡️ Database Security

### 1. Connection Security

**Always use SSL in production:**

```bash
# ✅ Good: SSL enabled
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# ❌ Bad: No SSL
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

**Use connection pooling:**

```bash
# Supabase with connection pooling
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true&connection_limit=1"

# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_TIMEOUT=30000
```

### 2. Database User Permissions

**Create dedicated database users:**

```sql
-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE solidity_learning TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM app_user;
REVOKE ALL ON pg_user FROM app_user;
```

### 3. Data Encryption

**Encrypt sensitive data at rest:**

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('additional-data'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('additional-data'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## 🔒 Authentication Security

### 1. Session Security

**Configure secure session settings:**

```javascript
// pages/api/auth/[...nextauth].js
export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // 1 hour
  },
  
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
      },
    },
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Add security checks
      if (account?.provider === 'google') {
        // Verify Google token
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${account.access_token}`);
        if (!response.ok) {
          throw new Error('Invalid Google token');
        }
      }
      
      return token;
    },
  },
});
```

### 2. OAuth Security

**Secure OAuth configuration:**

```bash
# Use state parameter for CSRF protection
OAUTH_STATE_SECRET="random-32-byte-secret"

# Verify redirect URIs
GOOGLE_REDIRECT_URI="https://your-domain.com/api/auth/callback/google"
GITHUB_REDIRECT_URI="https://your-domain.com/api/auth/callback/github"

# Use PKCE for public clients
OAUTH_USE_PKCE=true
```

### 3. Password Security (if implementing custom auth)

```typescript
// lib/password.ts
import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';

export async function hashPassword(password: string): Promise<string> {
  // Check password strength
  const strength = zxcvbn(password);
  if (strength.score < 3) {
    throw new Error('Password is too weak');
  }
  
  // Hash with salt rounds 12-14 for production
  const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## 🌐 API Security

### 1. Rate Limiting

**Implement comprehensive rate limiting:**

```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Different limits for different endpoints
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 AI requests per minute
  analytics: true,
});
```

### 2. Input Validation

**Validate all inputs:**

```typescript
// lib/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Schema validation
export const userSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  role: z.enum(['student', 'instructor', 'admin']),
});

// Sanitize HTML content
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: [],
  });
}

// SQL injection prevention (using Prisma)
export async function getUserById(id: string) {
  // ✅ Good: Parameterized query via Prisma
  return prisma.user.findUnique({
    where: { id },
  });
  
  // ❌ Bad: Raw SQL with string interpolation
  // return prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
}
```

### 3. CORS Configuration

**Configure CORS properly:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();
  
  // CORS headers
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-domain.com',
    'https://your-domain.vercel.app',
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}
```

## 🛡️ Security Headers

### 1. Essential Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com;
      frame-src 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 2. Content Security Policy

**Implement strict CSP:**

```typescript
// lib/csp.ts
export function generateCSP() {
  const nonce = crypto.randomBytes(16).toString('base64');
  
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self' ${getAllowedApiDomains().join(' ')}`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
  
  return { csp, nonce };
}
```

## 🔍 Security Monitoring

### 1. Error Tracking

**Monitor security events:**

```typescript
// lib/security-monitoring.ts
import { captureException, captureMessage } from '@sentry/nextjs';

export function logSecurityEvent(event: string, details: any) {
  captureMessage(`Security Event: ${event}`, {
    level: 'warning',
    tags: {
      type: 'security',
      event,
    },
    extra: details,
  });
}

export function logSecurityViolation(violation: string, request: Request) {
  captureException(new Error(`Security Violation: ${violation}`), {
    tags: {
      type: 'security_violation',
      violation,
    },
    extra: {
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for'),
    },
  });
}
```

### 2. Audit Logging

**Log important security events:**

```typescript
// lib/audit.ts
export async function auditLog(action: string, userId: string, details: any) {
  await prisma.auditLog.create({
    data: {
      action,
      userId,
      details: JSON.stringify(details),
      ip: getClientIP(),
      userAgent: getUserAgent(),
      timestamp: new Date(),
    },
  });
}

// Usage
await auditLog('LOGIN_SUCCESS', user.id, { provider: 'google' });
await auditLog('PASSWORD_CHANGE', user.id, { success: true });
await auditLog('ADMIN_ACTION', user.id, { action: 'user_delete', targetUserId });
```

## 🚨 Incident Response

### 1. Security Incident Checklist

**If you suspect a security breach:**

1. **Immediate Actions:**
   - [ ] Rotate all API keys and secrets
   - [ ] Invalidate all user sessions
   - [ ] Enable maintenance mode if necessary
   - [ ] Document the incident

2. **Investigation:**
   - [ ] Check audit logs for suspicious activity
   - [ ] Review error tracking for anomalies
   - [ ] Analyze access logs
   - [ ] Identify affected users/data

3. **Containment:**
   - [ ] Block malicious IP addresses
   - [ ] Patch vulnerabilities
   - [ ] Update security configurations
   - [ ] Deploy fixes

4. **Recovery:**
   - [ ] Restore from clean backups if needed
   - [ ] Verify system integrity
   - [ ] Gradually restore services
   - [ ] Monitor for continued threats

5. **Post-Incident:**
   - [ ] Conduct post-mortem
   - [ ] Update security procedures
   - [ ] Notify affected users if required
   - [ ] Implement additional safeguards

### 2. Emergency Contacts

```bash
# Environment variables for incident response
SECURITY_TEAM_EMAIL="security@yourcompany.com"
INCIDENT_WEBHOOK_URL="https://hooks.slack.com/services/..."
EMERGENCY_CONTACT_PHONE="+1234567890"
```

## 📋 Security Checklist

### Development
- [ ] Secrets not committed to version control
- [ ] Strong secrets generated (32+ characters)
- [ ] Input validation implemented
- [ ] SQL injection prevention (using Prisma)
- [ ] XSS prevention (sanitizing inputs)
- [ ] CSRF protection enabled

### Production
- [ ] SSL/TLS enabled everywhere
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Error tracking configured
- [ ] Audit logging enabled
- [ ] Regular security updates scheduled

### Ongoing
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing
- [ ] Security training for team
- [ ] Incident response plan tested
- [ ] Backup and recovery procedures verified

---

**Security is an ongoing process. Regularly review and update these practices as threats evolve.**
