# CarbonLens Flutter authentication milestone

The HLD/LLD Android-first login flow now has source code for:

- Firebase email sign-in, account creation, reset and verification emails.
- Native Android Google sign-in and web Google popup sign-in.
- Explicit local demo mode with no credentials or network calls.
- Optional session consent, dashboard shell and sign-out.
- A protected API credential boundary that blocks demo sessions.
- Configuration, authentication, credential and widget-flow tests.

No Flutter/Android tooling is on PATH. The active pubspec.yaml remains the
dependency-free scaffold until package addition/installation is approved.
pubspec.proposed.yaml is the reviewed dependency proposal, not an installed manifest.
Native Android project generation, analyzer/tests and emulator run remain pending.

See ../../docs/android_setup.md for the reviewed setup phases and
../../docs/gcp_deployment_plan.md for the modular Cloud Run hosting plan.
Actual Firebase configuration belongs in ignored config/firebase.local.json.
No real Firebase credentials, cloud resources, device permissions or reward data exist.

Consent is session-only until the server API is implemented. Dashboard metrics show
unavailable values rather than inventing footprint, score or points.

## Portable low-memory environment

Use ../../docs/development.md and the root infra/scripts/dev.ps1 entry point.
The browser entry assets now exist in web/. Flutter/packages still require approval.
The SDK is pinned in dev-environment.json; serial tests and a physical-phone option
support an 8 GB laptop. Commit the generated dependency lock after the first approved restore.
