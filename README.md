# KKB

KKB is a mobile-responsive shared-expense app with a React frontend and a Kotlin/Spring Boot backend. PostgreSQL is the source of truth, and production runs through Docker Compose behind Caddy.

## Local development

Requirements: Node.js 24, Java 21, PostgreSQL 17, and Docker for integration tests.

Create a local PostgreSQL database named `kkb`, then start the backend:

```bash
cd backend
DB_USERNAME=kkb DB_PASSWORD=kkb ./gradlew bootRun
```

In another terminal, start the frontend:

```bash
npm install
npm run dev
```

Vite proxies API and OAuth routes to Spring Boot. Without Google credentials, the backend starts normally but Google sign-in is unavailable. Activate the `seed` Spring profile only in development to create an example group after the first successful Google login.

## Google OAuth

Create a Google OAuth 2.0 web client with these authorized redirect URIs:

- `http://localhost:5173/login/oauth2/code/google`
- `https://kkb-app.space/login/oauth2/code/google`

Use `http://localhost:5173` and `https://kkb-app.space` as authorized JavaScript origins. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. The login entry point is `/oauth2/authorization/google`.

Group owners invite members by email. If that email already belongs to a KKB user, membership is immediate. Otherwise, the invitation remains pending and is accepted automatically when the matching Google account first signs in. KKB does not send invitation emails.

## Money and exchange rates

Expense and settlement amounts are submitted as decimal strings, stored as integer minor units, and returned in the exact currency originally entered. KKB also stores the corresponding PHP value using the rate for the expense or settlement date. That locked value never changes later.

Historical and daily rates come from the free Frankfurter v2 API. Missing historical rates are fetched on demand, while a scheduled job preloads the previous day's supported rates at 01:30 Asia/Manila time.

Authenticated routes include:

- `GET` and `POST /api/groups`
- `POST /api/groups/{groupId}/invites`
- `GET` and `POST /api/groups/{groupId}/expenses`
- `GET` and `POST /api/groups/{groupId}/settlements`
- `GET /api/groups/{groupId}/balances`
- `GET /api/fx/rates?date=YYYY-MM-DD`

## Production deployment

Production uses:

- DNS for `kkb-app.space` pointing to the VPS
- Docker Engine and Docker Compose
- Caddy-managed HTTPS
- PostgreSQL and Spring Session in Docker volumes
- daily local PostgreSQL backups in `/var/backups/kkb`
- backend and web images built by GitHub Actions and published to GHCR

Prepare a new Ubuntu VPS as root:

```bash
./ops/bootstrap-vps.sh
git clone https://github.com/christianrazul/kkb-app.git /opt/kkb
cd /opt/kkb
cp .env.example .env
```

Replace `POSTGRES_PASSWORD`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `/opt/kkb/.env`. Never commit that file. Once the GHCR packages are public and DNS is live, deploy with:

```bash
cd /opt/kkb
git pull --ff-only
./ops/deploy.sh
```

Set `IMAGE_TAG` in `.env` to a full Git commit SHA to deploy or roll back to an immutable image. Omit it to use `latest`.

## Backups

The backup container immediately creates a compressed PostgreSQL archive and repeats daily. It retains 14 days by default. These backups are on the same VPS and do not protect against total server loss.

Verify a backup by restoring it into an isolated temporary PostgreSQL container:

```bash
./ops/verify-backup.sh /var/backups/kkb/kkb-YYYYMMDDTHHMMSSZ.dump
```

## Verification

```bash
npm run build
npm run lint
cd backend
./gradlew test
```

Flyway owns the database schema. Hibernate validates it at startup and does not modify it. The public health endpoint is `https://kkb-app.space/health`.
