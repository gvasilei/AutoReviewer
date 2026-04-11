<!-- effect-solutions:start -->

## Effect Solutions Usage

The Effect Solutions CLI provides curated best practices and patterns for Effect TypeScript. Before working on Effect code, check if there's a relevant topic that covers your use case.

- `effect-solutions list` - List all available topics
- `effect-solutions show <slug...>` - Read one or more topics
- `effect-solutions search <term>` - Search topics by keyword

**Local Effect Source:** The Effect repository is cloned to `~/.local/share/effect-solutions/effect` for reference. Use this to explore APIs, find usage examples, and understand implementation details when the documentation isn't enough.

<!-- effect-solutions:end -->

## Learned User Preferences

- When upgrading core dependencies (for example Effect), align supporting toolchain packages such as TypeScript, typings, and test tooling when needed for a clean typecheck and CI.
- Keep the declared Node.js baseline consistent across `.node-version`, `package.json` `engines`, and `action.yml` (and workflow `setup-node` where used) so CI and local development agree; the project baseline targets Node 24.

## Learned Workspace Facts

- This repository ships a JavaScript GitHub Action; `action.yml` uses GitHub’s Node-based runtime for the bundled action entrypoint (CI workflows may still install other tools or runtimes per step).
- OpenAI-backed code review is implemented with Effect and Effect AI (`@effect/ai`, `@effect/ai-openai`).
- The `check-dist` workflow compares rebuilt bundled output to what is checked in; after changes that affect the bundle, run `npm run bundle` and commit the updated `dist/` (for example `dist/index.js`) so CI stays green.
- GitHub Super Linter does not allow mixing include-style linter toggles (`VALIDATE_<TOOL>: true`) with exclude-style toggles (`VALIDATE_<TOOL>: false`) in the same configuration.
- Super Linter jobs that set `VALIDATE_ALL_CODEBASE: true` may need `actions/checkout` with `fetch-depth: 0` so the default branch ref exists in shallow PR checkouts.
- TypeScript ESLint is configured in `eslint.config.mjs` and run via `npm run lint`; the Super Linter workflow does not run a parallel TypeScript ESLint pass, so CI stays aligned with the flat config.
