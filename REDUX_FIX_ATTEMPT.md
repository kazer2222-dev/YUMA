# Redux 5.0.1 Fix Attempt

## Current Status

Added `redux@5.0.1` back to the lock file as an optional peer dependency:
- Location: `node_modules/recharts/node_modules/react-redux/node_modules/redux`
- Marked as: `"peer": true, "optional": true`
- Required by: `react-redux@9.2.0` (peer dependency `redux: "^5.0.0"`)

## Structure

```json
"node_modules/recharts/node_modules/react-redux/node_modules/redux": {
  "version": "5.0.1",
  "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
  "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
  "license": "MIT",
  "peer": true,
  "optional": true
}
```

## If Still Failing

The issue might be that npm ci expects the entry in a different format or location. Try:

1. **Regenerate lock file completely:**
   ```bash
   rm package-lock.json
   npm install
   ```

2. **Or use npm install in CI temporarily:**
   - Change CI to use `npm install` instead of `npm ci`
   - Then regenerate lock file locally and commit

3. **Check if redux needs to be in packages section:**
   - In lockfileVersion 3, check if entry needs to be in "packages" section as well








