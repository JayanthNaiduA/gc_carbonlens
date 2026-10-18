# Selecting demo or Firebase sign-in

The PowerShell error `A parameter cannot be found ... AuthMode` happens before
Flutter or Firebase starts. `dev.ps1` now accepts `-AuthMode demo` and
`-AuthMode firebase` for RunPhone, RunWeb and BuildApk. Demo remains the default.

Run the local demo on an already-running Android emulator:

```powershell
.\infra\scripts\dev.ps1 -Task RunPhone -AuthMode demo -Approved -DeviceId emulator-5554
```

Demo does not require Firebase configuration or enabled authentication providers.
RunPhone uses the selected device; it does not create or start the emulator.

If a demo build previously failed at `:app:processDebugGoogleServices` with
"No matching client found", the native build was processing a Firebase file for
another package even though Firebase was disabled in Dart. The Android build now
reads Flutter's encoded AUTH_MODE and applies Google Services only in Firebase
mode. Re-run the demo command above; no config deletion or package change is needed.
Firebase mode still requires the correct configuration and retains the preflight.

Kotlin-plugin migration and SDK XML-version messages are separate warnings from
that fatal configuration error. Keep the current compatibility flags while the
locked FlutterFire plugins still use KGP; migrate the app and plugins together
after reviewing compatible versions. See the
[official built-in Kotlin guide](https://docs.flutter.dev/release/breaking-changes/migrate-to-built-in-kotlin/for-app-developers).

## Real Firebase sign-in

The app uses FlutterFire's locked `firebase_auth` package, which already adds the
native Firebase Auth SDK and the Firebase BoM supplied by `firebase_core`.
Google Services is versioned in `android/settings.gradle.kts` and applied by the
app only for Firebase mode. Do not copy the Console's generic native Analytics/BoM
sample into `android/app/build.gradle.kts`; authentication does not need Analytics
or an additional app-level BoM override. The duplicate plugin declaration and
copied Analytics/BoM block were removed during the 2026-10-15 Gradle review.

1. In Firebase Console, register an Android app matching the current
   `applicationId`: `com.example.carbonlens_flutter`. Register the actual debug
   signing certificate SHA-1/SHA-256 for Google sign-in. Production signing
   certificates must be registered separately when a release identity is chosen.
2. In Authentication → Sign-in method, enable Google and Phone. Enable Email/Password
   if retaining the existing email/password sign-in as well,
   according to the sign-in method being tested. Complete Google's support-email
   configuration when enabling Google.
3. Edit the ignored `apps/carbonlens_flutter/config/firebase.local.json` locally,
   using `firebase.example.json` as the field template. Preserve an existing file;
   do not overwrite it with the blank example. The launcher passes the file to
   Flutter without reading or printing its values.

| Field | Value needed by this app |
|---|---|
| `AUTH_MODE` | `firebase`; the launcher also forces this mode explicitly |
| `FIREBASE_API_KEY` | Firebase client API key for the registered app |
| `FIREBASE_APP_ID` | Android app's Firebase App ID |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase project number |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `GOOGLE_SERVER_CLIENT_ID` | Web OAuth client ID for native Google sign-in; not an Android client ID or client secret |
| `FIREBASE_STORAGE_BUCKET` | Configured private bucket when scan/upload is enabled |
| `FIREBASE_AUTH_DOMAIN` | Required for web sign-in; optional for Android |
| `API_BASE_URL` | Required HTTPS API endpoint for enrollment, profiles and privacy preferences; blank keeps enrollment blocked |
| `APP_CHECK_WEB_SITE_KEY` | Required for protected API access on web, not Android |
| `APP_CHECK_DEBUG` | `true` only for a debug emulator/device with its debug token registered in Console; release rejects this option |
| `USE_AUTH_EMULATOR` | `false` for real Firebase; distinct from running the Android app on an emulator |

Use Android app settings for Android App ID/API key; do not substitute a Web App ID.
Client configuration is not a service-account credential. No passwords, OAuth
client secrets, private signing keys or service-account JSON belong in this file.

An empty `API_BASE_URL` now produces a warning rather than blocking the Android
launcher. This allows real Google/phone/email authentication to be tested before
the backend is deployed. After sign-in, the profile gate reports the missing
service and provides sign-out/retry; it does not complete enrollment or fabricate
a profile. Verify the sign-in account in Firebase Authentication > Users.
A non-empty backend URL still must be valid HTTPS; configured API requests still
require Firebase identity and App Check.

4. Complete the native config, Phone, App Check and backend checklist in
   [the enrollment implementation and setup report](firebase-enrollment-review.md).
   The current native config does not match the application package; native and
   Dart config disagree about project/app settings. Values were not printed and
   both files were preserved. Re-download the intended app's configuration after
   enabling Google and registering fingerprints. Do not paste privileged keys.

5. Run the read-only check, then start the selected device:

```powershell
.\infra\scripts\check-firebase.ps1
.\infra\scripts\dev.ps1 -Task RunPhone -AuthMode firebase -Approved -DeviceId emulator-5554
```

Missing file detection occurs before launching Flutter. The app then validates
required fields and shows a configuration error for missing values. Enabling
Firebase mode does not configure a backend, register certificates or enable
providers automatically. Successful sign-in does not prove protected API or
upload integration works. Android protected APIs default to Play Integrity;
the attestation environment needs separate verification on the intended device.

Official references:

- [Enable email/password authentication](https://firebase.google.com/docs/auth/flutter/password-auth).
- [Google and other federated sign-in](https://firebase.google.com/docs/auth/flutter/federated-auth).

This change installs nothing and does not change Firebase Console settings.
