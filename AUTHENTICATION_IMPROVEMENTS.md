# Authentication Improvements - Implementation Guide

## Changes Applied

### 1. Automatic Token Refresh ✅
- **Created**: `lib/api-client.ts` - Enhanced fetch wrapper with automatic token refresh
- **Created**: `lib/hooks/use-api-fetch.ts` - React hook for API calls
- **Updated**: `app/api/auth/refresh/route.ts` - Now reads refresh token from cookies and updates session in database

### 2. Increased Access Token Lifetime ✅
- **Changed**: Access token expiration from **15 minutes** to **1 hour**
- **Updated Files**:
  - `lib/auth.ts` - Token generation
  - `app/api/auth/verify-pin/route.ts` - Cookie maxAge
  - `app/api/auth/refresh/route.ts` - Token generation and cookie maxAge
  - `app/api/auth/login/route.ts` - Cookie maxAge
  - `app/api/auth/verify-email/route.ts` - Cookie maxAge
  - `app/api/auth/google/callback/route.ts` - Cookie maxAge

## How It Works

### Automatic Token Refresh Flow

1. **User makes API request** → Uses `apiFetch()` or `apiGet()`, `apiPost()`, etc.
2. **Request returns 401** → Access token expired
3. **Automatic refresh triggered** → Calls `/api/auth/refresh` with refresh token from cookies
4. **New tokens generated** → Access token (1 hour) + Refresh token (7 days)
5. **Cookies updated** → Browser automatically gets new tokens
6. **Original request retried** → User doesn't notice the refresh
7. **If refresh fails** → User redirected to `/auth` page

### Benefits

- ✅ **No more unexpected logouts** - Tokens refresh automatically
- ✅ **Better UX** - Users stay logged in for 1 hour (was 15 minutes)
- ✅ **Seamless experience** - Refresh happens in background
- ✅ **Secure** - Still uses short-lived access tokens with refresh mechanism

## Migration Guide

### Option 1: Use the New API Client (Recommended)

Replace direct `fetch()` calls with the new API client:

**Before:**
```typescript
const response = await fetch('/api/spaces', {
  credentials: 'include'
});
```

**After:**
```typescript
import { apiFetch } from '@/lib/api-client';

const response = await apiFetch('/api/spaces');
```

### Option 2: Use the React Hook

For React components:

```typescript
import { useApiFetch } from '@/lib/hooks/use-api-fetch';

function MyComponent() {
  const { get, post } = useApiFetch();

  useEffect(() => {
    const fetchData = async () => {
      const response = await get('/api/spaces');
      const data = await response.json();
      // ...
    };
    fetchData();
  }, [get]);
}
```

### Convenience Methods

The API client provides convenience methods:

```typescript
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/lib/api-client';

// GET request
const response = await apiGet('/api/spaces');

// POST request
const response = await apiPost('/api/spaces', { name: 'New Space' });

// PUT request
const response = await apiPut('/api/spaces/123', { name: 'Updated' });

// DELETE request
const response = await apiDelete('/api/spaces/123');

// PATCH request
const response = await apiPatch('/api/spaces/123', { name: 'Patched' });
```

## Testing

### Test Automatic Refresh

1. Log in to the application
2. Wait 1+ hour (or manually expire the token)
3. Make any API call using `apiFetch()` or the hook
4. The token should refresh automatically
5. You should NOT be redirected to login

### Test Token Expiration

1. Log in to the application
2. Wait 7+ days (or manually expire refresh token)
3. Make an API call
4. You SHOULD be redirected to `/auth` page

## Files Changed

### New Files
- `lib/api-client.ts` - API client with automatic refresh
- `lib/hooks/use-api-fetch.ts` - React hook wrapper

### Modified Files
- `app/api/auth/refresh/route.ts` - Enhanced refresh endpoint
- `lib/auth.ts` - Increased token lifetime
- `app/api/auth/verify-pin/route.ts` - Updated cookie maxAge
- `app/api/auth/login/route.ts` - Updated cookie maxAge
- `app/api/auth/verify-email/route.ts` - Updated cookie maxAge
- `app/api/auth/google/callback/route.ts` - Updated cookie maxAge

## Next Steps (Optional)

### Gradual Migration
You can gradually migrate existing code to use the new API client. The old `fetch()` calls will still work, but won't have automatic refresh.

### Priority Files to Migrate
1. `app/home/page.tsx` - Main dashboard
2. `app/spaces/[slug]/page.tsx` - Space pages
3. `components/board/board-view.tsx` - Board component
4. Any component making frequent API calls

### Future Enhancements
- Add request/response interceptors for logging
- Add retry logic for network errors
- Add request cancellation support
- Add request deduplication

## Security Notes

- Access tokens still expire after 1 hour (good security practice)
- Refresh tokens expire after 7 days
- Tokens are stored in HTTP-only cookies (prevents XSS)
- Automatic refresh only happens on 401 responses
- Failed refresh redirects to login (prevents infinite loops)













