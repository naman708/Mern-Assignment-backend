# API curl Reference (Postman-importable)

This document lists every backend endpoint as a ready-to-use `curl` command with a short
explanation of what it does.

## How to import into Postman
- **Single request:** Copy any curl block below → in Postman click **Import → Raw text** →
  paste → **Continue → Import**. Postman parses the method, URL, headers, and body.
- **Bulk:** Paste several curl blocks into a `.txt` file and import the file the same way.

## Conventions
- **Base URL:** `http://localhost:5000` (server `PORT=5000`, configurable via `.env` / `APP_URL`).
- **Placeholders to replace:**
  - `ACCESS_TOKEN` — access token returned by login (sent as `Authorization: Bearer ...`, expires ~15 min).
  - `REFRESH_TOKEN` — refresh token returned by login (sent in JSON body, expires ~7 days).
  - `USER_ID` — a user UUID.
  - `EMAIL_TOKEN` — token taken from the verify-email / reset-password email link.
- **Auth model:** Protected routes need the header `Authorization: Bearer ACCESS_TOKEN`.
- **Rate limited** (15-min window, 30 req max): `register`, `login`, `forgot-password`, `reset-password`.

---

## Auth endpoints — `/api/auth`

### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "password=Passw0rd123" \
  -F "profileImage=@/path/to/avatar.png"
```
Creates a new user account and sends an email-verification link. `profileImage` is optional
(JPEG/PNG/WebP, max 2MB); drop the last `-F` line to register without an image.
Password must be ≥8 chars and contain a letter and a number. **Public, rate-limited.**

### 2. Verify email
```bash
curl -X GET "http://localhost:5000/api/auth/verify-email?token=EMAIL_TOKEN"
```
Verifies a user's email address using the token from the verification email link. **Public.**

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Passw0rd123"}'
```
Authenticates the user and returns the `user` object plus `accessToken` and `refreshToken`.
**Public, rate-limited.**

### 4. Refresh token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```
Exchanges a valid refresh token for a new access + refresh token pair (token rotation). **Public.**

### 5. Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```
Invalidates the given refresh token (revoked in Redis) so it can no longer be used. **Public.**

### 6. Forgot password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com"}'
```
Sends a password-reset link to the email if it exists. Always returns a generic message
(does not reveal whether the email is registered). **Public, rate-limited.**

### 7. Reset password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"EMAIL_TOKEN","password":"NewPassw0rd123"}'
```
Sets a new password using the reset token from the email link. New password must be ≥8 chars
with a letter and a number. **Public, rate-limited.**

---

## User endpoints — `/api/users`
All user routes require `Authorization: Bearer ACCESS_TOKEN`.

### 8. List users
```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10&search=jane" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```
Returns a paginated list of users with metadata. Query params are optional: `page` (default 1),
`limit` (1–100, default 10), `search` (matches name or email). **Auth required.**

### 9. Get current user
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```
Returns the authenticated user's own profile. **Auth required.**

### 10. Update current user
```bash
curl -X PUT http://localhost:5000/api/users/me \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "name=Jane Updated" \
  -F "profileImage=@/path/to/new-avatar.png"
```
Updates the authenticated user's name and/or profile image. Both fields optional
(`profileImage`: JPEG/PNG/WebP, max 2MB). **Auth required.**

### 11. Get user by ID
```bash
curl -X GET http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer ACCESS_TOKEN"
```
Returns the public profile of the user with the given UUID. **Auth required.**

### 12. Delete user
```bash
curl -X DELETE http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer ACCESS_TOKEN"
```
Deletes a user account. **Admin role required** (non-admins get 403). You cannot delete your
own account via this endpoint (returns 400). **Auth required.**

---

## System endpoints

### 13. Health check
```bash
curl -X GET http://localhost:5000/api/health
```
Liveness/readiness check. Returns `{ "success": true, "status": "ok" }`. **Public.**

### 14. API welcome
```bash
curl -X GET http://localhost:5000/
```
Returns the API welcome message and docs pointer. **Public.**

---

## Quick start flow
1. **Register** (or use an existing account) → check email and **verify-email**.
2. **Login** → copy `accessToken` and `refreshToken` from the response.
3. Use `accessToken` as the `Bearer` token for all `/api/users` calls.
4. When the access token expires (~15 min), call **refresh** to get a new pair.
5. **Logout** to revoke the refresh token when done.

> Tip: In Postman, create an environment with variables `baseUrl`, `accessToken`,
> `refreshToken` and replace the placeholders above with `{{accessToken}}` etc. so requests
> stay in sync.
