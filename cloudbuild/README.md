# Cloud Build scaffold
No triggers or builds created. YAML files have empty step lists and are not working pipelines.

Backend sequence from the LLD: tests -> container -> Artifact Registry -> Cloud Run
revision -> health/version smoke -> traffic only after successful verification.
Web sequence: tests -> Flutter web build -> Firebase Hosting; Android build/distribution optional.

Confirm approved tool images, dependencies, project, regions and explicit build/deploy
service identities before adding executable steps. No GitHub Actions.
