# MERN Assignment — Backend API

A production-shaped REST API for the MERN stack assignment, built with **TypeScript + Express**,
**Sequelize (MySQL)**, **Redis**, and **JWT authentication with refresh-token rotation**. The React
frontend lives in a separate repository; this service is API-only and serves uploaded images
statically.

## Features

| Requirement | Implementation |
| --- | --- |
| MySQL via Sequelize ORM | `src/config/database.ts`, models in `src/models/` |
| Redis caching | `src/services/cache.service.ts` — caches user lists/profiles, stores verify/reset tokens with TTL |
| JWT + refresh tokens | `src/services/token.service.ts` — access + rotating refresh tokens, server-side revocation via `RefreshToken` model |
| Multer file uploads | `src/middlewares/upload.middleware.ts` — single `profileImage`, type + size limits |
| express-validator | `src/validators/`, collected by `src/middlewares/validate.middleware.ts` |
| Lazy-loading | Lazy router mounting in `src/routes/index.ts`; Sequelize lazy associations by default |
| RBAC | `src/middlewares/rbac.middleware.ts` — admins can delete users |
| Email (verification + reset) | Nodemailer; Ethereal dev transport logs preview URLs |
| Pagination + search | `GET /api/users?page&limit&search` |

## Tech stack

Express · TypeScript · Sequelize · mysql2 · ioredis · jsonwebtoken · bcryptjs · multer ·
express-validator · nodemailer · helmet · cors · compression · express-rate-limit · morgan

## Getting started (local)

### Prerequisites
- Node.js ≥ 18
- A running **MySQL** instance and a **Redis** instance

### Setup
```bash
npm install
cp .env.example .env      # then edit values (DB creds at minimum)
npm run seed:admin        # creates admin@example.com / Admin@12345 (verified admin)
npm run dev               # starts on http://localhost:3000
```

On boot the server connects to MySQL, syncs the schema, connects to Redis, and starts listening.
Email uses an **Ethereal test account** by default — no real mail is sent; a **preview URL is
printed in the server logs** for every email (verification, password reset). Open that URL to click
the link.

### Build & run (production)
```bash
npm run build   # tsc -> dist/
npm run start   # node dist/server.js
```

## Environment variables

See [`.env.example`](./.env.example) for the full list. Key ones:

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` *or* `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` | MySQL connection |
| `DB_SSL` | `true` for most managed MySQL providers |
| `REDIS_URL` | Redis connection (Render Key Value / Upstash / local) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | token signing secrets |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | token lifetimes (`15m`, `7d`) |
| `EMAIL_PROVIDER` | `ethereal` (dev) or `smtp` (uses `SMTP_*`) |
| `APP_URL` | public URL of this API (builds email + image URLs) |
| `CLIENT_URL` | frontend origin (CORS + reset-link target) |

## API

Base path: `/api`

### Auth (`/api/auth`)
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/register` | multipart: `name`, `email`, `password`, `profileImage?` | creates unverified user, sends verification email |
| GET | `/verify-email?token=` | — | verifies email |
| POST | `/login` | `email`, `password` | returns `{ user, accessToken, refreshToken }` |
| POST | `/refresh` | `refreshToken` | rotates and returns a new pair |
| POST | `/logout` | `refreshToken` | revokes the refresh token |
| POST | `/forgot-password` | `email` | sends reset email (always 200) |
| POST | `/reset-password` | `token`, `password` | sets new password, revokes all sessions |

### Users (`/api/users`) — all require `Authorization: Bearer <accessToken>`
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/?page&limit&search` | paginated, searchable list (cached) |
| GET | `/me` | current user's profile |
| PUT | `/me` | edit profile (multipart, optional `profileImage`) |
| GET | `/:id` | view a user's profile |
| DELETE | `/:id` | **admin only** (RBAC) |

### Response shape
```jsonc
// success
{ "success": true, "message": "...", "data": { /* ... */ }, "meta": { /* pagination */ } }
// error
{ "success": false, "message": "...", "errors": [ { "field": "email", "message": "..." } ] }
```

Try it end-to-end with [`requests.http`](./requests.http) (VS Code REST Client).

## Deploying on Render

Render has **no managed MySQL** — only PostgreSQL and Key Value (Redis). So:

1. Provision **MySQL** on an external free tier (Aiven / Railway / Clever Cloud / PlanetScale) and
   copy its connection string.
2. Use the included [`render.yaml`](./render.yaml) blueprint. It defines the web service and a Key
   Value (Redis) instance, and wires `REDIS_URL` automatically.
3. Set `DATABASE_URL` (the external MySQL string), `DB_SSL=true`, `APP_URL` (your Render URL), and
   `CLIENT_URL` (your frontend URL) in the Render dashboard.

> **Ephemeral filesystem:** Render's disk is wiped on each deploy/restart, so Multer disk uploads
> won't persist. Fine for evaluating the assignment. For durable storage, add a Render persistent
> disk or swap the upload middleware for **Cloudinary** (the controllers already store a full image
> URL, so only `upload.middleware.ts` would change).

## Project structure
```
src/
  config/      env, database, redis, logger, mailer
  models/      user, refreshToken (+ associations)
  middlewares/ auth, rbac, validate, upload, error
  validators/  auth, user (express-validator chains)
  controllers/ auth, user
  services/    auth, user, token, email, cache
  routes/      auth, user, index (lazy-mounted)
  utils/       ApiError, ApiResponse, asyncHandler
  scripts/     seedAdmin
  app.ts  server.ts
```

## Notes / out of scope
- **Google OAuth** is intentionally skipped (optional in the assignment).
- No automated test suite yet; `requests.http` covers manual end-to-end testing.
- Email verification + password-reset tokens live in **Redis with TTL** rather than the database.
