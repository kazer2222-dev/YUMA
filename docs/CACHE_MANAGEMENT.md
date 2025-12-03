# Cache Management Best Practices

## Overview
This document outlines cache management strategies for the YUMA application to ensure optimal performance and prevent broken page formats after authentication or navigation.

## Problem: Broken Page Format After Sign-In

### Common Causes
1. **Full Page Reloads**: Using `window.location.href` instead of Next.js router causes full page reloads, breaking React hydration
2. **Browser Cache**: Old CSS/JS files being served from browser cache
3. **Build Cache**: Stale Next.js build artifacts in `.next` directory
4. **Service Worker Cache**: Cached assets from previous builds

## Solutions Implemented

### 1. Use Next.js Router for Navigation
**❌ Bad:**
```typescript
window.location.href = '/home';  // Causes full page reload
window.location.reload();         // Breaks React hydration
```

**✅ Good:**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/home');  // Client-side navigation, no reload
```

### 2. Cache Headers Configuration
We've configured Next.js to set appropriate cache headers:

- **Static Assets** (`/_next/static/*`): Long-term cache (1 year, immutable)
- **Images**: Medium-term cache (1 day, with stale-while-revalidate)
- **API Routes**: No cache (always fresh)
- **HTML Pages**: No cache (ensures fresh content)

### 3. Development vs Production

#### Development
- Clear `.next` directory when experiencing issues:
  ```bash
  rm -rf .next
  npm run dev
  ```

#### Production
- Use versioned assets (Next.js handles this automatically)
- Implement proper cache invalidation strategies
- Use CDN with cache purging capabilities

## Cache Clearing Strategies

### For Developers

#### 1. Clear Next.js Build Cache
```bash
# Stop the dev server
# Then delete .next directory
rm -rf .next
# Or on Windows:
rmdir /s /q .next

# Restart dev server
npm run dev
```

#### 2. Clear Browser Cache
- **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Firefox**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

#### 3. Clear Application Cache (Programmatic)
```typescript
// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Clear specific items
localStorage.removeItem('yuma_remembered_user');
localStorage.removeItem('yuma-theme');
```

### For Users

#### Browser Cache Issues
If users experience broken pages:
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: Settings → Privacy → Clear browsing data
3. **Disable Cache** (DevTools): Open DevTools → Network tab → Check "Disable cache"

## Best Practices

### 1. Navigation
- ✅ Always use Next.js `router.push()` for client-side navigation
- ✅ Use `router.replace()` when you don't want to add to history
- ❌ Avoid `window.location.href` unless absolutely necessary
- ❌ Avoid `window.location.reload()` in React components

### 2. Data Fetching
- ✅ Use React Query or SWR for client-side data fetching with cache
- ✅ Implement proper cache invalidation on mutations
- ✅ Use `revalidate` option in Next.js for ISR pages

### 3. Asset Management
- ✅ Use Next.js Image component for optimized images
- ✅ Leverage Next.js automatic code splitting
- ✅ Use dynamic imports for large components

### 4. State Management
- ✅ Use React state for UI state
- ✅ Use localStorage for user preferences (theme, etc.)
- ✅ Use sessionStorage for temporary data
- ✅ Clear sensitive data on logout

### 5. API Calls
- ✅ Always include `credentials: 'include'` for authenticated requests
- ✅ Implement proper error handling and retry logic
- ✅ Use cache headers appropriately on API responses

## Troubleshooting

### Issue: Styles Not Loading
**Symptoms**: Page appears unstyled or broken after navigation

**Solutions**:
1. Clear `.next` directory and restart dev server
2. Hard refresh browser (`Ctrl+Shift+R`)
3. Check browser console for 404 errors on CSS files
4. Verify `globals.css` is imported in root layout

### Issue: JavaScript Not Loading
**Symptoms**: Interactive elements don't work, React errors in console

**Solutions**:
1. Clear browser cache
2. Check Network tab for failed JS file loads
3. Verify no service worker is caching old assets
4. Clear `.next` directory and rebuild

### Issue: Stale Data After Updates
**Symptoms**: Old data showing after API updates

**Solutions**:
1. Implement cache invalidation in React Query/SWR
2. Use `router.refresh()` to refresh server components
3. Add cache-busting query parameters if needed
4. Verify API cache headers are set correctly

### Issue: Authentication State Not Updating
**Symptoms**: User appears logged out after successful login

**Solutions**:
1. Clear localStorage and sessionStorage
2. Check cookie settings (httpOnly, secure, sameSite)
3. Verify token refresh logic is working
4. Check browser console for authentication errors

## Cache Headers Reference

### Static Assets
```
Cache-Control: public, max-age=31536000, immutable
```
- Cached for 1 year
- Immutable (won't change)
- Used for: JS bundles, CSS files, fonts

### Images
```
Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```
- Cached for 1 day
- Can serve stale for up to 1 week while revalidating
- Used for: User avatars, uploaded images

### API Routes
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```
- Never cached
- Always fetch fresh data
- Used for: All API endpoints

### HTML Pages
```
Cache-Control: no-cache, no-store, must-revalidate
```
- Not cached
- Always fetch fresh HTML
- Used for: All page routes

## Monitoring

### Check Cache Headers
Use browser DevTools → Network tab to inspect cache headers:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on any resource
5. Check "Response Headers" for `Cache-Control`

### Verify Cache Behavior
1. Load page and check Network tab
2. Reload and verify cached resources show "(from disk cache)" or "(from memory cache)"
3. Hard refresh and verify all resources are fetched fresh

## Additional Resources

- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Web.dev Caching Best Practices](https://web.dev/http-cache/)








