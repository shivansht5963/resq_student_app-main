# Beacon Integration & EAS Build Issues

## Beacon Problems Faced

### ❌ **BLE Won't Work in Expo Go**
- react-native-ble-plx requires native code → instant crash in Expo Go
- **Fix**: Build with EAS `--dev-client` flag (requires native compilation)
- BLE errors should gracefully fall back to manual beacon selector dropdown
- Don't show error screen—just let user manually pick beacon

### ❌ **Beacon Scanning Timeout**
- BLE scan takes 5-10 seconds, blocks UI
- **Fix**: Move scan to background task, show loading state
- Always have timeout (max 15 sec) → fallback to dropdown if no beacon found

### ❌ **Token Injection Missing**
- Forgot to auto-inject auth token in beacon sync request
- **Fix**: Use `apiRequest()` from [src/utils/api.js](src/utils/api.js)—it auto-injects Token header

### ❌ **Beacon Data Persisted Wrong**
- Stored in AsyncStorage → lost on app restart
- **Fix**: Use `expo-secure-store` for beacon_id + location (same as token)

---

## EAS Build Issues

### ❌ **Build Fails: "Native Module Not Found"**
- Missing `react-native-ble-plx` in EAS env
- **Fix**: Add to `plugins` array in [app.json](app.json):
```json
"plugins": ["react-native-ble-plx"]
```

### ❌ **EAS Login Required**
- `npx eas build` fails without Expo account
- **Fix**: 
  - Create Expo account
  - `npx eas login`
  - Verify email
  - `npx eas whoami` to check

### ❌ **Development Build vs Preview**
- Preview build won't run native BLE
- **Fix**: Use `--profile development` flag:
```bash
npx eas build --platform android --profile development --dev-client
```
- Then: `npx expo start --dev-client` to connect

### ❌ **App Won't Run on Device**
- APK built but won't install
- **Fix**: Check build succeeded, download APK from EAS, manually install via `adb install`

---

## Quick Checklist

- [ ] BLE scan has 15-sec timeout + fallback dropdown
- [ ] Token auto-injected in `/guard/location/` calls
- [ ] Beacon stored in secure store, not AsyncStorage
- [ ] `app.json` has `react-native-ble-plx` plugin
- [ ] EAS account verified + `npx eas whoami` passes
- [ ] Dev build: `--profile development --dev-client`
- [ ] No error screens for BLE fails—just use manual dropdown
