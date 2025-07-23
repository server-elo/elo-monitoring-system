# Environment Configuration Migration Guide

## Overview
The environment configuration has been refactored to properly separate client and server concerns, fixing the validation errors that were preventing the application from loading.

## Changes Made

### 1. New File Structure
- `client-env.ts` - Client-safe environment variables (NEXT_PUBLIC_*)
- `server-env.ts` - Server-only environment variables (all variables)
- `environment.ts` - Universal interface with conditional loading
- `env-types.ts` - TypeScript type definitions
- `safe-env.ts` - Safe access utilities

### 2. Key Improvements
- Client-side code no longer tries to access server-only variables
- Graceful fallbacks for missing client variables
- Type-safe access to all environment variables
- No more validation errors on client-side
- Proper separation of concerns

## Migration Instructions

### For Client Components ('use client')

If your component/hook is marked with 'use client', update imports:

```typescript
// OLD - May cause errors
import { env } from '@/lib/config/environment';

// NEW - Safe for client
import { clientEnv, clientConfig } from '@/lib/config/client-env';
// OR use the universal interface (auto-detects client/server)
import { env, isProduction } from '@/lib/config/environment';
```

### For Server Components/API Routes

For server-side code, you can use either:

```typescript
// Option 1: Direct server import (recommended for server-only code)
import { serverEnv, features, dbConfig } from '@/lib/config/server-env';

// Option 2: Universal interface (works everywhere)
import { env, features, dbConfig } from '@/lib/config/environment';
```

### For Mixed Usage (Works Everywhere)

Use the safe utilities:

```typescript
import { safeGetEnv, getAppUrl, isProduction } from '@/lib/config/safe-env';

// Safe to use anywhere
const appUrl = getAppUrl(); // Returns NEXT_PUBLIC_APP_URL or fallback
const isProd = isProduction(); // Works on both client and server
```

## Common Patterns

### 1. Accessing Public Variables
```typescript
// Client-safe
const gaId = clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const appName = clientConfig.app.name;
```

### 2. Feature Flags
```typescript
// On server
import { features } from '@/lib/config/environment';
if (features.aiTutoring) { /* ... */ }

// On client (always returns default values)
import { features } from '@/lib/config/environment';
// Features have safe defaults on client
```

### 3. Conditional Access
```typescript
import { isServer, safeGetEnv } from '@/lib/config/safe-env';

if (isServer()) {
  // Access server-only variables
  const dbUrl = safeGetEnv('DATABASE_URL');
}
```

## Troubleshooting

### Error: "Cannot find namespace 'JSX'"
This is unrelated to environment variables. Ensure you're using `ReactElement` instead of `JSX.Element`.

### Error: "Missing required variables"
- On server: Add the variables to your `.env` file
- On client: This should not happen anymore with the new system

### Error: "Server configuration cannot be imported on client"
You're trying to import from `server-env.ts` in client code. Use `client-env.ts` or `environment.ts` instead.

## Best Practices

1. **Always validate server variables** - The server-env will exit the process if required variables are missing
2. **Use type-safe access** - Import the typed configurations rather than accessing env directly
3. **Provide fallbacks** - Always have sensible defaults for client-side variables
4. **Don't expose secrets** - Never put sensitive data in NEXT_PUBLIC_* variables

## Environment Variable Naming

- `NEXT_PUBLIC_*` - Safe for client, exposed in browser
- All others - Server-only, never exposed to client

## Testing

1. **Development**: Test with minimal `.env` file
2. **Production**: Ensure all required variables are set
3. **Client Build**: Should work even without server variables

## Need Help?

If you encounter issues:
1. Check if you're importing the right module for your context
2. Ensure your `.env` file has all required server variables
3. Use the safe utilities for mixed client/server code
4. Check the TypeScript types in `env-types.ts` for the full variable list