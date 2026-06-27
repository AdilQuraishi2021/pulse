# Issue 1: Credentials and API Trust

## Findings

- Passwords were stored as `sha256(password + "salt")`. The salt was global and public, and SHA-256 is fast, so a database leak would allow cheap offline cracking with precomputed or GPU-assisted guesses. Severity: critical for account takeover risk.
- The web clients recreated gRPC JWTs from cookie session data and a shared default `GRPC_JWT_SECRET`. Anyone who knew the published fallback secret, or who could tamper with trusted cookie contents, could forge an API token with a higher role.

## Fix

- New password hashes use Node's `scrypt` with a random per-password salt and encoded work parameters.
- Legacy SHA-256 hashes are still accepted during login, then immediately replaced with a scrypt hash after the password is proven. This lets existing seeded users log in without knowing their plaintext passwords ahead of time.
- The API no longer has a published fallback JWT secret. When `GRPC_JWT_SECRET` is not set, a process-local random secret is generated.
- Client apps now store and forward only the API-issued session token returned by login/register. They no longer import `jsonwebtoken` or mint gRPC auth tokens.

## Proof

- `apps/api/src/services/auth.service.test.ts` verifies new registrations receive scrypt hashes and legacy users can log in once and upgrade.
- `apps/api/src/middleware/auth.test.ts` verifies API-issued tokens validate and tokens forged with the old default secret are rejected.
