# Client configuration

Demo debug builds use no Firebase credentials. AUTH_MODE defaults to demo.
Real Firebase builds use `--dart-define-from-file=config/firebase.local.json`.
Create that ignored file from the example only after registering the app.
Fill it privately from Firebase app settings. Never paste tokens, passwords,
service-account JSON or signing keys into it.

These Firebase client identifiers are not a server private key. The project
policy still keeps actual configuration out of public Git. Firebase Auth owns
user credentials; the Flutter app never stores passwords.

GOOGLE_SERVER_CLIENT_ID is the web OAuth client ID used for native Android
Google sign-in, not the Android OAuth client ID or a client secret.
Confirm package name and SHA-1/SHA-256 in Firebase/OAuth configuration.

Leave API_BASE_URL empty during this authentication milestone. When the protected
API exists, configure HTTPS and App Check. Demo credentials cannot access it.
Local preferences are not synced to Firestore in this build.

USE_AUTH_EMULATOR is optional and distinct from an Android device emulator.
It requires a demo- Firebase project ID, a debug build and no backend URL.
Android uses 10.0.2.2:9099 to reach a host Auth emulator; no emulator is started here.
