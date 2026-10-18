# CarbonLens API
Reference: LLD sections 4, 7-8 and 12-22.

For first profile deployment, use the [Cloud Shell deployment guide](../../docs/cloudrun-profile-deployment.md).
The `.gcloudignore` allowlists Python app source and Docker build inputs; private
configuration is excluded from source uploads. No deployment has been executed.

The dependency-free WSGI application exposes health/version and the documented
protected product vertical slice. Deterministic engines, replay guards, atomic
ledger/caps/reversals and pure pillar validation rules are implemented. The default
runtime fails closed for protected storage/identity dependencies. Tests inject an
in-memory store and explicit fixtures; those fixtures never serve live requests.

Run offline tests from this directory:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
python -m unittest discover -s tests/unit -v
```

30 tests pass. No server, cloud calls or database is required by these tests.

After service-start approval, `python -m app.main` starts a foreground local WSGI
development server on 127.0.0.1:8081. It does not bypass identity/App Check.
Do not use the development WSGI server as a production Cloud Run server.

`CARBONLENS_CLOUD_RUNTIME=1` explicitly enables the attached-identity composition:
Firebase Admin/Firestore, BigQuery references, private Storage, Vision/Document AI
and Vertex AI. Populate the non-secret configuration names in `.env.example` in
the deployment environment. No dotenv loader reads local credentials implicitly.
`requirements.txt` now pins Firebase Admin 7.7.0 and Gunicorn 26.2.0, and the
Dockerfile prepares an unprivileged Cloud Run process. Installation, image builds
and deployment still require approval; none was executed during implementation.

`CARBONLENS_PROFILE_ONLY=1` with `CARBONLENS_CLOUD_RUNTIME=1` allows initial
enrollment/profile/privacy testing without BigQuery scientific reference tables.
Set `FIREBASE_PROJECT_ID` and attach the intended runtime service account with
Firestore and Firebase Auth read permissions. This mode supplies no fake reward
or scientific data. Full sustainability features still need their own adapters.

`GET /v1/me` creates/retrieves `users/{verified-token-uid}` atomically and combines
the app profile with Firebase Admin's verified identity. `PUT /v1/me` accepts
only `display_name`, `region`, and `expected_version`; it requires a stable
Idempotency-Key and persists completion only after validation. Contact changes
use Firebase SDK verification, not these editable fields. See the
[Firebase enrollment report](../../docs/firebase-enrollment-review.md).

Production references remain empty. BigQuery product dimensions use the LLD
`*_score` columns; Firestore `products/{product_ref}` supplies sourced names and
recognition aliases. Firestore `reward_policies/{version}` supplies the canonical
`version`, `segments` and `caps` policy snapshot. Missing data produces errors.

Move, Grow check-in and recycling intake deliberately return adapter-unavailable
until trusted ingestion is connected. Their pure validation rules are tested,
but they are not complete live reward workflows. See
[the implementation review](../../docs/implementation-review.md) for all gaps.

Request boundary: identity -> App Check -> consent -> schema/idempotency -> domain.
One shared Carbon Engine, Trust Engine, Reward Policy Engine and append-only ledger
serve all four reward pillars. Firebase UID is derived from a verified token.

Use attached workload identity and least-privilege IAM. Never log tokens, raw OCR,
personal Gemini context or precise health/location evidence.
