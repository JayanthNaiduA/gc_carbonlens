# Android authentication development

## Current 8 GB laptop profile

Use development.md for the portable browser-first environment.
The Android script now derives the checkout root and shares the pinned Flutter definition.
InstallTools -SkipEmulator installs phone build tools without an AVD.
prepare-android.ps1 remains the optional emulator route, not the default for an 8 GB laptop.
When finished, stop Flutter and close the emulator window; stopping Flutter alone does
not stop the separate emulator process.

## Implemented source

Flutter Firebase login -> persisted profile completion -> privacy preferences -> dashboard -> sign-out.
Firebase adapter includes Google and phone OTP, verified contact changes and linking,
plus the existing email/password flows. Local demo remains a separate debug mode in the same app.
Protected API headers require Firebase identity and App Check; demo is blocked.
Firebase preferences are restored through the protected API and reset for another UID.
Flutter 3.47.7, the locked FlutterFire packages and the Android host are present.
Analysis, offline tests and Flutter widget screenshots have been checked. The local
Android SDK is missing; native APK and real device/Firebase verification remain blocked.
See [the Firebase enrollment report](firebase-enrollment-review.md) for actual results.

## Proposed setup, only after approval

The reviewed script is infra/scripts/prepare-android.ps1. It has separate phases:

1. InstallTools downloads the pinned official Flutter SDK and official Android
   command-line tools, verifies the Android ZIP SHA-256, installs SDK packages and creates
   a project-local AVD. SDK licenses are presented interactively.
2. PrepareApp generates an isolated Android template, copies only native Android files
   without replacing existing source, activates the reviewed manifest with a backup,
   installs packages and runs formatting checks, analysis and tests.
3. LaunchDemo checks hardware acceleration, launches a visible Android emulator and
   runs the Flutter demo. It does not configure Firebase or any GCP service.

From H:\gc_japac, proposed commands (not executed):

```powershell
& .\infra\scripts\prepare-android.ps1 -Phase InstallTools -Approved
& .\infra\scripts\prepare-android.ps1 -Phase PrepareApp -Approved -Organization com.example
& .\infra\scripts\prepare-android.ps1 -Phase LaunchDemo -Approved
```

Register the existing application ID `com.example.carbonlens_flutter` in the intended
Firebase project; do not change the package to match a config for another app.

Downloads may consume several GB of disk/network. Emulator memory is capped at 2048 MB
and uses two CPU cores. ADB listens locally on 5037; emulator uses 5554/5555; Flutter's
VM service is requested on 8181. No firewall/virtualization/global PATH changes occur.
LaunchDemo uses a visible interactive emulator for checking the app, for a roughly
15-minute initial test session, then it should be stopped.
Virtualization/acceleration fixes require separate approval and are never installed here.

Tool caches, temporary directories, Gradle data and AVD data are directed inside .tools/.
Environment overrides are process-local and restored after the script. Windows Flutter
configuration is redirected via APPDATA within that process; no global environment is changed.
Android tooling may still reveal an additional runtime prerequisite. Stop and review
any action that would access outside the approved workspace.

## Real Firebase login later

- Confirm the Firebase project ID and Android registration.
- Enable Google and Phone providers; Email/Password is optional for the existing email flow.
- Configure the matching package, SHA-1/SHA-256 and web OAuth client ID.
- Fill config/firebase.local.json privately from config/firebase.example.json.
- Launch using the local config file once real authentication is approved/configured.
- Use dummy test users; never send passwords, tokens or service-account files in chat.
- Configure API_BASE_URL to the deployed HTTPS API. Enrollment needs the profile service.
  Register an App Check debug token for debug emulator testing; retain production enforcement.
- Firebase SDKs own session credentials; this app never logs or persists passwords.

Optional Firebase Authentication Emulator mode is separate from the Android device emulator.
The code supports it, but Firebase CLI/server setup is not included or started.

## References

- Firebase Flutter setup: https://firebase.google.com/docs/flutter/setup
- Firebase email authentication: https://firebase.google.com/docs/auth/flutter/start
- Google sign-in: https://firebase.google.com/docs/auth/flutter/federated-auth
- App Check: https://firebase.google.com/docs/app-check/flutter/default-providers
- Android command-line tools: https://developer.android.com/studio
