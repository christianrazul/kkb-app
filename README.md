# KKB

KKB is a shared-expense app with a React frontend and a Kotlin/Spring Boot backend. PostgreSQL is the source of truth, and production runs through Docker Compose behind Caddy.

## Local development

Requirements: Node.js 24, Java 21, and PostgreSQL 17.

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

Vite proxies API and OAuth routes to Spring Boot. Without Google credentials, the backend starts normally but Google sign-in is unavailable.

## Google OAuth

Create a Google OAuth 2.0 web client and configure these redirect URIs:

- Local: `http://localhost:5173/login/oauth2/code/google`
- Production: `https://your-domain/login/oauth2/code/google`

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` before using sign-in. The login entry point is `/oauth2/authorization/google`.

## VPS deployment

Copy the example environment file and replace every example value:

```bash
cp .env.example .env
docker compose up -d --build
```

Caddy obtains and renews TLS certificates for `SITE_ADDRESS`, serves the React app, and proxies API and Google OAuth traffic to the backend. PostgreSQL and session data live in named Docker volumes.

## Backend verification

```bash
cd backend
./gradlew test
```

Flyway owns the schema. Hibernate validates it at startup and does not modify it.
