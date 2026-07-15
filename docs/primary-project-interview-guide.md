# Pulse Primary Project Interview Guide

## 1. Project Snapshot

Pulse is a full-stack social media platform built as a TypeScript monorepo. It has a user-facing app, an admin moderation app, a gRPC API server, shared protocol definitions, shared database schema, shared UI components, realtime updates, AI writing tools, automated tests, CI, and developer workflow checks.

One strong interview pitch:

> Pulse is a Twitter-like social platform built with TanStack Start, React 19, TypeScript, gRPC, Protocol Buffers, Drizzle ORM, MySQL-style schema definitions, StyleX, Socket.IO, Vitest, Playwright, pnpm workspaces, and Turborepo. My main contribution was making the system more production-ready by fixing credential storage, API trust boundaries, N+1 query performance, error handling, tracing, test isolation, CI, and developer experience.

## 2. What The Project Does

Pulse supports two main products:

- User app: registration, login, posts, comments, likes, follows, feeds, profiles, bookmarks, search, notifications, mentions, reports, messages, realtime activity, and AI writing help.
- Admin app: dashboard, user management, post/comment moderation, report review, audit logs, and role-protected admin actions.

The project behaves like a small social network. Users create content and interact with other users. Admins monitor platform activity and moderate unsafe or reported content.

## 3. Monorepo Structure

- `apps/client-user`: TanStack Start user application.
- `apps/client-admin`: TanStack Start admin dashboard.
- `apps/api`: Node.js API server with gRPC handlers, business services, database access, auth, observability, and Socket.IO.
- `packages/proto`: protobuf service definitions and generated TypeScript types.
- `packages/grpc-client`: shared frontend-to-API gRPC client factory.
- `packages/db-schema`: Drizzle database schema and inferred database types.
- `packages/ui`: shared React UI components and StyleX design tokens.
- `packages/shared-types`: shared TypeScript contracts such as session payload types.
- `db/migrations`: database migration SQL and metadata.
- `docs`: issue write-ups, developer setup, and interview preparation.
- `tooling/typescript`: shared TypeScript configs.

## 4. Technology Stack

Frontend:

- React 19 for component UI.
- TanStack Start and TanStack Router for routing and server functions.
- StyleX for co-located typed styling.
- Socket.IO client for realtime updates.
- Vite/Vinxi tooling for development and builds.

Backend:

- Node.js with TypeScript.
- Elysia for lightweight HTTP endpoints such as `/health`.
- gRPC with `@grpc/grpc-js` and `@protobuf-ts/grpc-backend`.
- Protocol Buffers as the service contract.
- Drizzle ORM with MySQL-style schema definitions.
- JSON Web Tokens for API-issued session tokens.
- Socket.IO for realtime notifications, activity, presence, typing, and chat events.
- Gemini integration for AI writing tools.

Tooling:

- pnpm workspaces for dependency management.
- Turborepo for task orchestration and caching.
- Biome for linting and formatting.
- Vitest for unit tests.
- Playwright for end-to-end tests.
- GitHub Actions for CI.
- Git hooks for pre-commit validation.

## 5. How The System Starts

Typical local setup:

```bash
pnpm install
pnpm run proto:generate
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Service URLs:

- User app: `http://localhost:3000`
- Admin app: `http://localhost:3002`
- API health endpoint: `http://localhost:3001/health`
- gRPC API: `localhost:50051`
- Socket.IO realtime server: `http://localhost:3003`

Startup flow:

1. `pnpm install` installs workspace dependencies and prepares Git hooks.
2. `proto:generate` generates TypeScript from protobuf contracts.
3. Database migration and seed commands prepare local data.
4. The API starts the gRPC server first.
5. Elysia starts HTTP health and root endpoints only after gRPC is bound.
6. Socket.IO starts as a separate realtime server.
7. User and admin TanStack apps start through Turborepo.

## 6. Request Flow

Example: liking a post.

1. User clicks the like button in a React component.
2. The component calls a TanStack Start server function.
3. The server function reads the API-issued session token from session data.
4. The server function creates a gRPC client using `packages/grpc-client`.
5. The gRPC client sends a protobuf request to the API.
6. The gRPC handler validates authentication and request data.
7. The handler delegates business logic to a service in `apps/api/src/services`.
8. The service uses Drizzle to query or mutate the database.
9. The service may emit a Socket.IO event.
10. The handler returns a protobuf response.
11. The frontend updates the UI.

Key explanation:

> The frontend does not call the database directly. It goes through server functions, shared gRPC clients, protobuf-defined services, API handlers, service-layer logic, and Drizzle database access.

## 7. Authentication And Authorization

Registration:

1. User submits email, username, display name, and password.
2. API checks duplicate email and username.
3. API hashes the password with scrypt and a random salt.
4. API creates the user with role `user`.
5. API issues a signed session token.
6. Client stores and forwards that API-issued token.

Login:

1. User submits email and password.
2. API loads the user by email.
3. API rejects banned users.
4. API verifies the password.
5. If the password hash is legacy SHA-256, API upgrades it to scrypt after successful login.
6. API returns a fresh session token.

Authorization:

- `requireAuth` validates the session token.
- `requireAdmin` allows `admin` and `moderator`.
- `requireSuperAdmin` allows only `admin`.
- Admin routes and admin gRPC methods require role checks.

Important interview point:

> The API is the authority for session tokens. Clients can hold tokens, but they do not mint trusted gRPC tokens themselves.

## 8. Database Design

Core tables:

- `users`: account, profile, role, ban status, online status.
- `posts`: text content and author relationship.
- `comments`: post comments with one-level reply support through `parentId`.
- `likes`: post/comment reactions with uniqueness constraints.
- `follows`: follower and following relationships.
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

Design points:

- Foreign keys use cascade delete for related social data.
- Unique constraints prevent duplicate likes, follows, bookmarks, friend requests, and badge awards.
- Roles are modeled as `user`, `admin`, or `moderator`.
- Report state is modeled as `pending`, `reviewed`, `actioned`, or `dismissed`.

## 9. Main Feature Areas

Posts:

- Users can create, edit, and delete posts.
- Post content is limited to social-network style short text.
- Post cards show author, content, time, metrics, and actions.
- Metrics are enriched through batched backend utilities.

Comments:

- Users can add and delete comments.
- Replies support one level of nesting.
- Comment events can trigger realtime updates to post rooms.

Likes and reactions:

- Likes can target posts or comments.
- Reaction type supports values such as `like`, `love`, `celebrate`, `support`, and `funny`.
- Unique constraints prevent duplicate likes for the same user and target.

Follows:

- Users can follow and unfollow other users.
- Follow relationships influence friends feeds and profile counts.

Bookmarks:

- Authenticated users can save posts.
- Bookmark pages load saved posts and metrics efficiently.

Notifications:

- Notifications are persisted in the database.
- Realtime notification events are emitted to user-specific rooms.
- Notifications cover interactions such as likes, comments, follows, and mentions.

Reports and moderation:

- Users can report posts, comments, or users.
- Admins can review and act on reports.
- Audit logs keep a record of administrative work.

AI writing tools:

- The API integrates with Gemini when `GEMINI_API_KEY` is configured.
- Features include rewrite, grammar correction, summarization, tone changes, expansion, shortening, hashtags, captions, and engagement improvements.
- AI validation and rate limiting logic protect the feature from invalid or excessive use.

Realtime:

- Socket.IO handles presence, post events, comments, likes, follows, notifications, typing, messages, and admin analytics.
- Users join user-specific rooms.
- Post viewers can join post-specific rooms.
- Presence uses connection counts so a user is only offline after their final socket disconnects.

## 10. Major Engineering Problems Solved

### Credential Storage

Original problem:

- Passwords used `sha256(password + "salt")`.
- SHA-256 is fast and the salt was shared.
- A database leak would allow cheap offline cracking.

Fix:

- New hashes use scrypt.
- Every password gets a random salt.
- Hash parameters are encoded in the stored value.
- Legacy hashes are accepted only during successful login.
- After login, legacy hashes are immediately upgraded.

Interview answer:

> I solved it as a backward-compatible migration. Since we do not know users' plaintext passwords, we verify the old hash once at login, then replace it with the stronger scrypt format after the user proves the password.

### Client/API Trust Boundary

Original problem:

- Clients could recreate trusted gRPC JWTs from session data.
- A published/default secret made token forgery possible.

Fix:

- Clients now store and forward only API-issued tokens.
- The API owns token signing.
- Production requires `GRPC_JWT_SECRET`.
- Development without a secret uses a process-local random secret.

Interview answer:

> A client can present a token, but it should not be able to create one. Moving token authority back to the API fixed that trust boundary.

### N+1 Query Performance

Original problem:

- List endpoints loaded posts, then ran per-post queries for like count, comment count, and viewer liked state.
- Query count grew linearly with page size.

Before query counts for 10 posts:

- Home feed: 32 queries.
- Profile page: 37 queries.
- Bookmarks page: 41 queries.

Fix:

- Added `getPostMetrics`.
- Batch metrics by post IDs.
- Use grouped count queries.
- Load bookmarked post details with the paginated bookmark query.
- Improve profile header loading with scalar subqueries.

After query counts for 10 posts:

- Home feed: 5 queries.
- Profile page: 6 queries.
- Bookmarks page: 4 queries.

Interview answer:

> The API response stayed the same, but the query shape changed from per-row enrichment to batch enrichment. That makes the number of queries stable as page size grows.

### Error Handling And Observability

Original problem:

- Handlers used mixed error styles.
- Some returned `{ success: false, error }`.
- Some threw directly.
- Some swallowed errors and returned empty data.
- There was no request-level trace ID.

Fix:

- Added `AppError` and a unified error taxonomy.
- Mapped errors to gRPC codes.
- Wrapped every gRPC service with `withObservability`.
- Added `x-trace-id` support.
- Added `AsyncLocalStorage` trace context.
- Added structured JSON logs for request start, finish, handled error responses, and exceptions.
- Returned trace ID in gRPC trailers without changing response bodies.

Taxonomy:

- `INVALID_ARGUMENT`
- `UNAUTHENTICATED`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `ALREADY_EXISTS`
- `FAILED_PRECONDITION`
- `INTERNAL`

Interview answer:

> I separated external response compatibility from internal consistency. Existing protobuf response contracts could remain stable while the server gained one place to classify, trace, log, and convert errors.

### Test Infrastructure

Findings:

- API tests covered many core services but still had gaps.
- Client E2E tests used seeded users and shared mutable state.
- Full parallel Playwright execution could make tests order-dependent.

Fix:

- API tests use isolated setup and clean data patterns.
- Query-count tests lock performance behavior.
- Playwright full parallelism was disabled until stronger per-test data isolation exists.
- Type issues in E2E/admin fixtures were fixed.

Interview answer:

> I made the suite deterministic first. Long term, I would improve E2E isolation with per-test users, per-test data setup, or database resets.

### CI And Developer Experience

Original problem:

- No complete PR validation pipeline.
- No pre-commit hook.
- Turbo task metadata had caching gaps.

Fix:

- Added GitHub Actions CI.
- CI installs with a frozen lockfile, generates proto types, lints, typechecks, runs unit tests, and builds.
- CI uses Turborepo affected execution where appropriate.
- Added a dependency-free pre-commit hook.
- Updated Turbo cache behavior for build, lint, typecheck, test, E2E, database, and dev tasks.
- Added a concise setup guide.

Interview answer:

> The build pipeline is monorepo-aware. It validates changed packages and their dependents instead of treating every PR as a full rebuild by default.

## 11. How To Walk Through The Project In An Interview

Use this order:

1. Start with the product: user social network plus admin moderation.
2. Explain the monorepo layout.
3. Explain the request flow from React to server function to gRPC to service to database.
4. Explain authentication and why API-issued tokens matter.
5. Explain the database schema and relationships.
6. Explain realtime Socket.IO events.
7. Explain AI writing tools.
8. Explain the production-readiness refactors.
9. Explain testing and CI.
10. End with future improvements.

Two-minute script:

> Pulse is a full-stack TypeScript social media platform. It has a TanStack Start user app, a TanStack Start admin app, and a Node.js gRPC API. The API contract is defined with Protocol Buffers, the database layer uses Drizzle schema definitions, and shared packages keep proto types, database types, UI components, and session types consistent across the monorepo. A normal UI action goes from React to a server function, then through a shared gRPC client, then to an API handler, a service, and finally the database. Realtime updates are handled by Socket.IO.
>
> The most important work was improving production readiness. I replaced weak SHA-256 password hashing with scrypt and login-time migration, fixed the client/API trust issue so only the API issues session tokens, removed N+1 query patterns with batched post metrics, added request tracing and structured gRPC logging, stabilized test execution, and added CI plus pre-commit validation.

## 12. Common Interview Questions And Answers

### Q1: What is Pulse?

A: Pulse is a Twitter-like social media platform with user and admin applications. Users can create posts, comment, like, follow, bookmark, search, receive notifications, report content, and use AI writing tools. Admins can manage users, moderate posts/comments, review reports, and view audit logs.

### Q2: Why did you build it as a monorepo?

A: The project has multiple apps and shared contracts. A monorepo keeps the user app, admin app, API, proto definitions, database schema, UI components, and shared types in one versioned workspace. That reduces contract drift and makes cross-package changes easier to validate.

### Q3: What are the main packages?

A: `apps/client-user` is the user app, `apps/client-admin` is the admin app, and `apps/api` is the backend. Shared packages include `packages/proto`, `packages/grpc-client`, `packages/db-schema`, `packages/ui`, and `packages/shared-types`.

### Q4: Explain the architecture.

A: The clients are TanStack Start apps. UI actions call server functions. Server functions call the API through a shared gRPC client. The API exposes protobuf-defined services. Handlers validate auth/input and delegate to service-layer functions. Services use Drizzle to query or mutate the database and may emit Socket.IO events.

### Q5: Why gRPC instead of REST?

A: gRPC gives strongly typed protobuf contracts, which is valuable when multiple clients call many backend services. It makes service boundaries explicit and reduces request/response drift. REST would work too, but protobuf is a good fit for this monorepo.

### Q6: Why use server functions between React and gRPC?

A: Server functions keep Node-only gRPC logic and session handling away from browser components. They act as a backend-for-frontend layer that reads session data, forwards API-issued tokens, calls gRPC, and returns UI-friendly results.

### Q7: How does authentication work?

A: Registration and login happen through the API. The API validates credentials, signs a JWT session token, and returns it to the client. The client stores and forwards that token, but does not create trusted API tokens itself.

### Q8: What was the password security issue?

A: Passwords were stored as fast SHA-256 hashes with a shared salt. If the database leaked, attackers could crack passwords cheaply using offline attacks.

### Q9: How did you fix password storage?

A: I introduced scrypt with random per-password salts and encoded parameters. New users get scrypt hashes. Legacy SHA-256 users can still log in, and after successful login their password hash is upgraded.

### Q10: Why login-time migration?

A: We cannot migrate all old hashes upfront because we do not know plaintext passwords. Login-time migration upgrades only after the user proves the password, which keeps existing users working.

### Q11: What was the API trust-boundary bug?

A: Clients could mint gRPC JWTs from session data, and the old setup had a shared/default secret. That gave the frontend too much authority and made forged tokens possible.

### Q12: How did you fix the trust-boundary bug?

A: I made the API the only token issuer. The clients now only store and forward the API-issued token. Production requires a configured secret, and development uses a process-local random secret when none is set.

### Q13: How is admin access protected?

A: Admin operations require a valid session token and a role check. Moderation operations use `requireAdmin` for admin/moderator users, while stricter actions can use `requireSuperAdmin`.

### Q14: What is the N+1 query problem?

A: It happens when the system loads a list and then performs additional queries for each row. In this project, post lists loaded posts first, then queried metrics per post.

### Q15: How did you fix N+1 queries?

A: I added `getPostMetrics`, which accepts all post IDs and loads like counts, comment counts, and viewer-liked state in batched queries. Services then merge those metrics into the response.

### Q16: What query counts improved?

A: For 10 posts, home feed went from 32 to 5 queries, profile page from 37 to 6, and bookmarks from 41 to 4.

### Q17: How do you prevent performance regression?

A: The project has `apps/api/src/services/query-performance.test.ts`, which locks expected query counts for key list flows.

### Q18: How does the feed work?

A: The feed service selects candidate posts, joins author data, batches metrics, ranks based on feed type, and applies pagination. Feed types include latest, trending, friends, recommended, topic, industry, community, and nearby.

### Q19: How does recommended feed ranking work?

A: It derives interest terms from recent liked posts and scores candidates using shared ranking helpers. For the current project scale, ranking is done in application memory after selecting candidates.

### Q20: What would you change for a larger feed system?

A: I would add cursor pagination, index based on query plans, precomputed counters, caching, read replicas, and possibly a dedicated feed ranking/search service.

### Q21: How does realtime work?

A: The API starts a Socket.IO server. Users join user-specific rooms, post viewers can join post rooms, and services emit events for notifications, posts, comments, likes, follows, shares, messages, typing, presence, and admin analytics.

### Q22: How is presence handled?

A: Presence is tracked with a connection count per user. A user is marked online when the first connection opens and offline only when the final connection closes.

### Q23: How do notifications work?

A: Notifications are stored in the database and can also be emitted through Socket.IO to user-specific rooms. This gives persistence plus realtime UX.

### Q24: What does the admin app do?

A: It supports dashboard views, user management, post and comment moderation, report handling, and audit logs. It calls admin server functions that call admin gRPC methods.

### Q25: How do audit logs help?

A: They record admin actions, target types, target IDs, details, and timestamps. This improves accountability and debugging for moderation workflows.

### Q26: What is the error-handling strategy?

A: Errors are classified into a small taxonomy and mapped to gRPC status codes. Existing response contracts are preserved, but all gRPC calls pass through a common observability wrapper.

### Q27: What is request tracing here?

A: Every gRPC call gets an `x-trace-id`, either from incoming metadata or a generated UUID. The trace ID is stored with `AsyncLocalStorage`, appears in structured logs, and is returned in gRPC trailers.

### Q28: Why use `AsyncLocalStorage`?

A: It carries request context through asynchronous service-layer calls without manually passing trace IDs through every function signature.

### Q29: What do structured logs contain?

A: Logs contain level, event, trace ID, service, method, timestamp, duration, error code, and error message where relevant.

### Q30: How do you keep API response compatibility?

A: Some handlers still return existing response shapes like `{ success: false, error }` because clients depend on them. The observability wrapper logs and classifies these responses without breaking protobuf contracts.

### Q31: What testing layers exist?

A: API service tests, gRPC handler tests, observability tests, query-performance tests, shared UI component tests, client unit tests, and Playwright E2E tests for user/admin workflows.

### Q32: What was the E2E isolation problem?

A: E2E tests used fixed seeded users and a shared database. Tests that mutate durable state can become order-dependent under full parallel execution.

### Q33: How did you stabilize the E2E tests?

A: Full Playwright parallelism was disabled and workers were limited until the suite has stronger per-test data isolation.

### Q34: What would you improve in tests next?

A: I would create per-test users, isolate test data by namespace, reset database state between E2E tests, and expand coverage for feed, bookmarks, users, search, notifications, and admin error paths.

### Q35: How does CI work?

A: GitHub Actions installs dependencies with a frozen lockfile, generates proto types, lints, typechecks, runs unit tests, and builds. It uses Turborepo to run tasks across affected packages and dependencies.

### Q36: What does the pre-commit hook do?

A: It runs Biome on staged files and affected TypeScript checks, so simple issues are caught before commit.

### Q37: How does Turborepo help?

A: Turbo orchestrates tasks across packages, caches outputs, respects package dependency graphs, and avoids unnecessary rebuilds where affected execution is used.

### Q38: How are protobuf types generated?

A: Proto files live in `packages/proto/protos`. `pnpm run proto:generate` runs the proto package generation task and emits generated TypeScript used by the API and clients.

### Q39: How would you add a new feature?

A: I would update the database schema if needed, add or change proto definitions, regenerate types, implement API service logic, add a gRPC handler, update the gRPC client, add server functions, build UI components/routes, and add unit/E2E tests.

### Q40: What is Drizzle ORM used for?

A: Drizzle provides typed schema definitions and query building. It keeps database access type-safe while still making SQL query shape visible.

### Q41: What database does the project target?

A: The schema uses Drizzle's MySQL core definitions and the README documents MySQL-style `DATABASE_URL` configuration. Some docs also mention local SQLite from the original scaffold, so in an interview I would say the current schema is MySQL-style and avoid overstating production database details.

### Q42: What are the most important security improvements?

A: Stronger password hashing, login-time migration, API-owned session tokens, production-required JWT secrets, role checks for admin routes, banned-user login rejection, and reduced trust in client-generated data.

### Q43: What security improvements would you add next?

A: Login rate limiting, refresh-token rotation, secure cookie hardening by environment, TLS for production gRPC, managed secrets, audit logs for auth events, CSRF review for server functions, and stricter Socket.IO authentication.

### Q44: What production observability would you add next?

A: OpenTelemetry traces, metrics, log aggregation, dashboards, alerting, database query timing, endpoint-level latency percentiles, and error-rate alerts.

### Q45: What are project limitations?

A: The E2E suite still needs stronger data isolation, some services need more negative-path tests, feed ranking is application-level and would need deeper infrastructure at large scale, and production deployment hardening is still future work.

### Q46: What are you most proud of?

A: The security and performance refactors. They show that I can go beyond feature work and identify deeper production risks: weak credentials, bad trust boundaries, N+1 queries, inconsistent errors, and missing observability.

### Q47: What was the hardest part?

A: Keeping compatibility while improving internals. Password migration had to preserve existing users, error handling had to preserve existing response shapes, and query optimization had to return identical API responses.

### Q48: How would you explain this project to a non-technical person?

A: Pulse is a social network where users post, comment, like, follow, save content, and receive live notifications. It also has an admin dashboard for moderation. I worked on making it safer, faster, easier to debug, and easier for developers to maintain.

### Q49: How would you explain this project to a senior engineer?

A: It is a TypeScript monorepo with two TanStack Start clients and a protobuf/gRPC backend. The interesting work is in production-hardening the service layer: password hash migration, JWT trust-boundary correction, batched metric enrichment to remove N+1 query patterns, gRPC observability middleware with async trace context, deterministic tests, and CI/Turbo task tuning.

### Q50: What is your closing summary?

A: Pulse demonstrates full-stack product development and backend refactoring. It includes user-facing features, admin workflows, realtime behavior, AI integration, typed service contracts, database modeling, security fixes, performance improvements, observability, tests, and CI.

## 13. Files To Open During Interview Prep

- `README.md`: product overview, setup, features, stack.
- `TASK.md`: original assessment requirements.
- `apps/api/src/index.ts`: API startup, health endpoint, gRPC, Socket.IO.
- `apps/api/src/grpc/server.ts`: service registration and observability wrapper.
- `apps/api/src/observability.ts`: tracing, error taxonomy, structured logs.
- `apps/api/src/middleware/auth.ts`: session token creation and validation.
- `apps/api/src/services/auth.service.ts`: registration, login, password migration.
- `apps/api/src/services/utils.ts`: scrypt hashing and legacy hash verification.
- `apps/api/src/services/post-metrics.ts`: batched metrics utility.
- `apps/api/src/services/feed.service.ts`: feed selection and ranking flow.
- `apps/api/src/realtime/socket.ts`: Socket.IO rooms and event emission.
- `packages/db-schema/src/schema.ts`: database model.
- `packages/grpc-client/src/client.ts`: shared gRPC client.
- `docs/issue-1-credentials.md`: credential/security write-up.
- `docs/issue-2-query-performance.md`: query-performance write-up.
- `docs/issue-3-errors-observability.md`: observability write-up.
- `docs/issue-4-test-infrastructure.md`: test audit.
- `docs/issue-5-build-dx.md`: CI and developer workflow write-up.

## 14. Short Cheat Sheet

Best one-minute version:

> Pulse is a full-stack TypeScript social platform with user and admin apps, a gRPC API, protobuf contracts, Drizzle schema, shared UI/types packages, realtime Socket.IO events, and AI writing tools. The strongest engineering work was production hardening: scrypt password hashing with login-time migration, API-owned JWT sessions, batched metrics to remove N+1 queries, gRPC tracing and structured logs, deterministic testing, and CI/pre-commit validation.

Best technical deep-dive angle:

> The most interesting part is that the project is not just feature-complete; it addresses real production risks. I can walk through how one user action moves through the system, then show how security, query performance, observability, tests, and CI were improved without breaking existing API contracts.

