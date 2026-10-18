# Project-local development scripts

dev.ps1 is the portable Windows entry point; Inspect is read-only.
Other tasks require -Approved after the human has approved their exact action.
environment.ps1 defines bounded-path, SDK-pin and process-local cache helpers only.
prepare-android.ps1 retains the optional native setup; -SkipEmulator omits AVD downloads.
No scripts execute a Git commit/push, cloud login, GCP provisioning, deletion or global PATH change.

See docs/development.md, CONTRIBUTING.md and dev-environment.json.
The scripts are prepared for review. Flutter execution and runtime tests are pending SDK setup.
