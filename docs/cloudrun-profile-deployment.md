# Deploy the profile API from Cloud Shell

Prepared 2026-10-15. These are instructions for the project owner to execute.
No upload, API enablement, IAM change, billing change, image build or deployment
was performed by Codex. The local archive was checked for readable ZIP contents
and includes 79 source/build files only. Runtime dependencies/container startup
still require actual Cloud Build and Cloud Run verification.

## 1. Select the existing Firebase project and billing

Open Google Cloud Console and select the project with the same Project ID as
Firebase. Confirm billing is enabled before provisioning. Cloud Run, Cloud Build,
Artifact Registry and Firestore can incur charges. Set budget alerts if needed;
alerts are not a spending cap. Do not enable another project by mistake.
See [Cloud Run pricing](https://cloud.google.com/run/pricing).

In Firebase, create/confirm the Firestore `(default)` Native/Standard database.
Use production rules and publish the reviewed `firebase/rules/firestore.rules`
to the intended development environment. No collections need manual seeding.

## 2. Open Cloud Shell and upload the reviewed archive

Click Activate Cloud Shell in Google Cloud Console and authorize it when prompted.
All bash commands below run in that browser terminal, not Windows PowerShell.
Use More > Upload to upload this file into your Cloud Shell home directory:

`H:\gc_japac\.tools\deploy\carbonlens-api-source-2026-10-15.zip`

The archive includes only `app/**/*.py`, Dockerfile, requirements.txt and the two
ignore files. It excludes Android/Flutter code, private Firebase config, .env,
credential files, datasets, tests and local caches. Source deployments use the
Dockerfile in the uploaded API folder. No Docker installation is needed locally.
See [Cloud Shell uploads](https://docs.cloud.google.com/shell/docs/uploading-and-downloading-files)
and [source deployments](https://docs.cloud.google.com/run/docs/deploying-source-code).

```bash
mkdir -p "$HOME/carbonlens-api-deploy-20261015"
unzip -n "$HOME/carbonlens-api-source-2026-10-15.zip" -d "$HOME/carbonlens-api-deploy-20261015"
cd "$HOME/carbonlens-api-deploy-20261015"
gcloud meta list-files-for-upload
```

Review the upload list: it should contain only the API source/build files.
If this directory already contains an older unpacked version, use a new empty
deployment directory; `unzip -n` deliberately does not overwrite existing files.

## 3. Set project and region

Replace both placeholders. Choose a supported Cloud Run region near your Firestore
database; `asia-south1` is an example for Mumbai, not a prescribed location.

```bash
PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
REGION="YOUR_CLOUD_RUN_REGION"
gcloud config set project "$PROJECT_ID"
```

## 4. Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  --project="$PROJECT_ID"
```

Your human account must have permission to enable APIs, manage the required IAM
bindings, deploy Cloud Run and use the runtime service account. If access is denied,
stop and ask the project administrator. Do not grant Owner/Editor to runtime accounts.

## 5. Create the API runtime identity

For a first deployment, create this service account. If it already exists, reuse
it after reviewing its purpose rather than creating a replacement.

```bash
gcloud iam service-accounts create carbonlens-api \
  --project="$PROJECT_ID" \
  --display-name="CarbonLens profile API"

RUNTIME_ACCOUNT="carbonlens-api@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_ACCOUNT}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_ACCOUNT}" \
  --role="roles/firebaseauth.viewer"
```

Datastore User supplies Firestore document read/write access. Firebase Authentication
Viewer supplies user-read access needed to retrieve verified contacts and check
revoked sessions. Use attached credentials; do not create/download a private key.
See [Firestore IAM](https://docs.cloud.google.com/firestore/native/docs/security/iam)
and [Firebase Auth IAM](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth).

## 6. Grant the source builder its documented role

Current Cloud Run source deployment defaults to the Compute Engine service account.
The Cloud Run API setup creates it. Grant Cloud Run Builder, not runtime data roles:

```bash
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/run.builder"
```

Allow a few minutes for new IAM permissions to propagate. If the project has an
explicit build identity override, grant the builder role to that selected build
identity instead. Build identity and API runtime identity have different purposes.
See [required build/deployer roles](https://docs.cloud.google.com/run/docs/deploying-source-code).

## 7. Deploy the API

This command uploads source, builds a container, can create an Artifact Registry
source repository, and publishes an HTTPS service. Execute only after reviewing
that scope and billing. It may take several minutes.

```bash
gcloud run deploy carbonlens-api \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source=. \
  --service-account="$RUNTIME_ACCOUNT" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=8 \
  --min-instances=0 \
  --max-instances=1 \
  --timeout=60s \
  --set-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID},CARBONLENS_CLOUD_RUNTIME=1,CARBONLENS_PROFILE_ONLY=1"
```

The public transport setting is necessary because this app sends Firebase ID tokens
rather than Google IAM identity tokens. Backend protected routes still enforce
Firebase Auth, revoked-token checking and App Check. Only health/version are public.
This does not enable public Firestore access. If organization policy forbids public
transport, stop and review a gateway/authentication design; do not bypass the policy.

Profile-only mode avoids scientific BigQuery setup for initial enrollment. It does
not supply synthetic scientific/reward data or complete all sustainability adapters.
Minimum zero allows scale-to-zero; maximum instances limits this revision's capacity,
not total billing. See [deployment flag reference](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy).

## 8. Retrieve and check the real service URL

```bash
API_URL="$(gcloud run services describe carbonlens-api \
  --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"

printf '%s\n' "$API_URL"
curl -i "$API_URL/health"
curl -i "$API_URL/v1/me"
```

Expected: health HTTP 200 with JSON; `/v1/me` HTTP 401 without user credentials.
Health success only proves startup/reachability; it does not prove authenticated
enrollment, user ownership, App Check or profile writes work end-to-end.

## 9. Connect and test the Android app

On your laptop, put that exact base HTTPS URL in the ignored file:

`H:\gc_japac\apps\carbonlens_flutter\config\firebase.local.json`

```json
"API_BASE_URL": "YOUR_ACTUAL_CLOUD_RUN_SERVICE_URL"
```

Retain `APP_CHECK_DEBUG=true` only for your debug device/emulator. Register its
SDK-generated debug token privately in Firebase App Check > Manage debug tokens.
Backend verification remains enabled. Do not commit tokens or share raw logs.

From Windows PowerShell in `H:\gc_japac`:

```powershell
.\infra\scripts\check-firebase.ps1
.\infra\scripts\dev.ps1 -Task RunPhone -AuthMode firebase -Approved -DeviceId emulator-5554
```

Test Google and configured fictional-phone sign-in, complete enrollment, edit the
profile, restart, and logout. Check that the development Firestore `users/{uid}`
document belongs to that verified Firebase UID. Google client ID must be the Web
OAuth client (type 3). App Check failures commonly mean an unregistered debug token.

## Troubleshooting

- API enabling/IAM errors: project owner/admin permissions are required; do not
  grant broad permissions to the runtime account as a workaround.
- Build failure: open the linked Cloud Build job; check the selected build identity
  and dependency/build error. Never post credentials or raw private logs.
- Revision not ready: Cloud Run revision logs may show missing `(default)` Firestore,
  missing runtime permission, absent configuration or import/dependency failure.
- New role still denied: allow IAM propagation, confirm the selected account/project.
- Protected route returns 401: Firebase session/project mismatch or revoked token.
- Protected route returns App Check 403: configure/register the debug provider token.
- All local checks pass but enrollment fails: local checks validate format/alignment,
  not live permissions or connectivity. Use the sanitized request ID/error code.

The prepared ZIP is a snapshot. Repackage the allowed source files after backend
changes; rerunning an old ZIP will deploy the old code.
