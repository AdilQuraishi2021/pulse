# Task 5: Build Pipeline and Developer Experience

## Findings

- The existing GitHub workflow only ran the recruiting sanity action. It did not install dependencies, typecheck, lint, run unit tests, or build the repo.
- No pre-commit hook was configured.
- Turbo cached E2E and database mutation tasks even though they depend on external state.
- `lint` depended on upstream builds even though Biome does not need built artifacts.
- `typecheck` and `lint` had no explicit empty outputs, making cache behavior less clear.

## Fixes

- Added `.github/workflows/ci.yml` for PR and main validation.
- CI installs with a frozen lockfile, generates protobuf types, lints changed files, then runs affected `typecheck`, `test:unit`, and `build` tasks with `--continue=never`.
- Added a dependency-free `.githooks/pre-commit` hook installed by `pnpm install`.
- The pre-commit hook runs Biome on staged files and Turbo affected typechecks.
- Updated Turbo task metadata for cacheable and non-cacheable tasks.
- Added `docs/developer-setup.md` as the concise setup guide.
