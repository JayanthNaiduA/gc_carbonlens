# CarbonLens GCP deployment plan

Reference: HLD v2.1 sections 5, 8 and 14; LLD sections 7 and 22.
This is a plan, not deployed infrastructure.

## First working model

- Flutter Android and web share the authentication/consent code.
- Firebase Authentication owns account credentials and issues ID tokens.
- Android is tested locally first; Firebase Hosting later serves the web build.
- Deploy one modular Python API container on Cloud Run.
- The API verifies Firebase ID tokens and App Check, derives UID server-side,
  checks consent and applies domain authorization.
- Firestore owns operational state; private Storage owns evidence; BigQuery owns
  versioned factor/reference data and analytical facts.
- Vertex AI Gemini explains trusted structured results; Vision/Document AI normalize evidence.

## Container delivery

GitHub -> Cloud Build -> Artifact Registry image digest -> Cloud Run revision.
Backend tests and smoke checks precede routing traffic to the new revision.
Keep the previous revision available for rollback.

The Cloud Run API must listen on 0.0.0.0:$PORT, run as a non-root user and use an
attached least-privilege service identity. No downloaded service-account key.
Scale to zero initially and approve a small maximum instance count and budget.
Expose /health and /version; protect /v1 routes even when ingress is publicly reachable.
Configure allowed web origins explicitly when web access is introduced.

No Docker build/run, SDK installation, cloud login or resource creation has been executed.
The current backend Dockerfile remains a placeholder until backend implementation begins.

## Service extraction later

| Boundary | Initial deployment | Later extraction trigger |
| --- | --- | --- |
| API/auth/consent boundary | Single Cloud Run API | A stable versioned client/API contract |
| Scan/Vision/document adapters | Module in API | Heavy or asynchronous evidence workload |
| AI explanation | Module in API | Independent latency, quota or scaling needs |
| Deterministic carbon/score | Module in API | Shared workload or independent release needs |
| Trust/reward/ledger | One transaction boundary | Split only with a proven transactional design |
| Analytics | Minimal reference/query path | Pub/Sub consumer after the core works |

Do not create four independent reward services. All pillars share GreenEvent,
VerificationDecision, RewardDecision and LedgerEntry.
Rewards remain transactional and replay-safe; at-least-once Pub/Sub delivery does
not itself provide exactly-once points. Analytics identities cannot write the ledger.

## Authentication milestone limits

Login code includes real Firebase and local demo adapters. It does not provision Firebase.
The dashboard has no authoritative impact/reward data. Consent is session-only until
the protected PUT /v1/consents API is implemented.
The credential header boundary rejects demo sessions and requires Firebase + App Check.
No protected HTTP transport or backend token verifier is claimed to be complete.

## Required deployment inputs

Confirm project/billing, regions, runtime/build/deploy identities, Firebase registrations,
App Check providers, bucket retention, factor sources and versioned policies.
Never deploy local demo authentication as production authentication.
