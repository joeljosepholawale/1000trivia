# Build APK Locally - Step by Step

## Problem
You're experiencing network connectivity issues preventing EAS Build from working (`getaddrinfo EAI_AGAIN api.expo.dev`).

## Solution: Build Locally

### Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK
   - Install Android SDK Build-Tools
   - Set up environment variables

2. **Set Environment Variables** (Windows)
   ```powershell
   # Add to System Environment Variables
   ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\Sdk
   
   # Add to Path:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

3. **Install Java JDK 17**
   - Download from: https://adoptium.net/
   - Set JAVA_HOME environment variable

### Build Steps

#### Step 1: Install EAS CLI Globally
```bash
npm install -g eas-cli
```

#### Step 2: Configure for Local Build
```bash
cd C:\Projects\1000ravier-mobileapp\packages\mobile
npx expo install expo-dev-client
```

#### Step 3: Prebuild Native Projects
```bash
npx expo prebuild --platform android
```

This will create the `android/` folder with native code.

#### Step 4: Build APK with Gradle
```bash
cd android
.\gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Alternative: Using Expo's Local Build

```bash
npx expo run:android --variant release
```

## If You Can't Install Android Studio

### Option 1: Use Mobile Data/Different Network
Your ISP or firewall might be blocking api.expo.dev. Try:
- Mobile hotspot
- VPN
- Different network

Then run:
```bash
cd C:\Projects\1000ravier-mobileapp\packages\mobile
eas build --profile preview --platform android
```

### Option 2: Build on a Cloud VM
1. Spin up a cloud VM (AWS, Azure, Google Cloud)
2. Clone your repo
3. Run EAS build there
4. Download the APK

### Option 3: Use GitHub Actions
Create `.github/workflows/build.yml`:

```yaml
name: Build APK

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        working-directory: packages/mobile
        run: npm install
      
      - name: Build APK
        working-directory: packages/mobile
        run: eas build --platform android --profile preview --non-interactive
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: packages/mobile/*.apk
```

## Quick Test Build (Development)

If you just want to test on your phone quickly:

### Option A: Use Expo Go (Fastest - No Build Needed!)
1. Install Expo Go from Play Store
2. Run: `npm start` in your mobile package
3. Scan QR code with Expo Go
4. App runs instantly!

**This is the easiest way to test your app!**

### Option B: Generate Development Build APK
```bash
cd packages/mobile
npx expo install expo-dev-client
eas build --profile development --platform android
```

## Checking Network Connectivity

Test if you can reach Expo:
```bash
curl -v https://api.expo.dev/
ping api.expo.dev
```

If these fail, it's a network issue. Solutions:
1. Check firewall settings
2. Try different network
3. Use VPN
4. Contact your ISP

## Current Status

✅ Project configured with EAS
✅ Project ID: 3c0a07bf-5842-46cf-9a9c-3f3dafc905ae
✅ eas.json created
✅ Git repository initialized
✅ Code committed

❌ Network connectivity blocking EAS Build

## Recommended Path Forward

**For Testing (Easiest)**:
```bash
cd C:\Projects\1000ravier-mobileapp\packages\mobile
npm start
# Scan with Expo Go on your phone
```

**For APK (When Network Works)**:
```bash
eas build --profile preview --platform android
```

**For APK (Without EAS)**:
1. Install Android Studio
2. Run `npx expo prebuild`
3. Run `cd android && .\gradlew assembleRelease`

---

## What's Already Working

Your app is **fully functional** and can be tested right now using Expo Go:
- ✅ All screens
- ✅ Authentication
- ✅ Backend integration
- ✅ Simulated ads
- ✅ Navigation
- ✅ State management

You don't need an APK to test - Expo Go works perfectly!
