# CarbonLens progress

Status recorded on 10 October 2026. This records completed source work, not deployed behavior.

| Area | Source status | Execution status |
| --- | --- | --- |
| HLD/LLD repository structure | Created | Files checked |
| Local demo login and sign-out | Implemented | Flutter run pending |
| Firebase Google/email adapter | Implemented | Real project/configuration pending |
| Account creation/reset/verification | Implemented | Firebase integration checks pending |
| Optional consent | Session-only implementation | Widget/manual checks pending |
| Dashboard shell | Implemented, no invented impact values | Browser/Android review pending |
| Auth/config/API credential tests | Written | SDK/test execution pending |
| Portable Windows setup | Pinned SDK, browser profile and serial tests | Read-only inspection, syntax, approval and boundary checks passed; SDK installation pending |
| Optional Android phone/emulator profile | Prepared | SDK/native build/device checks pending |
| Carbon/trust/reward backend | Scaffold and contracts planned | Not implemented/deployed |
| GCP Cloud Run hosting | Documented plan | No resources provisioned |
| Public web URL and APK | Planned | Not built/published |

The fastest visible check on an 8 GB Windows machine is the browser demo in development.md.
The app should show login -> optional consent -> dashboard -> sign-out.
Do not mark runtime checks passed until they have actually been run.
