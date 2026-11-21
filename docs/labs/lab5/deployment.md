# Lab 5 deployment: Personal Money and Expense Logging System

This document describes how the application is built, configured, deployed to
Google Cloud and released. It covers the Lab 5 requirements R-01 to R-12.

- Repository: https://github.com/Tana4Work/Personal_Money_and_Expense_Logging_System
- Public URL: https://pmels-203670311966.asia-southeast1.run.app
- GCP project: `cpe334-en-008`, region `asia-southeast1`
- Team: Thanaphon Ratchatakulpong (thanaphon3417), Tana Udompornkul (Tana4Work)

## 1. Stack and differences from the starter kit

| Layer | Technology |
|---|---|
| UI | React, TypeScript, Vite (`client/`) |
| API | Node.js 24, Express, TypeScript (`server/`) |
| Database | PostgreSQL 16 with Prisma migrations (`server/prisma/`) |
| Hosting | Cloud Run service `pmels` (one container serves the UI and the API) |
| Data | Cloud SQL for PostgreSQL instance `pmels-pg` |
| Images | Artifact Registry repository `pmels` |
| Secrets | Secret Manager |
| CI/CD | GitHub Actions with Workload Identity Federation (no JSON key) |

We use the reference stack from the Lab 5 starter kit. Differences from the
TokTickIT example:

- All resource names use the prefix `pmels` instead of `toktickit`.
- The seed reads `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD`
  (the kit used `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD`).
- The Cloud Run migration job runs the compiled seed:
  `npx prisma migrate deploy && node dist/prisma/seed.js`.
- The server starts with `node dist/src/index.js`, because `tsc` compiles
  `src/`, `prisma/` and `tests/` together.
- Express serves the built React app when `STATIC_DIR` is set (in the image it
  is `/app/client/dist`), so the UI and the API share one origin.
- `deploy/smoke_test.py` checks `/api/health`, `/api/ready` and `/`.
  The kit's `/api/categories` check was removed because our API has no such
  endpoint.
- Sessions are stored in the `AuthSession` table, so users stay signed in
  across restarts and redeploys.

## 2. Environment variables

Every setting comes from the environment. Only `.env.example` files with
placeholder values are committed. `.env` is listed in `.gitignore`.

| Variable | Used by | Purpose | Secret? | Local value from | Cloud value from |
|---|---|---|---|---|---|
| `DATABASE_URL` | server, migrate job | PostgreSQL connection for Prisma | Yes | `server/.env` | Secret Manager `pmels-database-url` |
| `PORT` | server | Port the API listens on | No | `server/.env` (3000) | Cloud Run (3000) |
| `CLIENT_ORIGIN` | server | Origin allowed by CORS | No | `server/.env` | Not needed (same origin) |
| `STATIC_DIR` | server | Folder of the built React app | No | Unset in local dev | `Dockerfile` (`/app/client/dist`) |
| `NODE_ENV`, `TZ` | server, migrate job | Runtime mode and time zone | No | Shell | `Dockerfile` and `deploy/deploy.sh` |
| `SEED_ADMIN_PASSWORD` | seed | Password of `system.admin@money.local` | Yes | `server/.env` | Secret Manager `pmels-admin-password` (migrate job only) |
| `SEED_USER_PASSWORD` | seed | Password of the five demo users | Yes | `server/.env` | Secret Manager `pmels-demo-password` (migrate job only) |
| `VITE_API_URL` | client build | API base URL | No | Unset (Vite proxy) | Empty in the image (same origin) |
| `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT` | `deploy.yml` | Where and as whom to deploy | No | – | GitHub environment `demo` variables |

The demo account passwords are shared with the Lab 6 partner team privately.
They are never written in code, Issues, screenshots or this document.

## 3. Commands

### Local development

```bash
cp server/.env.example server/.env        # fill in local synthetic values
npm --prefix server install
npm --prefix client install
npm --prefix server run prisma:deploy     # apply migrations
npm --prefix server run prisma:seed       # create admin and demo users
npm --prefix server run dev               # API on http://localhost:3000
npm --prefix client run dev               # UI on http://localhost:5173
```

### Tests and build

```bash
npm --prefix server test                  # API tests against PostgreSQL
npm --prefix client test                  # UI tests
npm run build                             # server and client builds
docker build -t pmels:latest .            # unified production image
```

### Run everything in Docker

```bash
docker compose up --build                 # db, migrate (migrations + seed), server :3000, client :5173
docker compose down                       # stop; add -v to also delete the local database volume
```

`docker-compose.yml` starts PostgreSQL, a one-off migrate and seed job, the
API on port 3000 and the UI on port 5173. Its default seed passwords are
synthetic local-only values; set `SEED_ADMIN_PASSWORD` and
`SEED_USER_PASSWORD` in your shell or a root `.env` to override them.

## 4. Google Cloud resources

| Resource | Name |
|---|---|
| Project / region | `cpe334-en-008` / `asia-southeast1` |
| Cloud Run service | `pmels` (min 0, max 3 instances, 512 MiB, port 3000, public) |
| Cloud Run job (migrations and seed) | `pmels-migrate` |
| Cloud SQL instance / database / user | `pmels-pg` / `pmels` / `pmels` (PostgreSQL 16, `db-f1-micro`, 10 GB SSD) |
| Artifact Registry repository / image | `pmels` / `pmels` |
| Secrets | `pmels-database-url`, `pmels-admin-password`, `pmels-demo-password` |
| Runtime service account | `pmels-runner` (Cloud SQL Client on the project; Secret Accessor on each of its secrets) |
| Deploy service account | The account in the `WIF_SERVICE_ACCOUNT` variable of environment `demo` |
| GitHub environment | `demo` (holds the four variables above) |

The first deployment was made once by hand from Cloud Shell:

```bash
DRY_RUN=1 PROJECT_ID=cpe334-en-008 REGION=asia-southeast1 bash deploy/deploy.sh --demo   # read the plan
PROJECT_ID=cpe334-en-008 REGION=asia-southeast1 bash deploy/deploy.sh --demo
gcloud sql instances patch pmels-pg --no-storage-auto-increase
```

`--demo` is required because the seed always needs both passwords.

## 5. CI and the merge gate

- `.github/workflows/ci-docker.yml` runs on every pull request into `main` and
  `lab5-staging`. Its job `test-and-docker` checks the deploy scripts offline,
  starts PostgreSQL 16, applies migrations, seeds with CI-only passwords, runs
  the server and client tests, builds the client and builds the Docker image.
- Ruleset on `main`: a pull request with one approval, the `test-and-docker`
  status check with the branch up to date, and no deletion or force push.
- PR #34 proved the gate: one test was broken on purpose, `test-and-docker`
  failed and the merge was blocked. The PR was closed without merging.

## 6. Release procedure

1. Open an Issue for the change and label it `lab5`.
2. Create a branch from `lab5-staging`, for example `LAB5-9-deployment-doc`.
3. Commit, push and open a pull request into `lab5-staging`. CI must pass, and
   the other student reviews it with a specific check before merging.
4. Open a release pull request from `lab5-staging` into `main`. CI must pass
   again and the other student approves it.
5. Merging into `main` starts the workflow **Deploy demo**
   (`.github/workflows/deploy.yml`):
   1. reuses `ci-docker.yml` (`test` job);
   2. signs in to Google Cloud with Workload Identity Federation;
   3. builds the image and pushes it tagged with the full commit SHA;
   4. `deploy/release.sh` resolves the image digest, runs the `pmels-migrate`
      job and updates the `pmels` service to that digest;
   5. `deploy/smoke_test.py` checks the public URL;
   6. the run summary records the image tag, digest and URL.

### How to find the commit that is running

- The **Deploy demo** run summary shows the image tag, which is the full commit
  SHA of the release, and the image digest.
- Cloud Run → `pmels` → Revisions: the revision with 100% of the traffic shows
  the same image digest.
- The merge commit on `main` is the same SHA as the image tag.

### Roll back

Actions → **Deploy demo** → Run workflow on `main`, and enter the full 40-character
SHA of the last release that worked as `image_tag`. The workflow skips tests,
build and migration, deploys that image and runs the smoke test. Then fix
forward through a normal pull request. Migrations are additive, so an older
image still works with the current schema.

## 7. Release history (Lab 5)

| Release PR | Merge commit | Content | Deploy demo |
|---|---|---|---|
| #31 | `e1728df` | Cloud-ready app, Docker, CI | – (workflow not yet on `main`) |
| #33 | `e62f807` | Deploy scripts adapted to PMELS | – (first deploy by hand) |
| #36 | `ddb0b21` | Deploy workflow | Run #1: authentication failed until the WIF provider was corrected; attempt 3 succeeded |
| #38 | `0487c99` | Visible deployment proof on the login page | Run #2: success |
| #40 | `e304b9d` | Users stay signed in after reload | Run #3: success |

Lab 5 step to Issue mapping: Step 1 #19, Step 2 #20, Step 3 #21, Step 4 #22,
Step 5 #23, Step 6 #24, Step 7 #25, Step 8 #26, Step 9 #27.

Notes:

- PR #28 (Step 2) was merged into `sprint1-staging` before `lab5-staging`
  existed. `lab5-staging` was created from that merge commit (`5429333`).
- The first manual deploy failed at the migration job because the seed was
  started with `node --env-file=.env` and the container has no `.env`. It was
  fixed in PR #32 and deployed again.

## 8. Cost control and clean-up

- Keep the Free Trial budget alert from Step 1 (Issue #19) in place.
- Cloud Run scales to zero when idle (`--min-instances 0`).
- Cloud SQL bills every hour it exists. The service stays running until the
  end of grading. After the course, run `bash deploy/teardown.sh` to delete
  all `pmels` resources.
