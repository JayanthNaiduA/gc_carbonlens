# Firebase configuration scaffold
`firebase.json` references deny-all Firestore/Storage rules and an empty index list.
`.firebaserc` has no project binding. Hosting configuration is not initialized.
Do not deploy these files until the Firebase project and approved implementation exist.

Server Firestore SDKs use IAM; client Security Rules do not make server ledger writes
append-only. Backend authorization and transactional guards must enforce that invariant.
