# Issue 4: Test Infrastructure and Coverage

## Audit

API unit tests cover auth, posts, comments, follows, likes, query performance, and observability. Gaps remain for feed, bookmarks, users, search, notifications, and most admin service error paths.

Handler unit tests cover auth, posts, comments, likes, and admin. Gaps remain for feed, follows, search, users, notifications, and bookmarks handlers.

Client E2E tests cover broad user and admin workflows, but they run against fixed seeded accounts and a shared database. Several tests mutate durable state such as notifications, follows, moderation actions, and posts. Running those tests fully parallel makes outcomes order-dependent.

Test helper strengths:

- Shared login/navigation helpers reduce repeated selector logic.
- `uniqueId()` encourages unique post/comment content for created records.
- API tests use an in-memory database and clean tables before each test.

Test helper risks:

- E2E helpers rely on fixed seeded users instead of per-test users.
- E2E global setup warms Vite but does not reset application data.
- Several E2E tests tolerate state created by other tests, which can hide isolation failures.

## Fixes

- Fixed TypeScript failures in the notification E2E spec by removing unused state.
- Widened the admin users fixture type so status rendering tests both active and banned branches correctly.
- Disabled Playwright full parallelism and forced one worker in both client apps until the E2E suite has per-test data isolation.
