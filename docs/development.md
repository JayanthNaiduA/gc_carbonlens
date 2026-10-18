# Test CarbonLens on an 8 GB Windows laptop

## Recommended profile

Use the Flutter browser demo for daily UI checks. Use one physical Android phone
when you need native camera/Google sign-in/Health Connect validation.
Keep the Android emulator optional, preferably on a machine with more memory.
Do not run Android Studio, an emulator and a container stack together on this laptop.

Google lists 8 GB for Android Studio alone and 16 GB for Studio plus Emulator:
https://developer.android.com/studio/install
This is a recommendation for the combined stack, not a claim that an emulator alone
can never run on 8 GB. Actual memory use depends on the machine and workload.

Browser checks do not validate native Android integrations.

## Portable project setup

The scripts derive the checkout root from their location. The repository can live
on any drive; it does not require H:\gc_japac on another laptop.
All generated SDKs, package caches, temp directories and optional AVD data go under
the ignored .tools/ directory. No global PATH or persistent environment changes.

Flutter is pinned to 3.47.7 and its exact Git revision in dev-environment.json.
Direct package versions are proposed in pubspec.proposed.yaml. The first approved
restore creates pubspec.lock; commit the active manifest and lockfile so teammates
resolve the same transitive dependencies. Do not fabricate or hand-edit the lockfile.

Prerequisites: 64-bit Windows, Git and an existing Edge/Chrome browser.
The browser profile does not need Java, Android Studio, Android SDK, Docker,
Firebase CLI, a Google login or a billing account.
Other operating systems use the manual instructions in CONTRIBUTING.md.

## One-time browser setup

Read AGENTS.md and approve the downloads/installations before running these commands.
Run them in PowerShell from the checkout root:

```powershell
.\infra\scripts\dev.ps1 -Task Inspect
.\infra\scripts\dev.ps1 -Task InstallSdk -Approved
.\infra\scripts\dev.ps1 -Task PrepareApp -Approved
.\infra\scripts\dev.ps1 -Task Check -Approved
.\infra\scripts\dev.ps1 -Task RunWeb -Approved
```

InstallSdk clones the pinned official Flutter tag, verifies the revision and precaches
web artifacts. PrepareApp backs up only the known initial scaffold, activates the
reviewed manifest if needed, restores packages and formats source.
Existing active application manifests are preserved.

Check runs format verification, static analysis and all Flutter tests serially.
RunWeb runs a foreground local demo on 127.0.0.1:8080. Open
http://127.0.0.1:8080 in Edge or Chrome. q or Ctrl+C stops the Flutter session.
For an initial check, leave it running only while reviewing the app, about 15 minutes.
No production backend, Firebase account or protected API is contacted by demo authentication.
Flutter build tooling/web assets may need internet access on their first use.

The scripts require -Approved for actions beyond read-only inspection. Passing that
flag is a manual user's acknowledgement of the reviewed action; Codex must still obtain
your actual approval before invoking it.

## What to check in the app

1. See the LOCAL DEMO notice and choose Explore demo as John.
2. Check that every consent preference initially starts off.
3. Continue with all preferences off.
4. See the dashboard and four pillar descriptions.
5. Confirm carbon, score and points are unavailable rather than invented numbers.
6. Review privacy preferences and sign out.
7. Sign in again and confirm another session does not inherit prior consent.

Use browser responsive/device controls to inspect phone-width layouts.
This is the actual Flutter source, not a separate HTML mockup.
The app currently contains login/consent/dashboard functionality only; backend evidence,
calculation, rewards and persistent consent remain future integration work.

## Daily workflow

After pulling source changes:

```powershell
.\infra\scripts\dev.ps1 -Task PrepareApp -Approved
.\infra\scripts\dev.ps1 -Task Check -Approved
.\infra\scripts\dev.ps1 -Task RunWeb -Approved
```

PrepareApp enforces an existing dependency lockfile; a changed manifest/lock mismatch
requires deliberate review rather than an automatic dependency upgrade.
While the Flutter session is running, follow its hot reload/restart prompts to see edits.
Close unused browser tabs and run one test/build process at a time.

## Optional physical Android phone

This requires additional Android SDK/build tools, the pinned NDK and a compatible Java
runtime. It downloads additional packages but does not need an emulator or Android Studio.

```powershell
.\infra\scripts\prepare-android.ps1 -Phase InstallTools -SkipEmulator -Approved
.\infra\scripts\prepare-android.ps1 -Phase PrepareApp -Approved -Organization com.example
.\infra\scripts\dev.ps1 -Task RunPhone -Approved -DeviceId YOUR_DEVICE_ID
```

The example native package is com.example.carbonlens_flutter. Confirm the final package
before registering Firebase. This pinned Flutter version requires Android API 24 or newer.
Enable USB debugging on your own phone and accept its USB authorization prompt yourself.
Any Windows USB driver installation needs separate approval.

RunPhone selects only the device ID you provide; it does not automatically pick a device.

`RunPhone`, `RunWeb` and `BuildApk` accept `-AuthMode demo` (the default) or
`-AuthMode firebase`. Demo requires no Firebase account. Firebase mode loads the
ignored `apps/carbonlens_flutter/config/firebase.local.json` without printing
values. See [Firebase sign-in setup](firebase-signin-setup.md) for required fields
and provider settings.
If you need to list devices, do so with your approved SDK tooling in the same environment.
Gradle uses one worker, no persistent daemon and a 1536 MB heap cap for this small project.
That cap is not a guarantee of total memory consumption or build success.

## Optional emulator

The original Android phases remain available without -SkipEmulator. They install an
AVD image and launch one visible 2048 MB / two-core emulator after approval.
Do not enable virtualization, install acceleration drivers or change BIOS settings
automatically. Those are separate system changes.
See android_setup.md for the emulator's ports and lifecycle.

## Share progress without a development environment

After the Android platform and dependencies are prepared:

```powershell
.\infra\scripts\dev.ps1 -Task BuildApk -Approved
```

The output is apps/carbonlens_flutter/build/app/outputs/flutter-apk/app-debug.apk.
A tester with a supported phone can use this debug demo APK without Flutter/Android Studio.
It contains local demo sign-in and does not prove real Firebase authentication.
Share only with intended testers; do not upload it from this chat without authorization.
Firebase App Distribution or Google Drive can be chosen later.

For a public browser link, Firebase Hosting is the HLD deployment destination.
Publishing is a separate approved step requiring a reviewed release configuration.
Current demo mode deliberately fails in release builds; RunWeb and BuildApk use debug.

## Real Firebase configuration

Each authorized developer fills ignored config/firebase.local.json privately from the
blank example using a registered app. Never put account passwords, session tokens,
service-account keys or signing keystores into GitHub.
Real sign-in needs enabled providers, matching Android identity/certificates or authorized
web domains, and later App Check for protected backend requests.
Demo mode is sufficient to inspect current UI progress without any Firebase account.

## Current verification status

Flutter analysis, 37 offline Flutter tests, 30 backend tests and debug web compilation
pass with the project-local toolchain. Native Firebase APK/device checks remain
blocked by incorrect Firebase config and the missing local Android SDK. See the
[Firebase enrollment report](firebase-enrollment-review.md) for source changes,
actual test results, Console steps and device commands.
