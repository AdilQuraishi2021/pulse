# Issue 3: Error Handling and Observability

## Handler Audit

The API used several error strategies:

- Auth, posts, comments, likes, follows, bookmarks, notifications, and admin mutation handlers often caught errors and returned `{ success: false, error }`.
- Read handlers such as admin list/detail/report/dashboard/audit and auth `getCurrentUser` let errors throw to gRPC.
- Public read handlers for posts/feed/search/users/bookmarks ignored invalid optional session tokens and continued unauthenticated.
- Some notification and count handlers swallowed errors and returned empty or zero responses.

These strategies remain response-compatible, but all calls now pass through one observability layer.

## Taxonomy

Thrown errors are normalized before crossing the gRPC boundary:

- `INVALID_ARGUMENT`: malformed input, missing required content, invalid roles.
- `UNAUTHENTICATED`: missing or invalid session tokens.
- `PERMISSION_DENIED`: admin authorization failures, unauthorized ownership checks, banned accounts.
- `NOT_FOUND`: missing users, posts, comments, reports, notifications.
- `ALREADY_EXISTS`: duplicate email or username.
- `FAILED_PRECONDITION`: state-dependent failures such as expired edit windows.
- `INTERNAL`: unexpected errors with a generic public message.

## Tracing and Logs

`withObservability` wraps every gRPC service in `apps/api/src/grpc/server.ts`.

- Each request gets an `x-trace-id` from incoming metadata or a generated UUID.
- The trace ID is available through async-local storage for service-layer logging.
- The trace ID is returned in gRPC trailers without changing protobuf response bodies.
- Every request emits structured JSON logs for start, success, handled error responses, or thrown exceptions.
- Thrown exceptions are converted to `RpcError` with matching gRPC status code and trace metadata.

`apps/api/src/observability.test.ts` verifies taxonomy mapping, trace propagation, and gRPC error metadata.
