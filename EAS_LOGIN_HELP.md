# EAS Build Setup - Authentication Issue

## Issue
Your EAS login failed. This could be due to:
1. Incorrect username/password
2. Account not verified
3. Account doesn't exist yet

## Solution Steps

### Option 1: Reset Your Password
1. Go to https://expo.dev/login
2. Click "Forgot password?"
3. Follow the email link to reset
4. Try login again: `npx eas login`

### Option 2: Create New EAS Account
If you don't have an account:
1. Go to https://expo.dev
2. Click "Sign up"
3. Use email: shivanshtiwari6849@gmail.com
4. Create a secure password
5. Verify email
6. Then: `npx eas login`

### Option 3: Use EAS Local Build (No Account Needed)
For local testing without uploading to EAS cloud:
```bash
npm install -g @expo/local-cli
npx expo-local-build build --platform android
```

## After Successful Login

Run the dev client build:
```bash
npx eas build --platform android --profile development
```

### What to Expect:
- Build starts on EAS servers
- Takes 10-15 minutes
- You'll get a link to download the APK
- Download and install on your Android device
- Then run: `npx expo start --dev-client`

## Quick Verification
After login, verify with:
```bash
npx eas whoami
```

Should show your username instead of "Not logged in"
