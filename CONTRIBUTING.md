# CarbonLens contributor setup

This repository contains Flutter web/Android client source and a modular Cloud Run
backend scaffold. Google/Firebase provide the managed platform; GitHub is the source
repository. Read AGENTS.md before running installation or setup actions.

## Another Windows laptop

Clone the repository into a project folder of your choice. SDKs are recreated locally;
do not copy another person's .tools directory, credentials or Firebase config.

From the checkout root, follow docs/development.md. The recommended 8 GB profile is
browser-based. The scripts derive paths from the checkout, with no fixed drive/folder name.
Choose a checkout path without spaces for the best Flutter/Android SDK compatibility.
Explicit setup approval is still required for an agent.

Use the pinned Flutter revision in dev-environment.json.
After the first approved setup, the maintainer must commit pubspec.yaml and pubspec.lock
alongside the source/scripts. Teammates restore the committed lockfile instead of
upgrading dependencies. The present repository still has the initial dependency-free
manifest because installation approval is pending.

## macOS/Linux or an already configured workstation

Use the official Flutter SDK archive/source for the same configured version and verify
its revision. Follow the installation/access policy for that machine.
The PowerShell automation targets Windows; the Flutter client itself targets web/Android.
After approved tooling setup, use the following commands from apps/carbonlens_flutter:

```text
flutter pub get --enforce-lockfile
dart format --output=none --set-exit-if-changed lib test
flutter analyze --no-pub
flutter test --no-pub --concurrency=1
flutter run -d web-server --debug --no-pub --web-hostname=127.0.0.1 --web-port=8080 --dart-define=AUTH_MODE=demo
```

The first maintainer restore uses pub get without --enforce-lockfile only when no
lockfile exists yet. Do not change SDK versions or regenerate the lock casually.

## What belongs in GitHub

Commit application source, tests, web assets, scripts, docs, dev-environment.json,
the reviewed active package manifest and its generated lockfile.
Commit generated Android platform source once the package identity is agreed.
Keep .tools, build outputs, local.properties, .env, actual Firebase configuration,
keystores and credentials ignored. .env.example and config examples stay public.
Each teammate creates their own authorized local configuration.

Before your manual commit, inspect git status and staged filenames. Existing wiki
deletions are a separate working-tree change; decide whether they belong in your commit.
No script in this setup performs a Git commit, push, login or cloud deployment.

## Checking work

Check must pass before claiming a tested client. Unit/widget tests cover local
authentication, consent boundaries, missing configuration and API credential gating.
Real Google/email sign-in requires separate integration checks against the intended
Firebase app. Browser tests do not establish native Android behavior.

The source is prepared for one modular Cloud Run API initially.
See docs/gcp_deployment_plan.md for later service extraction and delivery.
