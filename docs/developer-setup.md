# Developer Setup

1. Install Node.js 22+, pnpm 9+, and Git.
2. Clone the repository and enter the repo root.
3. Run `pnpm install`.
4. Run `pnpm run proto:generate`.
5. Run `pnpm run db:generate`.
6. Run `pnpm run db:migrate`.
7. Run `pnpm run db:seed`.
8. Start everything with `pnpm run dev`.

Useful commands:

- `pnpm run dev:user` starts the user app.
- `pnpm run dev:admin` starts the admin app.
- `pnpm run dev:api` starts the API.
- `pnpm run typecheck` checks TypeScript.
- `pnpm run lint` runs Biome checks.
- `pnpm run test:unit` runs unit tests.
- `pnpm run build` builds the monorepo.

Git hooks install during `pnpm install` through the `prepare` script. The pre-commit hook runs Biome on staged files and affected typechecks.
