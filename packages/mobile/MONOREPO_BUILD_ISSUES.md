# Monorepo Build Issues and Solutions

## Problem

When building a release APK locally with `gradlew assembleRelease`, Metro bundler fails with:

```
Error: Unable to resolve module ./index.js from C:\Projects\1000ravier-mobileapp/.:
None of these files exist:
  * ../../index.js(...variants...)
```

This happens because:
1. Metro detects the workspace root (`C:\Projects\1000ravier-mobileapp`) as the project root
2. The gradle build tries to resolve the entry point relative to the package (`packages/mobile`)
3. Metro looks for `../../index.js` from the workspace root (which would be outside the project)

## Why This Happens

Expo/Metro monorepo support in local native builds is incomplete. The `metro.config.js` `projectRoot` setting isn't fully respected during `expo export:embed` (used by gradle builds).

## Solutions

### Option 1: Use EAS Build (Recommended)

EAS Build properly handles monorepos and avoids local network/dependency issues:

```powershell
# From packages/mobile directory
eas build --platform android --profile preview
```

**Advantages:**
- Handles monorepo project detection correctly
- Runs in cloud with reliable network access
- No local environment issues
- Produces signed, optimized APKs

**Setup:**
1. Already configured with `eas.json`
2. Project ID already set in `app.json`
3. Just run the command above

### Option 2: Use Expo Go for Development

Continue using Expo Go with simulated ads for development:

```powershell
npm start
```

Then scan QR code with Expo Go app. This works perfectly and avoids build complexity.

### Option 3: Fix Metro Configuration (Advanced)

To fix local builds, you need to ensure Metro uses the correct project root. The workspace root files (`index.js` and `metro.config.js`) were created to help, but additional configuration may be needed:

1. **Ensure gradle uses correct working directory:**
   - The build must run from `packages/mobile/android`, not workspace root
   
2. **Set environment variables:**
   ```powershell
   $env:NODE_ENV="production"
   $env:EXPO_PROJECT_ROOT="C:\Projects\1000ravier-mobileapp\packages\mobile"
   ```

3. **Use relative paths in build.gradle:**
   Currently line 5 sets: `def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()`
   This should point to the mobile package directory.

4. **Verify entry point resolution:**
   ```powershell
   # From packages/mobile directory
   npx expo export:embed --platform android --bundle-output test.bundle --dev false
   ```
   If this fails with the same error, Metro config needs more work.

### Option 4: Move Mobile Package to Root (Not Recommended)

Restructure to avoid monorepo complexity, but loses shared code benefits.

## Current Blockers

1. **Metro Resolution Issue:** Metro tries to resolve `./index.js` from wrong context
2. **Network Issues:** Local builds fail due to inability to download dependencies from:
   - `jcenter.bintray.com` (deprecated, causing Kotlin plugin failures)
   - `repo.maven.apache.org` (Maven Central timeouts)
   - `api.expo.dev` (EAS API connectivity)

## Recommended Action

**Use EAS Build** to avoid all these issues:

```powershell
cd C:\Projects\1000ravier-mobileapp\packages\mobile
eas build --platform android --profile preview
```

This will:
- ✅ Handle monorepo correctly
- ✅ Download dependencies reliably  
- ✅ Produce a ready-to-install APK
- ✅ Sign the APK automatically
- ✅ Take 10-15 minutes

The APK download link will be provided when the build completes.

## Development Workflow

While waiting for EAS builds:
1. Use `npm start` + Expo Go for rapid development
2. Test with simulated ads (already configured)
3. Use EAS Build for APKs to test on physical devices
4. Eventually configure real AdMob IDs when ready for production
