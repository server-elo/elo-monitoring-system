# Sentry Setup Guide

## Prerequisites

1. Create a Sentry account at https://sentry.io
2. Create a new project for your application
3. Select "Next.js" as the platform

## Configuration Steps

### 1. Get Your DSN

1. Go to Settings → Projects → Your Project → Client Keys (DSN)
2. Copy the DSN value

### 2. Set Environment Variables

Add to your `.env.production`:

```env
SENTRY_DSN=your-dsn-here
NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 3. Install Sentry CLI (for source maps)

```bash
npm install -g @sentry/cli
```

### 4. Configure Source Maps (Optional)

Add to `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

## Testing Sentry Integration

### 1. Test Client-Side Error

Add a test button to trigger an error:

```tsx
<button onClick={() => {
  throw new Error('Test Sentry Error');
}}>
  Test Sentry
</button>
```

### 2. Test Server-Side Error

Create an API route:

```typescript
export async function GET() {
  throw new Error('Test Server Error');
}
```

### 3. Verify in Sentry Dashboard

1. Trigger the errors
2. Check your Sentry dashboard for the events
3. Verify error details and stack traces

## Production Best Practices

### 1. Error Filtering
- Filter out non-critical errors
- Ignore user network issues
- Set up inbound filters in Sentry

### 2. Performance Monitoring
- Set appropriate sample rates
- Monitor transaction performance
- Set up alerts for slow endpoints

### 3. Release Tracking
- Use Sentry CLI to create releases
- Upload source maps for each release
- Track error rates by release

### 4. Alerts & Notifications
- Set up error rate alerts
- Configure spike protection
- Set up team notifications

## Monitoring Checklist

- [ ] DSN configured correctly
- [ ] Client errors being captured
- [ ] Server errors being captured
- [ ] Source maps uploaded
- [ ] Release tracking enabled
- [ ] Alerts configured
- [ ] Team members added
- [ ] Sensitive data scrubbed
