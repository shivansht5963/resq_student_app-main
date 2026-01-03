# BLE Custom Dev Client Setup Guide

## What This Does
Builds a custom development client (APK) with native BLE module included. You can:
- Test BLE scanning in real conditions
- Use hot reload for fast iteration
- Test on physical Android devices

## Prerequisites
✅ Expo CLI installed
✅ EAS CLI installed (`npm install -g eas-cli`)
✅ EAS account created and logged in (`eas login`)
✅ Android device or emulator with Bluetooth support

## Step-by-Step Setup

### Step 1: Ensure BLE Library is Installed
```bash
npm install react-native-ble-plx expo-device
```

### Step 2: Configure app.json for Dev Client
Your app.json already has:
- ✅ Android permissions for BLE
- ✅ BLUETOOTH permission
- ✅ BLUETOOTH_ADMIN permission  
- ✅ BLUETOOTH_SCAN permission
- ✅ BLUETOOTH_CONNECT permission
- ✅ Location permissions (required for BLE scanning)

### Step 3: Build the Custom Dev Client

Run this command:
```bash
eas build --platform android --profile development
```

**Build Details:**
- Platform: Android
- Profile: development (includes dev client)
- Time: 10-15 minutes
- Output: APK ready to install on your device

### Step 4: Install on Your Device

Option A - Download & Install:
1. When build completes, download the APK link
2. Transfer to your Android device
3. Open file manager → tap APK → Install

Option B - ADB Install:
```bash
adb install path/to/downloaded.apk
```

### Step 5: Run App with Dev Client

After installing the dev client APK:

```bash
npx expo start --dev-client
```

Then:
1. Open the RESQ app on your device
2. The dev client will connect to your dev server
3. You'll see hot reload in action

## Troubleshooting

### Build Fails
- Check: `eas login` is working
- Check: Android permissions in app.json
- Check: No uncommitted changes in repo

### BLE Not Working
- Verify: Bluetooth is enabled on device
- Verify: Location permission is granted (BLE requires location)
- Verify: BLE device is discoverable

### Connection Issues
- Make sure phone and computer are on same WiFi
- Or use USB tunnel: `eas device create`
- Or use: `npx expo start --tunnel`

## Quick Commands Reference

```bash
# Check build status
eas build --status

# List previous builds
eas build --platform android --status

# Build and auto-install
eas build --platform android --profile development --wait

# Run with dev client
npx expo start --dev-client

# View logs on device
adb logcat | grep "RESQ\|BLE\|bluetooth"
```

## Expected Result
After setup, you'll have:
✅ Custom APK with BLE native modules
✅ Hot reload working
✅ Ability to test BLE scanning in real conditions
✅ Fast development iteration cycle
