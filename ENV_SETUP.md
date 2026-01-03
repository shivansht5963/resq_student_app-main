# Environment Variables & Configuration Guide

## ✅ What You Have Now

Your app is fully functional **without** the optional logging variables. Here's what's set up:

### Current Working State
- ✅ BLE scanning (fixed with proper permissions and implementation)
- ✅ API communication to `https://resq-server.onrender.com`
- ✅ Deep linking with `resq://` scheme
- ✅ Error handling with local console logging
- ✅ All routes properly configured

## ⚙️ Environment Variables Explained

### Required (Already working)
```env
EXPO_PUBLIC_BASE_URL=https://resq-server.onrender.com
EXPO_PUBLIC_API_BASE_URL=https://resq-server.onrender.com/api
```
These are already in [.env.local](.env.local) and working.

### Optional (For Remote Error Logging)
```env
EXPO_PUBLIC_LOGS_ENDPOINT=
EXPO_PUBLIC_PROJECT_GROUP_ID=
EXPO_PUBLIC_CREATE_TEMP_API_KEY=
```

**What these do:**
- Send error crash reports to Create.xyz logging servers
- **You don't need these for development** - errors log to console automatically

**Where to get them:**
1. **EXPO_PUBLIC_LOGS_ENDPOINT** - Contact Create.xyz support or check your Create.xyz dashboard
2. **EXPO_PUBLIC_PROJECT_GROUP_ID** - Found in Create.xyz project settings
3. **EXPO_PUBLIC_CREATE_TEMP_API_KEY** - Generate from Create.xyz API console

**If you don't have Create.xyz setup:**
- Leave them blank/commented out in [.env.local](.env.local)
- Errors will still be logged to your React Native console and debugger
- No remote logging will happen (which is fine for development)

## 📝 How to Add Environment Variables

### Development (Recommended)
The [.env.local](.env.local) file is already created. Edit it:
```bash
# Open in your editor
code .env.local
```

Add values only if you have Create.xyz setup:
```env
EXPO_PUBLIC_LOGS_ENDPOINT=https://your-logs-endpoint.com/logs
EXPO_PUBLIC_PROJECT_GROUP_ID=your-project-id
EXPO_PUBLIC_CREATE_TEMP_API_KEY=your-api-key
```

### For Production Builds
Expo will read from environment variables at build time:
```bash
# When building with EAS
eas build --env=production
```

Set variables in:
- EAS Secrets (recommended): `eas secret:create`
- GitHub Actions/CI: Set in repository secrets
- `.env.production` file (not committed to git)

## 🔍 How the App Uses Environment Variables

```javascript
// fetch.ts - Automatic header injection
const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
const auth = await SecureStore.getItemAsync(authKey);
finalHeaders.set('authorization', `Bearer ${auth.jwt}`);

// report-error-to-remote.js - Optional error logging
if (!process.env.EXPO_PUBLIC_LOGS_ENDPOINT) {
  console.debug('Logging to Create.xyz disabled (optional)');
  return { success: false };
}
```

## ✨ Debug Messages Explained

### You'll See This (Normal)
```
DEBUG  reportErrorToRemote: Missing environment variables for logging endpoint...
```
**Meaning:** Remote error logging is disabled (optional feature not configured)
**Action:** Ignore unless you want Create.xyz error logging

### Warnings You Fixed
- ✅ `WARN Deep imports from 'react-native'` - Fixed in [index.tsx](index.tsx)
- ✅ `WARN Layout children: No route named "incident/[id]"` - Fixed in [src/app/_layout.jsx](src/app/_layout.jsx)
- ✅ `WARN Missing scheme` - Fixed in [app.json](app.json)

## 🚀 Next Steps

**If you want Create.xyz error logging:**
1. Get values from Create.xyz dashboard
2. Add them to [.env.local](.env.local)
3. Restart the dev server

**If you don't need it:**
1. Leave [.env.local](.env.local) as-is
2. Your app works perfectly
3. Errors appear in your console (Expo debugger)

---

**Questions?**
- Create.xyz docs: https://docs.create.xyz
- Expo environment variables: https://docs.expo.dev/guides/environment-variables/
- React Native debugging: https://reactnative.dev/docs/debugging
