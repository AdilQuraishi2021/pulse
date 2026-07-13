# Pulse Project Interview Preparation

## 1. Elevator Pitch

Pulse is a Twitter-like social media platform built as a TypeScript monorepo. It has a user-facing app, an admin moderation app, a gRPC API server, shared protocol definitions, shared UI components, database schema packages, realtime updates, AI writing tools, and a full validation pipeline.

A strong interview explanation:

> This project is a full-stack social platform built with TanStack Start, React 19, TypeScript, gRPC, Drizzle ORM, MySQL-compatible schema, StyleX, Socket.IO, Vitest, Playwright, pnpm workspaces, and Turborepo. The main engineering work was not only adding features, but also refactoring production risks: password security, API trust boundaries, N+1 query performance, consistent error handling, observability, test isolation, and CI/developer workflow.

## 2. What The Software Does

Pulse supports two major experiences:

- User application: registration, login, posts, comments, likes, follows, profiles, feeds, search, bookmarks, notifications, mentions, reports, messages, realtime activity, and AI-assisted writing.
- Admin application: dashboard, user management, post moderation, comment moderation, report review, audit logs, and admin-only actions.

The product behaves like a small social network. Users create and interact with content. Admins monitor the platform and moderate unsafe or reported content.

## 3. Repository Structure

- `apps/client-user`: main user-facing TanStack Start application.
- `apps/client-admin`: admin dashboard TanStack Start application.
- `apps/api`: backend API server, gRPC handlers, business services, database access, observability, and realtime Socket.IO server.
- `packages/proto`: protocol buffer service contracts and generated TypeScript types.
- `packages/grpc-client`: shared gRPC client factory used by the frontend server functions.
- `packages/db-schema`: Drizzle schema and inferred TypeScript database types.
- `packages/ui`: shared React UI components and StyleX design tokens.
- `packages/shared-types`: shared TypeScript types.
- `db/migrations`: database migration files.
- `docs`: audit notes, setup guide, and this interview guide.
- `tooling/typescript`: shared TypeScript configuration.

## 4. Technology Stack

### Frontend

- React 19 for UI components.
- TanStack Start for full-stack routing and server functions.
- TanStack Router for route definitions.
- TanStack Query patterns for data-oriented UI.
- StyleX for typed, co-located styling.
- lucide-react for icons.
- Socket.IO client for realtime updates.
- Vite for local dev and production builds.

### Backend

- Node.js with TypeScript.
- Elysia for lightweight HTTP endpoints such as `/health`.
- gRPC via `@grpc/grpc-js` and `@protobuf-ts/grpc-backend`.
- Protocol Buffers as the API contract.
- Drizzle ORM for database queries.
- MySQL-compatible schema definitions through `drizzle-orm/mysql-core`.
- Socket.IO for realtime events.
- JSON Web Tokens for API-issued session tokens.
- Gemini API integration for AI writing tools.

### Monorepo And Tooling

- pnpm workspaces for package management.
- Turborepo for task orchestration and caching.
- Biome for formatting and linting.
- TypeScript strict project configs.
- Vitest for unit tests.
- Playwright for end-to-end tests.
- GitHub Actions for CI.
- Git hooks for pre-commit checks.

## 5. How The Application Process Works

### Startup Process

1. Dependencies are installed with `pnpm install`.
2. Protocol buffer TypeScript files are generated with `pnpm run proto:generate`.
3. Database migrations are generated and applied with `pnpm run db:generate` and `pnpm run db:migrate`.
4. Seed data is inserted with `pnpm run db:seed`.
5. `pnpm run dev` starts the monorepo services.
6. The user app runs on `http://localhost:3000`.
7. The admin app runs on `http://localhost:3002`.
8. The API health endpoint runs on `http://localhost:3001/health`.
9. The gRPC API runs on `localhost:50051`.
10. Socket.IO runs on the same HTTP server as the API.

### Request Flow

For a normal user action, such as liking a post:

1. The user clicks a button in a React component.
2. The component calls a TanStack Start server function.
3. The server function reads the session token from the secure session cookie.
4. It creates a gRPC client using `packages/grpc-client`.
5. It sends a protobuf request to the API.
6. The API gRPC handler validates the session and request.
7. The handler delegates business logic to a service in `apps/api/src/services`.
8. The service uses Drizzle to read or write database rows.
9. The service may emit Socket.IO events for realtime updates.
10. The handler returns a protobuf response.
11. The frontend updates the UI.

### Authentication Flow

Registration:

1. User submits email, username, display name, and password.
2. Frontend server function calls `AuthService.register`.
3. API checks duplicate email and username.
4. API hashes the password using a secure scrypt-based format.
5. API creates the user.
6. API issues a session token.
7. Frontend stores only the API-issued token in session data.

Login:

1. User submits email and password.
2. API loads the user by email.
3. API rejects banned users.
4. API verifies the password.
5. If the hash is legacy, API upgrades it after successful login.
6. API issues a new session token.
7. Frontend validates and stores the token.

Important interview point:

> The clients no longer mint their own trusted API tokens. The API is the source of truth for session tokens, which fixes the trust-boundary issue.

### Feed Flow

The feed system supports modes such as latest, trending, friends, recommended, topic, industry, community, and nearby.

1. API selects candidate posts.
2. It joins author information.
3. It batches metrics such as like count, comment count, and viewer liked state.
4. It ranks posts depending on feed type.
5. It slices by limit and offset.

The important refactor is `getPostMetrics`, which replaces per-post metric queries with batched queries.

### Admin Flow

Admin routes call admin server functions, which call admin gRPC methods. The API checks the session token and role before allowing administrative operations. Admin actions can create audit log entries so there is a record of moderation work.

### Realtime Flow

Socket.IO is initialized from the API HTTP server. Clients connect with a user id, join user-specific or post-specific rooms, and receive events for:

- notifications
- new comments
- post updates
- likes/reactions
- follows
- messages
- presence changes
- admin analytics

## 6. Database Design

Core tables:

- `users`: account, profile, role, ban status, online status.
- `posts`: post content and author.
- `comments`: comments with one-level nested reply support through `parentId`.
- `likes`: post or comment reactions, with uniqueness constraints.
- `follows`: follower/following relationships.
- `bookmarks`: saved posts.
- `notifications`: user notifications.
- `reports`: moderation reports.
- `audit_logs`: admin action history.

Extended social tables:

- `friend_requests`
- `shares`
- `reposts`
- `conversations`
- `conversation_participants`
- `messages`
- `badges`
- `user_badges`

Important database design points:

- Foreign keys use cascade delete for related social data.
- Unique constraints prevent duplicate likes, follows, bookmarks, friend requests, and badge awards.
- Role is modeled as an enum: `user`, `admin`, `moderator`.
- Report status is modeled as an enum: `pending`, `reviewed`, `actioned`, `dismissed`.

## 7. Main Challenges And How They Were Solved

### Challenge 1: Weak Credential Storage

Problem:

The old password approach used a fast SHA-256 hash with a shared salt. If the database leaked, attackers could crack many passwords cheaply.

Solution:

- Use scrypt with a random per-password salt.
- Store encoded hash metadata.
- Keep backward compatibility by accepting old hashes only during successful login.
- Immediately rehash legacy passwords after verification.

How to explain:

> I treated password migration as an incremental compatibility problem. We cannot ask every existing user for plaintext passwords, so the safe approach is login-time migration: verify the old hash once, then replace it with the stronger format.

### Challenge 2: Client/API Trust Boundary

Problem:

The clients could recreate gRPC JWTs using session data and a default secret. That means the frontend had too much authority.

Solution:

- Remove client-side token minting.
- Store and forward API-issued session tokens only.
- Remove the published fallback secret.
- Generate a process-local secret if no secret is configured.

How to explain:

> The API must be the authority. A client can hold a token, but it should not be able to create one with elevated privileges.

### Challenge 3: N+1 Query Performance

Problem:

Loading lists of posts triggered repeated queries for each post's like count, comment count, and liked state. Ten posts could create dozens of SQL queries.

Before:

- Home feed with 10 posts: 32 queries.
- Profile page with 10 posts: 37 queries.
- Bookmarks page with 10 posts: 41 queries.

Solution:

- Add `getPostMetrics`.
- Batch metrics by post id.
- Use grouped count queries.
- Load bookmarked post details in the same paginated query.
- Add tests that lock query counts.

After:

- Home feed with 10 posts: 5 queries.
- Profile page with 10 posts: 6 queries.
- Bookmarks page with 10 posts: 4 queries.

How to explain:

> The fix was to move from per-row enrichment to batch enrichment. The API response stayed the same, but the query shape became stable as page size grows.

### Challenge 4: Inconsistent Error Handling

Problem:

Different handlers handled errors differently. Some returned `{ success: false, error }`, some threw, and some swallowed errors.

Solution:

- Add an error taxonomy.
- Normalize errors into gRPC status codes.
- Keep existing response contracts where clients depend on them.
- Wrap all gRPC handlers with `withObservability`.

Error categories:

- `INVALID_ARGUMENT`
- `UNAUTHENTICATED`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `ALREADY_EXISTS`
- `FAILED_PRECONDITION`
- `INTERNAL`

How to explain:

> I separated public API compatibility from internal consistency. The client response shape did not have to break, but the server still needed one place to classify, log, trace, and convert errors.

### Challenge 5: No Request Tracing

Problem:

Production debugging would be difficult because there was no request-level trace id or structured logging.

Solution:

- Generate or accept `x-trace-id`.
- Store trace context in `AsyncLocalStorage`.
- Add structured JSON logs for request start, finish, handled error responses, and thrown exceptions.
- Return trace id in gRPC trailers.

How to explain:

> Every gRPC call now has a trace id that follows it through the service layer. That makes logs searchable and gives support/debugging teams a concrete id to investigate.

### Challenge 6: Test Isolation

Problem:

E2E tests used shared seeded users and shared mutable data. Full parallelism could make tests order-dependent.

Solution:

- Keep API unit tests isolated with clean test data.
- Disable full Playwright parallelism until per-test data isolation exists.
- Fix helper types and flaky test state assumptions.

How to explain:

> The short-term fix was to make the test runner honest and deterministic. The long-term fix would be per-test users or per-test database resets.

### Challenge 7: Missing CI And Developer Workflow

Problem:

There was no complete PR validation pipeline and no practical pre-commit validation.

Solution:

- Add GitHub Actions CI.
- Install dependencies with a frozen lockfile.
- Generate protobuf types.
- Run affected typecheck, lint, unit tests, and builds.
- Add pre-commit hooks for staged Biome checks and affected typechecks.
- Tune Turbo caching for build, lint, test, dev, database, and E2E tasks.

How to explain:

> The CI is designed around the monorepo. It validates the changed packages and their dependents instead of rebuilding the entire world unnecessarily.

## 8. Feature-by-Feature Talking Points

### Posts

- Users can create, edit, and delete posts.
- Post content is capped for social-network style constraints.
- Post cards show author, content, timestamps, counts, and actions.
- Metrics are enriched through batched backend utilities.

### Comments

- Comments support one level of nesting.
- Comment events can emit realtime updates to post rooms.
- Likes can apply to comments as well as posts.

### Likes/Reactions

- The `likes` table supports reaction types.
- Unique constraints prevent duplicate likes per user and target.
- Realtime events update other clients.

### Follows

- `follows` stores follower and following ids.
- Follow relationships influence friends feed and profile counts.
- Unique constraints prevent duplicate follows.

### Bookmarks

- Authenticated users can save posts.
- Bookmark pages fetch saved posts with their metrics.
- Query optimization matters here because bookmarks are list-heavy.

### Notifications

- Notifications are stored in the database.
- Realtime notification events can be emitted to user rooms.
- Notifications cover likes, comments, follows, mentions, and similar actions.

### Reports And Moderation

- Users can report posts, comments, or users.
- Admins review reports and take action.
- Admin work can be recorded in audit logs.

### AI Writing Tools

- The API integrates with Gemini when `GEMINI_API_KEY` is configured.
- AI tools help rewrite, summarize, improve grammar, change tone, expand, shorten, generate hashtags, and improve engagement.
- The feature is optional in development if no key is provided.

### Realtime And Presence

- Socket.IO tracks online users by connection count.
- A user is only considered offline when their final connection disconnects.
- Post rooms support comment typing and post-specific events.
- User rooms support notifications and messages.

## 9. Security Preparation

Important points to mention:

- Passwords use slow hashing, not reversible encryption.
- Random salts prevent precomputed rainbow-table attacks.
- Login-time migration avoids forcing a password reset.
- JWT/session token authority belongs to the API.
- Admin routes require role checks.
- Banned users are blocked at login.
- Secrets should come from environment variables in real deployments.
- The API currently uses insecure local gRPC credentials for development; production should use TLS or run behind trusted infrastructure.

Potential improvement to mention:

> In production I would also add refresh-token rotation, rate limiting for login attempts, audit logs for authentication events, secure cookie settings by environment, and managed secret storage.

## 10. Performance Preparation

Important points to mention:

- The biggest backend performance risk was N+1 query behavior.
- The fix was batching, not just adding indexes.
- Query-count tests prevent regression.
- Feed ranking fetches candidate posts and ranks in memory for the supported scope.
- For larger scale, ranking could move to a search/indexing system or precomputed feed service.

Potential improvement to mention:

> At larger scale I would introduce cursor pagination, database indexes based on real query plans, read replicas, caching for hot counts, and potentially materialized feed tables.

## 11. Observability Preparation

Important points to mention:

- Every gRPC call is wrapped by `withObservability`.
- Trace ids are accepted from metadata or generated server-side.
- Trace context is stored with `AsyncLocalStorage`.
- Logs are structured JSON.
- gRPC errors include trace metadata.
- Error classification maps domain failures to meaningful gRPC status codes.

Potential improvement to mention:

> Next I would connect these logs to OpenTelemetry and export traces/metrics to a production backend such as Datadog, Grafana, Azure Monitor, or another observability platform.

## 12. Testing Preparation

Testing layers:

- Unit tests for UI components in `packages/ui`.
- Unit tests for client components and utilities.
- API service tests for auth, posts, comments, likes, follows, AI, observability, and query performance.
- Handler tests for gRPC handler behavior.
- Playwright E2E tests for user and admin workflows.
- CI validates typecheck, lint, unit tests, and builds.

Good interview explanation:

> I used unit tests for business logic and edge cases, query-count tests for performance regressions, and Playwright tests for complete user/admin workflows. For test stability, I disabled unsafe full parallelism until test data isolation is stronger.

## 13. Build And Developer Experience

Commands to know:

```bash
pnpm install
pnpm run proto:generate
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
pnpm run typecheck
pnpm run lint
pnpm run test:unit
pnpm run build
```

How to explain Turborepo:

> Turborepo orchestrates tasks across apps and packages. Build tasks depend on upstream builds, dev tasks are persistent and uncached, database mutation and E2E tasks are uncached, and CI uses affected-package execution to reduce unnecessary work.

## 14. How To Explain The Architecture In An Interview

Use this script:

> Pulse is organized as a pnpm/Turbo monorepo. The two frontend apps are TanStack Start applications. They do not call the database directly. Instead, UI actions call TanStack server functions, which call a shared gRPC client. The API server exposes protobuf-defined services. Each gRPC handler validates input and auth, delegates to a service layer, and the service layer uses Drizzle ORM against the database. Shared packages keep the API contracts, database schema, UI components, and types consistent across the repo. Realtime updates are handled by Socket.IO from the API server.

Then add:

> The major refactoring focus was production readiness: stronger credential storage, correct API trust boundaries, batched query patterns, request tracing, structured logs, deterministic tests, and monorepo-aware CI.

## 15. Common Interview Questions And Answers

### Q: Why use gRPC instead of REST?

A: gRPC gives strongly typed contracts through protobuf, which is useful in a monorepo with multiple frontend apps and many backend services. It also makes service boundaries explicit. REST would also work, but protobuf reduces contract drift when many request/response types exist.

### Q: Why have server functions between React and gRPC?

A: The frontend components should not directly manage backend tokens or Node-only gRPC details. TanStack Start server functions act as a secure backend-for-frontend layer. They read session data, call gRPC, normalize errors, and return UI-friendly data.

### Q: How did you fix password security without breaking existing users?

A: I used login-time migration. Existing hashes remain verifiable, but only after a successful login. Once the user proves the password, the server replaces the old hash with a stronger scrypt hash.

### Q: What is the N+1 query problem here?

A: A list endpoint loaded posts first, then made extra queries per post for metrics. That means query count grows linearly with page size. The fix batches metrics for all post ids using grouped queries.

### Q: How do you know the performance fix will not regress?

A: There is a query-performance test that measures expected SQL query counts for feed, profile, and bookmarks flows.

### Q: What does observability mean in this project?

A: Each gRPC request receives a trace id, logs structured start/finish/error events, classifies failures into a known taxonomy, and returns trace metadata. This makes debugging production failures much easier.

### Q: How is admin access protected?

A: Admin operations require a valid API-issued session token and a role such as admin or moderator. Admin features are separated into admin routes, admin server functions, admin gRPC services, and admin service logic.

### Q: What would you improve next?

A: I would add production-grade rate limiting, OpenTelemetry tracing, stronger E2E test data isolation, cursor pagination, database indexes based on query plans, TLS for production gRPC, and deployment-specific secret management.

## 16. Best Project Walkthrough Order

Use this order in an interview:

1. Start with the product: social media app plus admin moderation.
2. Explain the monorepo layout.
3. Explain request flow from React to server function to gRPC to service to database.
4. Explain authentication and why API-issued tokens matter.
5. Explain the database schema.
6. Explain realtime updates.
7. Explain AI writing tools.
8. Explain the five big engineering challenges.
9. Explain tests and CI.
10. End with what you would improve next.

## 17. Short Interview Summary

If you only have one minute:

> Pulse is a full-stack TypeScript social media platform with user and admin apps, a gRPC API, Drizzle database schema, shared UI/types/proto packages, realtime Socket.IO updates, and AI writing tools. The most important work was making the system more production-ready: moving password storage from weak SHA-256 to scrypt with login-time migration, fixing client/API trust so only the API issues session tokens, removing N+1 query patterns with batched post metrics, adding gRPC tracing and structured logs, stabilizing tests, and adding CI/pre-commit validation for the monorepo.

## 18. Files Worth Opening During Preparation

- `README.md`: product, quick start, features, stack.
- `TASK.md`: original assessment requirements.
- `apps/api/src/index.ts`: API startup, health endpoint, gRPC, Socket.IO.
- `apps/api/src/grpc/server.ts`: gRPC service registration and observability wrapper.
- `apps/api/src/observability.ts`: trace ids, structured logging, error taxonomy.
- `apps/api/src/services/auth.service.ts`: registration, login, password migration.
- `apps/api/src/services/post-metrics.ts`: batched query-performance fix.
- `apps/api/src/services/feed.service.ts`: feed selection and ranking.
- `packages/db-schema/src/schema.ts`: database model.
- `packages/grpc-client/src/client.ts`: frontend-to-API gRPC client creation.
- `docs/issue-1-credentials.md`: security write-up.
- `docs/issue-2-query-performance.md`: query-performance write-up.
- `docs/issue-3-errors-observability.md`: observability write-up.
- `docs/issue-4-test-infrastructure.md`: test audit.
- `docs/issue-5-build-dx.md`: CI and developer workflow write-up.