# Lockfile Repair

Use the manual GitHub Actions workflow when `npm ci` fails because `package.json` and `package-lock.json` are out of sync.

Run it from GitHub:

GitHub -> Actions -> Repair Package Lock -> Run workflow -> main

The workflow repairs `package-lock.json` from the existing `package.json`. If the lockfile changes, it commits and pushes `package-lock.json` before running strict `npm ci`; the push then triggers Build Verification again. If the lockfile does not change, the workflow runs `npm ci` and the validation scripts.
