# ScreenMindr — Native iOS Shield Build Guide

The native FamilyControls shield (`modules/expo-screen-shield`) does NOT run in Expo Go.
You need a custom **Expo Dev Client** build.

## Prerequisites

- Apple Developer account (free works for personal device, paid $99/yr for App Store)
- Real iPhone running iOS 16+
- EAS CLI: `npm install -g eas-cli`
- Logged in: `eas login`

## First-time setup

```bash
cd fe

# 1. Login to EAS
eas login

# 2. Configure project (creates an EAS project ID)
eas init

# 3. Build a development client for your iPhone
eas build --profile development --platform ios
```

EAS will:
- Ask for your Apple Developer credentials (or generate a new provisioning profile)
- Inject the `com.apple.developer.family-controls` entitlement automatically (via the `expo-screen-shield/plugin` config plugin)
- Build the app on EAS cloud (~10–15 min first time)
- Output an installable `.ipa` URL — open on your iPhone Safari → install

## Local Xcode build (alternative)

```bash
cd fe
npx expo prebuild --clean --platform ios
cd ios
pod install
open ScreenMindr.xcworkspace
```

In Xcode:
- Select your team in Signing & Capabilities
- Capabilities should already include "Family Controls" + "App Groups" via the entitlements file
- Build to your iPhone (real device only, simulator can't fully test FamilyControls)

## Day-to-day dev loop

After first build, you can keep iterating just on JS:

```bash
cd fe
npx expo start --dev-client --tunnel
```

Open the dev client app on your iPhone → it'll connect to the Metro bundler.
Native module changes (Swift) require a new build via `eas build` or local Xcode.

## Verifying the shield works

1. Open the dev-client app on iPhone, sign in as child (vuxuananh23@gmail.com / 123456)
2. **Switch to parent for setup**: sign out, sign in as parent → Menu → Restricted apps
3. Tap "Authorize" — iOS will prompt for Family Controls (parent enters Apple ID password if Screen Time is set up)
4. Tap "Pick apps" — native iOS picker shows all installed apps + categories
5. Select TikTok, YouTube, Instagram → Done
6. Tap "Lock now" — apps are now shielded
7. Open TikTok from Home Screen — you'll see the iOS shield overlay "App locked"

8. Switch back to child account
9. Complete a mission (Walk 20 steps) → BE issues screen-time reward
10. App.tsx auto-calls `unshieldFor(minutes)` — TikTok unlocked for that window
11. Timer ends → app re-applies shield

## Limitations of current implementation

- **No DeviceActivityMonitor extension yet** — re-shield happens via JS setTimeout while app is running. If user kills the app during the unshield window, re-shield only happens when app is reopened.
- **For production**: add a separate `ScreenShieldMonitor` target (DeviceActivityMonitor subclass) that fires on `intervalDidEnd` to re-shield reliably.

## Troubleshooting

- **"FamilyControls not approved"**: Open iPhone Settings → Screen Time → ensure it's set up. ScreenMindr requests authorization for `.individual` (single-user mode).
- **Build fails with entitlement error**: Apple sometimes requires manual approval for Family Controls in App Store Connect. Personal team builds work for dev/testing.
- **Picker doesn't show apps**: Authorization didn't succeed. Re-tap Authorize.
