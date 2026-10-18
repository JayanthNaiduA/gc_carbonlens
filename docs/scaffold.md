# CarbonLens repository scaffold

## Current authentication milestone

Login, consent and dashboard source now replace selected Flutter placeholders.
Real Firebase and local demo adapters are implemented; installation, native Android
generation, Dart analysis/tests and emulator execution await approval.
See android_setup.md and gcp_deployment_plan.md for current status and setup.
The scaffold status below records the original folder-creation stage.

Created from HLD v2.1 and LLD v1.0. Existing project documents and README are preserved.
This stage creates directories, responsibility placeholders and safe configuration templates
only. It does not implement, run, install, deploy, provision, authenticate or migrate anything.

## Structure

```text
gc_japac/
  apps/carbonlens_flutter/
    lib/app/
    lib/core/{api,auth,consent,config,storage,models}/
    lib/features/{auth,consent,dashboard,scan,green_move,grow_green,recycle_red,rewards}/
    lib/features/{recommendations,reports,store,ai,community,earth_pulse,settings}/
    assets/{images,icons}/
    android/ web/ test/ integration_test/
  services/carbonlens_api/
    app/main.py
    app/http/
    app/core/
    app/adapters/
    app/domains/{scan,carbon,ai,trust,rewards,go_green_product}/
    app/domains/{green_move,grow_green,recycle_red,dashboard,reports}/
    tests/{unit,integration,e2e}/
  data/{emission_factors,product_catalog,reward_policies,verified_recyclers}/
  bigquery/ddl/
  firebase/rules/
  cloudbuild/
  infra/{cloudrun,iam,storage,monitoring,scripts}/
  testdata/{products,receipts,green_move,grow_green,recycle_red}/
  docs/
```

## Design reconciliation

- LLD section 4 governs the Python package structure under `app/domains/`.
  The HLD's explicit `go_green_product/` adapter is retained alongside the LLD domains.
- Use the LLD's `grow_green_projects/{id}/checkins/{cid}` and `recycle_claims/{id}`.
  The HLD names `grow_green_checkins` and `recycle_red_claims` map to those paths.
- HLD supplements `products`, `commute_baselines` and operational `daily_summaries`.
- LLD `green_event_facts` is the canonical analytical fact table. Supplemental HLD SQL
  filenames reserve the reporting options; do not create duplicate facts blindly.
- Later UI wrappers have placeholders only. Their presence does not expand the P0 scope.
- Source filenames inside design directories are conventional responsibility names;
  not every filename is explicitly prescribed by the documents.

## Contracts and invariants

Evidence -> normalize -> deterministic impact -> verify -> Trusted Green Event ->
versioned Reward Policy Engine -> append-only ledger -> dashboard.

Action types: GO_GREEN_PRODUCT, GREEN_MOVE, GROW_GREEN, RECYCLE_RED.
Keep carbon estimate, Sustainability Score, avoided CO2e, confidence, verification
and Green Points separate. No client/Gemini-issued rewards or invented factors.
Maps is location support, Earth Engine optional plot-level corroboration.
Planting persistence is PENDING -> PROVISIONAL -> VESTED.
Ledger reversals are compensating entries. Atomic deterministic guards prevent replay.

## Scaffold status

- Dart/Python files are comments/docstrings, not runnable modules or endpoints.
- pubspec.yaml and requirements.txt add no packages.
- Android/web platform files are not generated.
- Dockerfile contains no build instructions.
- Cloud Build YAML contains no executable steps.
- Firebase has no project binding or Hosting target; client rules deny all access.
- SQL files contain no DDL or migrations; reference datasets are empty placeholders.
- .env.example uses blanks for unknown cloud configuration and contains no secrets.
- Project ignores exclude credentials, signing keys, generated Firebase configuration
  and local raw evidence. Public client identifiers still need reviewed publication.

## Next implementation stage

Confirm cloud IDs/locations, Android identity, supported Gemini model, factor provenance
and policy values. Approve SDK/package choices before adding dependencies or installation.
Then implement the LLD's thin product vertical slice, keeping other pillars on shared contracts.
