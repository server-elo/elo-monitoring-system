# CSS Troubleshooting Guide for Solidity Learning Platform

## 🚨 Common CSS Issues and Solutions

### Issue: Page displays without styling (raw HTML)

#### Symptoms:
- Page shows only text without any styling
- Browser shows 404 errors for CSS files
- CSS classes appear in HTML but don't apply

#### Root Causes:
1. **Service Worker caching non-existent files**
2. **Experimental CSS optimization conflicts**
3. **Font loading blocking render**
4. **Build cache corruption**
5. **Browser cache issues**

## 🔧 Complete Fix Process

### Step 1: Clear Browser Cache
```
1. Open Developer Tools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. Go to Service Workers section
5. Click "Unregister" for any workers
6. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

### Step 2: Fix Service Worker
Check `/public/sw.js` and remove any references to non-existent files:
```javascript
// Remove these lines:
'/static/css/main.css',
'/static/js/main.js',
```

### Step 3: Update Layout File
The layout file should:
- Use `next/font/google` for fonts (not @import)
- Include critical CSS inline
- Have loading states

### Step 4: Disable Experimental Features
In `next.config.js`:
```javascript
experimental: {
  optimizeCss: false, // This can cause issues
}
```

### Step 5: Clear Build Cache
```bash
# Stop all Next.js processes
pkill -f "next" || true

# Clear all caches
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Start fresh
npm run dev
```

## 📋 Diagnostic Checklist

Run the diagnostic script to check all issues:
```bash
node scripts/diagnose-css.js
```

### Manual Checks:
- [ ] Browser console - No JavaScript errors
- [ ] Network tab - CSS files load with 200 status
- [ ] No 404 errors for static files
- [ ] Service worker unregistered
- [ ] Browser cache cleared
- [ ] Incognito mode tested

## 🛠️ Prevention Tips

### 1. Always use Next.js conventions
- Import CSS in layout.tsx
- Use next/font for fonts
- Don't reference static files that don't exist

### 2. Keep dependencies updated
```bash
npm update tailwindcss autoprefixer postcss
```

### 3. Test builds regularly
```bash
npm run build && npm start
```

### 4. Monitor for issues
- Check browser console regularly
- Watch for 404 errors
- Test in multiple browsers

## 🚀 Quick Fix Script

Run this whenever CSS issues occur:
```bash
./fix-css.sh
```

Or manually:
```bash
# 1. Kill processes
pkill -f "next"

# 2. Clear everything
rm -rf .next node_modules/.cache

# 3. Clear browser
# - Open DevTools > Application > Clear site data

# 4. Restart
npm run dev
```

## 📝 Important Files

### Files that affect CSS loading:
1. `/app/layout.tsx` - Must import globals.css
2. `/app/globals.css` - Main CSS file with Tailwind
3. `/tailwind.config.js` - Tailwind configuration
4. `/postcss.config.js` - PostCSS configuration
5. `/public/sw.js` - Service worker (can cache CSS)
6. `/next.config.js` - Next.js configuration

### Common mistakes:
- ❌ Using @import for fonts (use next/font)
- ❌ Referencing non-existent static files
- ❌ Enabling experimental CSS features
- ❌ Not clearing service workers
- ❌ Not clearing browser cache

## 🎯 Final Solution

If all else fails:
1. Use the fixed layout.tsx provided
2. Disable all experimental features
3. Clear everything and start fresh
4. Test in production mode: `npm run build && npm start`

Remember: The issue is usually related to caching or service workers, not the actual CSS configuration.