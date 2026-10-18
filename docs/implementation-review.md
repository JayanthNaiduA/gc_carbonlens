# CarbonLens design traceability and implementation review

Analysis date: 14 October 2026. Original checkout was clean. Source inspection,
not filenames, established that authentication/consent were implemented and all
other feature Dart/Python files were comments. No database or backend was running.

## Sources inspected

- HLD v2.1: all sections, API/data contracts, security, four pillars, cut lines.
- LLD v1.0: all sections, canonical contracts, calculation rules, ledger invariants.
- All nine HLD and five LLD embedded diagrams (extracted in `design-extracted`).
- `ChatGPT Image Oct 9, 2026, 02_45_33 AM.png`: all 14 mobile and three web views.
- README, about, scaffold, development, deployment, Android and contributor guides;
  all Flutter/Python source, Gradle/manifests, tests, data, DDL and security rules.

## Current architecture

Flutter/Dart with Material 3; Android is a single Flutter host activity in Kotlin,
not a native Compose/XML application. `main.dart` bootstraps Firebase or a guarded
local demo. `AuthController` is ChangeNotifier-based with a service boundary.
Firebase Google/email sign-in, registration, reset, verification and sign-out work
in source. Consent is session-local. There is no DI framework, local database or
offline persistence. Backend is a single modular Python service, initially empty.
Firestore operational state, BigQuery references, private Storage evidence and
Vertex AI/Vision/Document AI adapters are the documented target.

Android: AGP 9.1.0, Kotlin 2.4.0, Java 17, minSdk 24; compile/target SDK and NDK
come from Flutter. Debug/release variants exist, release currently uses a debug
signing key and therefore is unsuitable for publishing. Versions in the local
SDK/package lock must be checked when validating; no upgrades are authorized.

## Decisions and conflicts

1. HLD/LLD override illustration numbers. 78/100, 1,420 GP, emissions, balances,
   brands and leaderboard names are explicitly simulated fixtures only.
2. HLD requires P0 before P2. Core algorithms and contracts precede UI wrappers.
3. LLD takes precedence for current endpoint/field spellings where HLD examples
   differ (`estimated_kg_co2e`, `health_connect`, nested project check-ins).
4. Microphone is optional in HLD/image but voice is phase 2. Add optional consent,
   without claiming microphone capture. Phone authentication is also optional.
5. Exact product, landscape, tree mascot and map assets are absent as separate
   files. Reuse appropriate artwork from the supplied sheet where possible;
   maps must be clearly diagrammatic when Maps is unconfigured.
6. Empty factors, product catalog, reward policy and recycler registry prevent
   scientific estimates and verified live rewards. Live mode fails explicitly;
   tests inject authored fixtures. Never seed invented scientific production data.
7. No database creation, migrations, cloud deployment, services, installation,
   deletion, committing or pushing is authorized by this implementation request.

## Requirements traceability matrix (baseline / planned work)

| Requirement | Source | Baseline / gap | Required change and files | Status |
|---|---|---|---|---|
| Login, account reset/verification | LLD 6; image 1 | Implemented; visual mismatch | Preserve auth service, refine theme/login | Preserved/refined; offline tests pass; live Firebase unverified |
| Optional feature consent | LLD 6/20; image 2 | Session only, microphone absent | Consent DTO/UI; authenticated persistence boundary | Implemented DTO/UI and API sync boundary; cloud unverified |
| Dashboard / Today, Week, Month | LLD 6/8; images 3/15 | Static unavailable metrics, no navigation | Server snapshot controller; dashboard cards; responsive rail | Implemented; demo/widget tests; live score/impact projection incomplete |
| Product/receipt capture | LLD 18; image 4 | Empty Dart and backend | Scan state, evidence input, private-object validation, resolver | Implemented Android/web capture, upload and scan processing; native/cloud unverified |
| Product result/detail | LLD 12/13; images 5/16 | Missing | Carbon/score DTOs, provenance, dimensions, alternatives | Implemented; provenance, dimensions, receipt/baseline flow |
| Recommendations / Green Buy | HLD P1; image 6 | Missing | Filtered curated alternatives, detail navigation | Implemented; curated fixtures only until references loaded |
| Wallet / history / four pillars | LLD 15; image 7 | Missing | Read-only wallet/ledger views, exact-once backend guard | Implemented; atomic memory-store tests pass; Firestore unverified |
| Green Move | LLD 16.2; image 8 | Missing | Baseline/session validation, consent, substitution policy | Form and pure rules; trusted ingestion remains unavailable |
| Grow Green / plot map | LLD 16.3; images 9/17 | Missing | Private plot forms, checkpoints, freshness/self-confirmation guards | Registration/read + form/rules; persistence verification and Maps incomplete |
| Recycle Red | LLD 16.4; image 10 | Missing | Recycler/item/document form, registry/fingerprint guards | Form and pure rules; claim ingestion remains unavailable |
| AI assistant | LLD 17; image 11 | Missing | Trusted explanation, schema validation, deterministic fallback | Authored quick guidance; contextual explanation/fallback; Gemini unverified |
| Earth Intelligence | HLD P2; image 12 | Missing | Tabs and honest unconfigured live-source state | Bounded authored view; live news source absent |
| Reports | LLD 8/23; image 13 | Missing | Monthly API projection, chart/category list | Chart/view implemented; live aggregation incomplete |
| Community | HLD P2; image 14 | Missing | Scoped tabs, opt-in privacy, simulated demo ranking | Bounded opt-in design; simulated demo ranking only |
| Store/cart/checkout | about; HLD phase 2 | Missing, no commerce contract | Curated browsing; do not fabricate payments | Bounded |
| Settings / sign-out / consent edit | LLD 20; about | Consent edit on home only | Dedicated settings preserving auth actions | Implemented; navigation/sign-out tests pass |
| Auth, App Check, ownership | LLD 7/20 | Credential headers only | Protected transport/middleware; fail closed without verifier | Implemented fail-closed API; injected boundary tests; Firebase unverified |
| Carbon/score determinism | LLD 12/13 | Empty modules | Versioned engines, incompatible units/missing factors tests | Implemented; unit tests pass; sourced datasets still empty |
| Trust/policy/ledger | LLD 14/15 | Empty modules | Server-owned evidence; atomic duplicate/cap guard, reversals | Implemented; replay/caps/reversal tests pass; cloud unverified |
| Accessibility/device behavior | LLD 6; reference | No feature UI | Semantic labels, scroll, keyboard, adaptive layouts, UI tests | Rendered/widget checked; device-specific behavior remains unverified |

## Implementation sequence

1. Canonical contracts, pure carbon/score/verification/reward rules and tests.
2. Python HTTP application with injected persistence/identity/Google boundaries.
3. Flutter protected transport, repository/controller and explicit demo fixtures.
4. Shared design system, mobile navigation/web rail, core and pillar screens.
5. Offline unit/widget/integration tests; rendered screenshots; document limits.

## Verification and final implementation status

**The complete live Android/cloud objective is not yet achieved.** The repository
now contains a tested Flutter experience and server-domain implementation. The
remaining integration work is explicit below; demo output is never live proof.

### Implemented screens, components and journeys

Login/consent → dashboard → product scan → sourced result → conventional baseline
selection → purchase-receipt capture → event creation → reward evaluation →
refreshed wallet/dashboard. Product replacements now require a prior matching
baseline scan, not merely a catalog selection. The AI screen preselects the latest
completed scan. Dashboard periods use separate requests and ignore stale responses.

Mobile bottom navigation: Home / Move / Scan / Rewards / More. More opens the
other destinations. Desktop uses a persistent sidebar. Back returns to Home.
Settings exposes consent editing, account verification and sign-out. Sign-out or
consent editing removes protected feature widgets and their session state.

Reusable components: cards, metric rows, tabs, request-state/retry views,
evidence forms, landscape/product vector art and a tree mascot. They share the
green/mint/navy theme. Result views separate footprint, score, confidence,
provenance, reward requirements and optional avoided emissions. Reward history
distinguishes available/provisional points and policy versions.

### Backend and client changes

- Dependency-free Python WSGI entry point (`app/main.py`), public health/version,
  protected identity/consent/scan/carbon/product/event/reward/wallet/dashboard/
  report and private planting-registration/read routes.
- Firebase Admin identity/App Check verification is a lazy optional cloud
  boundary; missing support fails closed. No demo identity can call live APIs.
- Carbon Engine handles version/date/region selection, compatible unit conversion,
  provenance and missing-factor failure. Score weights follow LLD; missing
  dimensions reject rather than silently becoming zero or 100.
- Server-owned scan signals feed V0–V3 verification. Client points/confidence
  fields are ignored. Global evidence hashes and normalized purchase
  fingerprints block replay, including subsets/reordering.
- Atomic ledger posting reads event, guard, wallet and caps before any writes;
  reversals append compensating entries. Firestore adapter implements the same
  boundary; in-memory storage is injected by tests only.
- Pure Move rules check baseline, speed, overlap and replay. Grow rules check
  freshness, due checkpoint, proximity, reused photos and self-confirmation.
  Recycling rules require a sourced active registry and recent valid documents.
- Cloud Run composition uses attached identity; BigQuery loads authoritative
  dimensions/factors, Firestore supplies curated product aliases and versioned
  policy, private Storage supplies bytes, Vision/Document AI resolve evidence,
  and Vertex AI explains trusted facts with schema validation and fallback.
  REST requests validate Google hosts and refuse credential-bearing redirects.
- Flutter transport obtains fresh credentials for every request, preserves
  operation keys and request bodies across retries, handles timeout/error
  envelopes and exposes expired sessions. Demo repository is read-only.
- Private JPEG/PNG upload follows the official
  [Firebase SDK multipart protocol](https://github.com/firebase/firebase-js-sdk/blob/main/packages/storage/src/implementation/requests.ts)
  and [Firebase authentication/App Check headers](https://github.com/firebase/firebase-js-sdk/blob/main/packages/storage/src/implementation/request.ts).
  Owner-scoped immutable scan rules follow
  [Firebase rule conditions](https://firebase.google.com/docs/storage/security/rules-conditions).
  No public image URLs or download tokens are retained.
- Android uses user-triggered camera/document intents through a MethodChannel;
  web uses the browser image chooser. Camera intent provides a preview bitmap:
  choose a full-resolution image for detailed receipt OCR. Raw images stay in
  memory until upload/navigation, rather than being cached to laptop files.
- Access logging uses an allowlist of request id, sanitized route, status and
  latency; raw evidence, identity, tokens and prompts are excluded.
- Setup helpers now detect the existing archive SDK location and verify its
  pinned Git revision. No SDK installation/upgrade occurred.

### Important files

| Area | Files |
|---|---|
| Flutter entry/state | `lib/main.dart`, `lib/app/routes.dart`, `lib/core/api/*` |
| UI/design | `lib/app/theme.dart`, `lib/app/widgets/*`, all `lib/features/*` screens |
| Capture/upload | `lib/core/storage/*`, Android `MainActivity.kt`, `AndroidManifest.xml` |
| Canonical contracts | `lib/core/models/*`, `lib/core/consent/consent_state.dart` |
| API/trust/persistence | `app/main.py`, `app/http/middleware.py`, `app/domains/platform.py`, `app/adapters/*` |
| Calculation/reward/AI | `app/domains/carbon/*`, `rewards/ledger.py`, `rewards/policy.py`, `trust/service.py`, `ai/*` |
| Tests | Flutter transport/resource/upload/render tests; `tests/unit/test_backend.py` |
| Security/setup | `firebase/rules/storage.rules`, `infra/scripts/environment.ps1`, `prepare-android.ps1`, backend `.env.example` |

No auth provider was replaced. No schema migration, database creation,
installation, deletion, deployment, commit or push occurred.

### Verified results

| Check | Actual result |
|---|---|
| Flutter/Dart toolchain | Existing Flutter 3.47.7, Dart 3.13.5; pinned revision matches |
| Dart formatting | 58 files checked; no changes needed at final check |
| Flutter analysis | No issues found |
| Flutter tests | 22 passed |
| Python tests | 21 passed under Python 3.11.5 |
| Offline API integration | Injected baseline/product/receipt → event → reward → wallet passes |
| Exact-once behavior | 32 concurrent replay requests credit one entry; simultaneous events obey caps |
| Web compilation | Debug demo build succeeds at `apps/carbonlens_flutter/build/web`; `--no-pub`, local web resources |
| UI rendering | 16 actual Flutter screenshots saved in `docs/verification` and visually inspected |
| Layout/navigation | 390×900 mobile; 1200×900 sidebar/all destinations; product result at 320 px and 1.6× text |
| Git whitespace check | Passed |
| Android APK/device | Not run: project Android command-line tools and platform are absent |
| Live APIs/rules | Not exercised or deployed; offline tests use explicit injected fixtures |

Flutter's sandbox initially blocked its own localhost test harness. After the
test-harness escalation was approved, tests ran successfully. Initial sidebar
painting and off-screen test-tap failures were fixed; final tests pass. The
screenshot harness loads existing SDK fonts. The unit text uses `CO2e` and the
mascot uses a drawn icon to avoid unsupported glyphs in the local renderer.

### Visual comparison and unavoidable deviations

All mobile/reference compositions and the embedded architecture diagrams were
visually inspected. The implementation reproduces green score/balance cards,
period/category tabs, mint/lavender groupings, scan frame/result hierarchy, four
reward action cards, report chart/category list, highlighted demo leaderboard row,
mobile navigation and desktop sidebar. Each generated screen was inspected.

It is **not pixel-identical**: separate photographs, portraits, exact logo and
mascot assets are absent. Vector illustrations replace those visuals. Real
Maps/planting-map view is not implemented; the commute graphic explicitly says it
is a diagram. Product result adds provenance and separates illustrative values.
Exact reference numeric rewards are not treated as guaranteed entitlements.
Green Store browsing shares recommendations; partner tiles/payments are not
fabricated. Login preserves the working email/Google modes rather than adding
unimplemented phone authentication. Named deep links are not implemented;
navigation currently runs within the protected shell.

### Remaining dependencies and known gaps

1. **Android SDK and native validation.** Command-line tools, API 36, build tools,
   NDK and Gradle/Maven artifacts require project-local installation approval.
   No emulator is necessary; a physical device is the safer native test option.
   Native Kotlin capture is source-complete but has not been compiled/device-tested.
2. **Live Google environment.** A private frontend Firebase config exists but was
   not read or used. Actual ID tokens/App Check, Firestore transactions, Storage
   rules/uploads, Vision, Document AI, BigQuery and Vertex AI remain unverified.
   Backend requires an approved Firebase Admin dependency/runtime manifest and
   service/IAM configuration. The Dockerfile/Cloud Build scaffolds remain inactive.
3. **Reference data.** All production product, factor, policy and recycler datasets
   are empty. Supply sourced/versioned data, operational recognition aliases and
   a versioned policy. OCR matching currently requires a unique curated alias;
   ambiguous categories fail explicitly. Resolver confidence is conservatively
   fixed at 0.75 for an exact alias, not a calibrated scientific confidence.
4. **Other pillars.** Move ingestion still needs native Health Connect and trusted
   commute matching; Grow check-ins/confirmations need trusted capture/proximity
   integration and persistence-tranche release; recycling claim ingestion needs
   document/recycler normalization. These routes currently return explicit
   adapter-unavailable errors; tests prove pure rules, not live workflows.
5. **Projection/analytics.** Live dashboard has ledger balance/earned points and
   verified product counts, but no derived green score/walking/avoided totals.
   Monthly report has a view/contract and event count; sourced aggregation is
   unfinished. Demo charts remain illustrative. Historical factors are recorded
   in scan results; production reference refresh strategy still needs review.
6. **P2 and phase 2.** Live news, opt-in ranking, Maps, voice, phone auth,
   commerce/cart/checkout and sponsor payouts are not implemented.
7. **Hardening.** Rate limiting, schema-wide validation, perception-based duplicate
   detection, collusion analysis, consent history/retrieval, raw-evidence retention
   lifecycle and failed-event evidence upgrades need further implementation.
   Upload timeouts that complete remotely may require selecting a new image/operation
   because storage objects are immutable. No end-to-end cloud success is claimed.
8. **Release identity.** Existing `com.example` package and debug signing need
   approved production identity/signing before any release distribution.

### Recommended next steps

Approve project-local Android tools/build (without emulator), then compile and
device-test capture and navigation. Separately approve/install the backend runtime,
supply sourced references and configure Google services before performing billed
integration tests. Complete trusted ingestion for the other pillars, projections,
security-rule tests and deployment only after the product cloud vertical slice is
verified. All further installation/service/cloud actions still follow AGENTS.md.
