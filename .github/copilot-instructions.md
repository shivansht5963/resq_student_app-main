# Copilot Instructions - RESQ Mobile App

## Overview
This is an **Expo React Native app** (iOS/Android/Web) for emergency incident reporting on university campuses. Key stack: **Expo 54**, **React 19**, **Expo Router**, **React Query**, **Secure authentication via Render backend**.

---

## Architecture Patterns

### Auth & Token Management
- **Storage**: `expo-secure-store` (NOT AsyncStorage for sensitive data)
- **Flow**: Token obtained via `POST /auth/login/` → stored securely → auto-injected in all API headers as `Authorization: Token {token}`
- **Expiry**: Tokens don't expire; cleared only on explicit logout
- **Example**: [src/utils/auth/index.js](src/utils/auth/index.js) handles token lifecycle; [src/utils/api.js](src/utils/api.js) injects headers in all requests
- **Key function**: `apiRequest()` in [api.js](api.js#L33) wraps all fetch calls with auth

### Data Flow Architecture
1. **Components** → Use context via `useAuth()` or call API directly
2. **API Layer** → [src/utils/api.js](src/utils/api.js) (all HTTP methods, token injection, error handling)
3. **React Query** → Caches beacons, incidents; configured in [src/app/_layout.jsx](src/app/_layout.jsx) (5min staleTime, 30min cache)
4. **AppContext** → Local state only (user, incidents, messages, currentBeacon) in [src/context/AppContext.jsx](src/context/AppContext.jsx)
5. **Routing** → Expo Router with file-based routing in [src/app/](src/app/) directory

### BLE (Bluetooth) Integration
- **Library**: `react-native-ble-plx` (requires native compilation; fails silently in Expo Go)
- **Status**: Graceful fallback implemented in [src/utils/useBLE.js](src/utils/useBLE.js)—BLE errors caught, app continues with manual beacon selection
- **Note**: For native BLE support, requires EAS development build with `--dev-client` flag

---

## Critical Files & Their Responsibilities

| File | Purpose |
|------|---------|
| [src/app/_layout.jsx](src/app/_layout.jsx) | Root layout: QueryClient setup, AppProvider, auth check on launch, splash screen |
| [src/utils/api.js](src/utils/api.js) | **Core API client**: All endpoints, token injection, error handling (401=logout, 403=forbidden, etc.) |
| [src/context/AppContext.jsx](src/context/AppContext.jsx) | Local state: user, incidents, messages, beacon selection |
| [src/utils/auth/index.js](src/utils/auth/index.js) | Token storage/retrieval, logout |
| [src/app/login.jsx](src/app/login.jsx) | Login screen with email/password form |
| [src/app/sos-alert.jsx](src/app/sos-alert.jsx) | SOS reporting: beacon selection, FormData upload with image Blobs |
| [src/app/report.jsx](src/app/report.jsx) | General incident reporting (multipart FormData with images) |
| [src/app/incidents.jsx](src/app/incidents.jsx) | Incident list with polling (React Query auto-refetch) |
| [src/app/chat.jsx](src/app/chat.jsx) | Real-time chat with guards via WebSocket or polling |

---

## Key Conventions & Gotchas

### Image Upload Pattern (FormData) ✅ VERIFIED
React Native requires images uploaded as **Blobs**, not file objects. This is already correctly implemented in [src/utils/api.js](src/utils/api.js) at line 276-290.

**Pattern:**
```javascript
// ✅ CORRECT - Current Implementation in reportIncident()
const response = await fetch(imageUri);
const blob = await response.blob();
formData.append('images', blob, fileName);

// ❌ WRONG - Do NOT use this
formData.append('images', { uri, type, name });
```

**Usage in screens:**
- [src/app/report.jsx](src/app/report.jsx) - General incident reporting with up to 3 images
- [src/app/sos-alert.jsx](src/app/sos-alert.jsx) - SOS reporting without images (backend handles it)

**Validation:**
- Maximum 3 images per report
- FormData does NOT have manual Content-Type header (React Native auto-sets it)
- Failed image loads don't fail the entire request (graceful degradation)

### API Request Error Handling
All API errors follow this pattern:
- **401**: Token invalid → auto-logout + redirect to login
- **403**: Permission denied → show error modal
- **400**: Bad request → parse detail field for user message
- Unhandled errors include `status`, `message`, `type`, `detail` fields

### Token Injection
Never manually add `Authorization` header—always use `apiRequest()` which auto-injects from secure store. Example: `apiRequest('/incidents/report_sos/', { method: 'POST', body: JSON.stringify(data) })`

### Polling & Caching
- Beacons: Fetch once on app load, cache indefinitely
- Incidents: Refetch every 5 sec (see [src/app/incidents.jsx](src/app/incidents.jsx) - queries use React Query with `staleTime: 5000`)
- Chat messages: Poll every 3 sec when chat screen active
- Use React Query's `refetchInterval` for automatic polling
- Incident detail view: Real-time polling with 5-second stale time to show status updates (CREATED → ASSIGNED → IN_PROGRESS → RESOLVED)

### Dark Mode
App supports light/dark mode via `useTheme()` hook. Don't hard-code colors; use theme values. See [src/utils/useTheme.js](src/utils/useTheme.js).

---

## Build & Deployment

### Local Development
```bash
npm install
npx expo start
# Press 's' for web, 'a' for Android emulator, 'i' for iOS simulator
```

### EAS Development Build (Required for Native Features)
```bash
npx eas login  # Must have Expo.dev account
npx eas build --platform android --profile development
# Download APK, install on device
npx expo start --dev-client  # Connect to build
```

### Production Build
```bash
eas build --platform android  # or --platform ios
```
See [eas.json](eas.json) for build profiles; [EAS_LOGIN_HELP.md](EAS_LOGIN_HELP.md) for account setup.

---

## Testing & Debugging

### Test Credentials
```
Email: student@example.com
Password: password123
```

### Backend
- API Base: `https://resq-server.onrender.com/api`
- Status: Verify with `GET /health/` or any login attempt

### Common Issues
1. **BLE errors**: App gracefully falls back to manual beacon selection (see [APP_STATUS_FINAL.md](APP_STATUS_FINAL.md))
2. **Missing env vars**: Optional; app works without remote logging endpoint (see [FIXES_SUMMARY.md](FIXES_SUMMARY.md))
3. **Build fails on EAS**: Ensure account verified, token valid (`npx eas whoami`)

---

## When Implementing Features

1. **API calls**: Use `apiRequest()` from [api.js](src/utils/api.js); check [STUDENT_APP_FRONTEND_GUIDE.md](STUDENT_APP_FRONTEND_GUIDE.md) for endpoint specs
2. **New screens**: Add route to [src/app/_layout.jsx](src/app/_layout.jsx), create `.jsx` file in [src/app/](src/app/)
3. **Shared state**: Use `AppContext` for global incident/user data
4. **Images/files**: Always convert to Blob before FormData append
5. **Auth-protected routes**: Use `useAuth()` hook to check token; redirect to login if missing
6. **Loading/errors**: Use QueryClient `isLoading`, `isError` or custom error boundary in [__create/SharedErrorBoundary.tsx](__create/SharedErrorBoundary.tsx)

---

## Reference Docs
- Backend guide: [STUDENT_APP_FRONTEND_GUIDE.md](STUDENT_APP_FRONTEND_GUIDE.md)
- Status/fixes: [APP_STATUS_FINAL.md](APP_STATUS_FINAL.md), [FIXES_SUMMARY.md](FIXES_SUMMARY.md), [INCIDENT_REPORT_STATUS.md](INCIDENT_REPORT_STATUS.md)
- Setup: [ENV_SETUP.md](ENV_SETUP.md), [QUICKSTART.txt](QUICKSTART.txt)
