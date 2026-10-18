# Firebase enrollment implementation and setup

Reviewed on 2026-10-14. Source workflows are implemented in the existing app.
Live Firebase/device verification is incomplete because local configuration and
Android tooling are not ready. No Firebase Console change, real SMS, deployment,
dependency installation, commit or push was performed during this work.

## Existing architecture and design constraints

The mobile module is `apps/carbonlens_flutter`, a Flutter Material 3 application
with a Kotlin Android host. It does not use Compose or XML for its application UI.
`MainActivity.kt` hosts Flutter and the existing capture integration. The package
and application ID remain `com.example.carbonlens_flutter`; min SDK is 24.
The Android project declares AGP 9.1.0, Kotlin 2.4.0, Gradle wrapper 9.3.1 and Java 17.
Compile/target SDK and NDK come from the pinned Flutter toolchain; the reviewed
local setup specifies Android 36, build tools 36.0.0 and NDK 28.2.13676358.
Only debug signing is configured; the existing release build also uses debug
signing and is not ready for production distribution.

`main.dart` and `bootstrapApp` initialize configuration and the official Firebase
SDKs. `CarbonLensApp` observes `AuthController`; screen/controller/repository
boundaries use ChangeNotifier and constructor injection. The transport attaches
Firebase ID tokens and App Check tokens. The Python modular WSGI backend verifies
identity before deriving the UID; its configured cloud adapter uses Firebase
Admin and Firestore. Firebase SDKs own session credentials, not a local login flag.

Authentication previously supported Google and email/password but lacked phone
verification and persisted enrollment/profile coordination. Existing demo and
sustainability features were preserved. The HLD v2.1, LLD v1.0 and supplied UI
reference sheet were inspected. LLD operational schema `users/{uid}` specifies
`display_name`, `region`, `created_at`, `status` and backend-controlled updates;
this implementation extends that store rather than adding another database.
Screens reuse the existing green/mint colors, typography, cards, forms and shells.

## Dependencies and configuration changes

| Component | Implementation |
|---|---|
| Existing locked Flutter packages | firebase_core 4.15.0, firebase_auth 6.7.0, firebase_app_check 0.4.8, google_sign_in 7.2.0 |
| Android Firebase SDK | Supplied by official FlutterFire plugins; firebase_core pins Firebase BoM 34.19.0 |
| Google identity | Locked google_sign_in_android 7.2.17 uses Android Credential Manager |
| Google Services Gradle plugin | Declared 4.5.0; applied only for AUTH_MODE=firebase with native app/debug config present |
| Backend source requirements | firebase-admin 7.7.0, Gunicorn 26.2.0 for Unix/Cloud Run |
| Container source | Python 3.11, non-root worker, listens on Cloud Run PORT |

No new Flutter package or client Firestore package was added. The already locked
FlutterFire BoM is retained to preserve compatibility; this is not a claim that
it is the latest BoM. Plugin/dependency resolution still needs approval before a
native build downloads anything. See [official Android setup](https://firebase.google.com/docs/android/setup).
The server pins are prepared from the official
[Firebase Admin release](https://pypi.org/project/firebase-admin/) and
[Gunicorn release](https://pypi.org/project/gunicorn/); their installation and
container execution have not been tested here.

The ignored native and Dart config files were checked in memory, without printing
their values. They fail package/project/app-ID/project-number/client-key alignment.
The Web OAuth client ID and HTTPS backend URL are also absent. Both files were
preserved. `infra/scripts/check-firebase.ps1` now reports these checks safely and
the Firebase Android launch/build path stops before using mismatched configuration.

## Authentication, enrollment and profile behavior

Google uses `GoogleSignIn.instance.initialize(serverClientId: ...)`, native
`authenticate()`, a Google ID token, and `GoogleAuthProvider.credential` exchanged
through Firebase Auth. Web retains the Firebase popup flow. Cancellation is
handled without displaying a failed-login error. Configuration, network and
credential failures use safe messages. AdditionalUserInfo detects first Firebase
sign-in; the persisted profile, rather than that flag, decides enrollment.
The required server client ID is the **Web application OAuth client ID**, never
an Android client ID or client secret. See
[Google authentication](https://firebase.google.com/docs/auth/android/google-signin).

Phone entry shows country calling code and asks for SMS consent. National Indian
numbers and explicit international numbers are normalized/validated; national
trunk zeroes are rejected rather than guessed. Firebase `verifyPhoneNumber`
handles code-sent, automatic verification, failures and retrieval timeout.
Six-digit manual input is exchanged through PhoneAuthProvider and Firebase Auth.
Only successful SDK credential operations complete verification. Resend has a
60-second cooldown and passes Firebase's resend token. Duplicate sends/verification
are blocked, stale callbacks are ignored, and back navigation invalidates the old
challenge. Challenges are in memory; an app process restart before verification
requires starting the phone flow again. OTPs are never written to local storage,
Firestore or logs. Android phone verification is supported; this new phone UI is
not a web reCAPTCHA implementation. See
[Flutter phone authentication](https://firebase.google.com/docs/auth/flutter/phone-auth).

After either provider authenticates, SessionGate retrieves `/v1/me` and existing
privacy preferences. New/missing/incomplete profiles require a valid display name
(2–80 characters) and two-letter country/region code. Completion occurs only after
the protected API saves those fields. Failure keeps enrollment gated and retryable.
An existing complete profile resumes the dashboard after privacy restoration;
an interrupted enrollment resumes the same UID's incomplete profile. Missing
backend configuration prevents enrollment from falsely completing.

Settings → View and edit profile displays available verified email/phone/photo,
provider identities and app profile fields. Editing has validation, Save/Cancel,
loading, error and success states. Concurrent saves are blocked and version
conflicts require refresh. Verified contact details refresh from Firebase Admin.
Phone changes verify a new credential before `updatePhoneNumber`; linking uses
`linkWithCredential`. Email changes use `verifyBeforeUpdateEmail`, not a plain
profile edit. Firebase's recent-login errors guide the user to confirm Google,
password or current-phone OTP identity, then retry. Google linking uses
`linkWithCredential`/web popup on the current Firebase user. Credential conflicts
do not merge accounts. See [account linking](https://firebase.google.com/docs/auth/flutter/account-linking)
and [managing Firebase users](https://firebase.google.com/docs/auth/flutter/manage-users).

The SDK restores sessions and refreshes ID tokens. UID changes and logout clear
profile and consent state. An API 401 during profile load/save signs out and
returns to authentication. The backend checks revoked ID tokens. Other protected
feature requests report their safe API errors; no access is granted on failure.

## Persistence and authorization

| Field | Source of truth |
|---|---|
| UID | Firebase Auth, derived from verified backend token; document path users/{uid} |
| Name, region, completion, status, versions | Backend-controlled Firestore profile |
| Email, email verification, phone, photo, providers | Firebase Auth, read through Admin SDK |
| created_at / updated_at | Backend UTC clock, never client-submitted timestamps |
| Firebase display name | Cosmetic mirror updated after the application profile saves |

`GET /v1/me` atomically creates an incomplete profile at most once. `PUT /v1/me`
allows only display_name, region and expected_version. The backend rejects UID,
contact, completion, role and timestamp edits. Optimistic versions prevent stale
updates; UID-scoped request guards provide replay protection. A server-only
operation marker also handles a retry after a committed save whose request-guard
completion was interrupted. No password, token or OTP is stored in the profile.

The checked-in Firestore rules allow a signed-in user to get their own document,
deny collection lists and every client write, and deny other paths. Backend Admin
SDK writes bypass rules, so backend ownership/allowlisting and runtime IAM are
essential. No index is required for direct UID document access. Rules were reviewed
but have **not** been deployed or executed against a Firebase emulator/live database.
Backend ownership tests do not substitute for a live Security Rules test.

## Firebase Console checklist still required

1. Select the intended existing Firebase development project. Do not replace it
   with an environment inferred from a mismatching config file.
2. Project settings → Your apps: register/select Android package
   `com.example.carbonlens_flutter`. Add the actual debug certificate SHA-1 and
   SHA-256. After SDK/build approval, obtain them with the project-local Gradle
   signingReport command below. Register release/Play signing separately later.
3. Authentication → Sign-in method: enable Google and select a support email;
   enable Phone. Enable Email/Password if retaining that existing sign-in option.
4. Download the Android google-services.json again after Google/SHA setup. Confirm
   package and project. Preserve the old environment file before deliberately
   placing the correct file in `apps/carbonlens_flutter/android/app/` (or
   `android/app/src/debug/` for debug-only config). Do not use a Web app's file.
5. Update the ignored `config/firebase.local.json` locally: AUTH_MODE=firebase,
   FIREBASE_API_KEY, FIREBASE_APP_ID, FIREBASE_MESSAGING_SENDER_ID and
   FIREBASE_PROJECT_ID from that same Android registration; GOOGLE_SERVER_CLIENT_ID
   from Google's **Web** OAuth client. Keep USE_AUTH_EMULATOR=false. No client secret
   or service-account private key belongs here. The example contains placeholders.
6. Authentication → Settings → SMS region policy: explicitly permit test countries
   (including India when needed). New projects may default to no allowed regions.
   Phone app verification requires SHA-256 for Play Integrity and SHA-1 for the
   reCAPTCHA fallback. Sideloaded APKs may use that fallback. Ensure the client key's
   restrictions permit the Firebase auth handler domain; do not weaken unrelated
   keys or disable verification. See [Android phone setup](https://firebase.google.com/docs/auth/android/phone-auth).
7. Under the Phone provider, configure fictional test numbers and private test
   codes. Enter those codes manually in the installed app. No real SMS is sent
   for a configured fictional number. Real verification SMS requires the Blaze
   plan and is subject to quotas/abuse controls; do not run repeated real-SMS
   automated tests. See [current Auth limits](https://firebase.google.com/docs/auth/limits).
8. Create/confirm the intended Firestore Native/default database and region only
   with database-creation approval. In Rules, review and publish
   `firebase/rules/firestore.rules` for that environment. Rules Playground:
   unauthenticated get fails; uid-a get users/uid-a succeeds; uid-a get users/uid-b,
   list and all writes fail. Also test with [the official rules emulator workflow](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
   once its tools/services are separately approved. Do not publish open rules.
9. Deploy the prepared backend after upload/build/billing/IAM approval. Attach a
   runtime service account with the required Firestore operations and Firebase
   Auth user-read permission. Do not download a service-account key. Set
   CARBONLENS_CLOUD_RUNTIME=1, CARBONLENS_PROFILE_ONLY=1 and FIREBASE_PROJECT_ID.
   Profile-only mode avoids requiring scientific BigQuery reference tables and
   supplies no synthetic results. Use [Admin workload credentials](https://firebase.google.com/docs/admin/setup).
10. Set API_BASE_URL to that service's HTTPS URL. Transport access must allow the
    Android client to reach the service; app routes still validate Firebase tokens
    and App Check. Cloud Run IAM expects Google IAM tokens, not Firebase ID tokens,
    so review ingress/auth policy as part of deployment. This service exposes only
    health/version without app authentication. Existing HLD adapters/data are
    still required for the full sustainability features.
11. App Check: register the Android app and production Play Integrity configuration.
    For a local emulator/debug device, set APP_CHECK_DEBUG=true in private debug
    config and register the SDK-generated debug token under Manage debug tokens.
    Read/copy that token privately; never paste it in chat or commit it. Backend
    verification remains enabled. Release rejects the debug flag. Phone Auth's
    own app verification and API App Check are separate checks. See
    [Flutter debug-provider setup](https://firebase.google.com/docs/app-check/flutter/debug-provider).
12. Optional web testing needs a separate matching Web Firebase registration,
    auth domain, authorized domains and web App Check site key. Do not reuse an
    Android App ID as a Web App ID. Android device emulation is not the Firebase
    Authentication Emulator; the latter does not test live Google identity.

## Build, install and run

Run from `H:\gc_japac`. The first check is read-only:

```powershell
.\infra\scripts\check-firebase.ps1
```

Android tools are missing. These setup/build/device commands are instructions,
not actions already executed. SDK installation/downloads and service starts need
the explicit approvals required by AGENTS.md. Existing Flutter/packages need no
reinstallation. Prefer a physical phone on an 8 GB laptop:

A Java command is discoverable, but `java -version` did not return during this
session and was cancelled. Verify a working JDK 17 or later compatible with the
declared Gradle/AGP versions before SDK license handling/native compilation.
No Java installation or system change was made.

```powershell
# After local SDK installation approval; presents SDK license terms interactively.
.\infra\scripts\prepare-android.ps1 -Phase InstallTools -Approved -SkipEmulator

# After configuration checks pass; native resolution may download Gradle/Maven artifacts.
.\infra\scripts\dev.ps1 -Task BuildApk -AuthMode firebase -Approved

# Already-running emulator, with Firebase test numbers and registered App Check debug token:
.\infra\scripts\dev.ps1 -Task RunPhone -AuthMode firebase -Approved -DeviceId emulator-5554

# Physical phone: enable Developer options/USB debugging and accept the device prompt.
# Listing devices starts the local ADB daemon (port 5037), so obtain service-start approval.
.\.tools\android-sdk\platform-tools\adb.exe devices
.\infra\scripts\dev.ps1 -Task RunPhone -AuthMode firebase -Approved -DeviceId YOUR_DEVICE_ID
.\.tools\android-sdk\platform-tools\adb.exe -s YOUR_DEVICE_ID install -r .\apps\carbonlens_flutter\build\app\outputs\flutter-apk\app-debug.apk
```

RunPhone starts a foreground Flutter session on the explicit device and does not
launch an emulator. Flutter's debug VM service may open a localhost port; quit with
q/Ctrl+C. To create an emulator, approve InstallTools **without** SkipEmulator;
that adds the Google Play Android 36 image/AVD and several GB of downloads.
LaunchDemo starts a visible emulator (2 GB RAM, two cores, ports 5554/5555 plus ADB
5037 and Flutter 8181) with demo authentication; stop it separately when done.
Once it is running, use the Firebase RunPhone command above. No emulator/system
virtualization setting was changed in this task.

After build tool/dependency approval, the debug SHA report uses only scoped caches:

```powershell
. .\infra\scripts\environment.ps1
$taskPaths = Get-CarbonLensPaths
Invoke-InCarbonLensEnvironment $taskPaths {
    Set-Location apps/carbonlens_flutter/android
    .\gradlew.bat signingReport --no-daemon
}
```

The earlier AuthMode error was PowerShell parameter binding, before Firebase ran.
The launcher now accepts `-AuthMode demo|firebase`. Demo is still the default and
does not verify enrollment against Firebase. Use Firebase mode for these workflows.

## Tests and actual results

The verified test/build results follow. Unit/widget tests
inject fake boundaries solely in test files; they do not send SMS or prove live
Google/Firebase configuration.

- Flutter analysis: no issues.
- Flutter tests: 37 passed, covering OTP errors/cooldown/callbacks, enrollment
  navigation, failed saves, returning sessions, profile Save/Cancel, logout,
  owner mismatch and revoked sessions, plus existing feature tests.
- Backend tests: 30 passed, including concurrent creation, allowlist/ownership,
  optimistic conflicts and interrupted-save replay.
- Debug web compilation: passed with --no-pub; this compiles the shared Dart source
  and is not an Android APK or a live Firebase integration test.
- Native Firebase debug APK command: stopped at the new configuration preflight;
  package/project/app settings fail, Web OAuth/backend URL are missing. The local
  Android platform SDK is separately absent. No APK was produced.
- Flutter-rendered screenshots: enrollment, profile, phone entry and manual OTP,
  plus existing design/navigation captures. They are widget renders, not emulator
  screenshots. Visual inspection confirms existing colors/cards, readable forms,
  loading/error controls and no layout overflow at 390×900.
- Live Google, fictional-number Firebase OTP, Firestore persistence, Rules execution,
  actual process-restart persistence, verified phone/email changes, provider conflicts
  and device integration: blocked; not reported as passed.

## Repeatable device verification

Use development accounts and two distinct configured fictional phone numbers.
Never export raw tokens, codes, real phone numbers or credentials in screenshots/logs.

| Scenario | Expected result |
|---|---|
| First Google sign-in | Firebase UID; exactly one incomplete users/uid; save required fields before home |
| Returning Google sign-in | Same UID/document/created_at; complete profile and privacy restored |
| Cancel account picker | Login remains available, no created app profile |
| Offline / invalid Google OAuth | Safe error, spinner clears, no authenticated-home shortcut |
| Google logout / account switch | Login returns; previous UID's profile/privacy not shown |
| Valid fictional number + configured code | Firebase-authenticated UID, then persisted enrollment or home |
| Invalid number or non-six-digit code | Local validation; no credential success |
| Wrong / expired code | SDK error; profile/home remains inaccessible; retry/resend available |
| Resend | Disabled for 60 seconds; new SDK challenge after cooldown |
| Automatic verification / retrieval timeout | Success only after credential exchange; timeout keeps manual code path |
| Network loss / throttled requests | Safe error/cooldown; no false verification |
| Back during OTP | Old callbacks ignored; re-entry safe; no corrupt profile |
| Logout then phone login | Same UID/profile for that provider; no second document |
| Offline enrollment save | Remains incomplete; retry uses stable operation; reload resumes persisted state |
| Restart during incomplete enrollment | Restored Firebase identity loads incomplete profile form |
| Edit save / failure / cancel | Persisted fields refresh only on success; failed/cancelled edit does not enroll or overwrite |
| Concurrent profile update | Stale version rejected; reload and retry |
| New verified phone | Reauthenticate if required; verify new credential; Auth is source of truth |
| Email change | Verify-before-update email; refresh only after verification; original stays until then |
| Link Google to phone or phone to Google | Same current UID; next provider login opens that same profile |
| Credential owned by another UID | Reject conflict; never automatically merge accounts |
| Different UID profile access | Rules deny client access; API derives current UID and rejects forged fields |
| Restart after complete enrollment | Session/complete profile/consent restore; no full registration again |
| Revoked / expired session | Protected API denies access; profile gate signs out on 401 |

Inspect Firebase Authentication users, the development users/uid document and
backend sanitized request-id/error codes while performing the matrix. Confirm
the UID before and after linking and that completion never precedes a saved profile.

## Files created or changed for this request

Prior unrelated/user changes were preserved. This list covers this enrollment work,
not every file already modified earlier in the checkout:

- Android: `android/settings.gradle.kts`, `android/app/build.gradle.kts`.
- Flutter auth: `core/auth/auth_state.dart`, `auth_controller.dart`,
  `firebase_auth_service.dart`; new `phone_auth.dart`, `phone_controller.dart`.
- Flutter profile: new `core/profile/user_profile.dart`, `profile_controller.dart`,
  `features/profile/session_gate.dart`, `profile_screen.dart`, `features/auth/phone_screen.dart`.
- Flutter integration: `app/routes.dart`, `app/bootstrap.dart`, `core/config/app_config.dart`,
  `core/consent/consent_state.dart`, `core/api/carbonlens_repository.dart`,
  `features/auth/auth_screen.dart`, `features/dashboard/dashboard_screen.dart`,
  `features/settings/settings_screen.dart`, `config/firebase.example.json`.
- Flutter tests: new `phone_controller_test.dart`, `profile_controller_test.dart`,
  `enrollment_flow_test.dart` and test-only account/profile helpers; updated `app_config_test.dart`.
- Backend: new `app/domains/profile.py`; integrated `app/domains/platform.py`,
  `app/core/runtime.py`, `app/domains/carbon/repository.py`; `requirements.txt`,
  `Dockerfile`, `.env.example`, `README.md`; new `test_profiles.py`, updated `test_backend.py`.
- Rules/tooling/docs: `firebase/rules/firestore.rules`, `infra/scripts/dev.ps1`,
  new `infra/scripts/check-firebase.ps1`, this report, `firebase-signin-setup.md`,
  `android_setup.md`, `development.md`, root `readme.md`, and the four
  `docs/verification/auth-*.png` captures.

All Flutter paths above are relative to `apps/carbonlens_flutter/lib` unless
identified as android/config/test. Backend paths are relative to `services/carbonlens_api`.
No real private config was overwritten or committed.
