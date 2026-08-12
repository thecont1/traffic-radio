# Building an installable app (Android APK / iOS)

The project is fully configured for EAS Build (`eas.json`, app identifiers in
`app.json`). Builds run on Expo's servers — you only need a free Expo account.

## One-time setup (on your own machine)

1. Download the code ("Save to GitHub" or code download), then:
   ```bash
   cd frontend
   yarn install
   npm install -g eas-cli
   ```
2. Create a free account at https://expo.dev/signup, then:
   ```bash
   eas login
   eas init          # links the project to your account (writes projectId)
   ```

## Android — installable APK

```bash
eas build --profile preview --platform android
```

When it finishes, Expo gives you a download link/QR. Open it on your phone and
install the APK directly (allow "install from unknown sources" if prompted).
Haptics work on the real device.

## iOS

iOS requires an Apple Developer account ($99/yr) for installable builds:

```bash
eas build --profile preview --platform ios
```

For quick testing without an Apple account, use **Expo Go** instead:

```bash
npx expo start
```

Scan the QR code with the Expo Go app (App Store / Play Store).

## Store-ready builds

```bash
eas build --profile production --platform all
eas submit --platform android   # or ios
```
