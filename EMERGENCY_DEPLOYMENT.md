# Emergency Deployment Instructions

## Current Status
The application has been built with TypeScript errors ignored. Many features may not work correctly.

## Disabled Features
- Admin panel (all /admin routes)
- Some API endpoints may fail
- Type safety is completely disabled

## To Deploy

### Option 1: Force Server (Recommended)
```bash
npm run start:force
```

### Option 2: Static Files (if available)
If static export succeeded, files are in the `out` directory:
```bash
npx serve out -p 3000
```

### Option 3: Use a CDN
Upload the `.next` or `out` directory to a CDN like Vercel, Netlify, or AWS S3.

## To Monitor
- Check server logs constantly
- Set up error tracking (Sentry)
- Monitor for 500 errors
- Be prepared to rollback

## Recovery Plan
1. Fix TypeScript errors in development
2. Test thoroughly
3. Deploy properly using normal build process

## Emergency Contacts
- Keep your development team on standby
- Have rollback procedures ready
- Monitor user reports closely
