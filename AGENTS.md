# Repository Guidelines

## Project Structure & Module Organization

Source lives in `src/` with the CLI entry (`cli.ts`), process orchestrator (`index.ts`), and domain folders like `ai/`, `auth/`, `db/`, and `utils/`. Shared helpers reside in `lib/`, runtime types in `types/`, and localization output in `i18n/` (generated from `project.inlang`). Database migrations and schema snapshots sit in `drizzle/`, while `data/` contains seed artifacts and `logs/` collects runtime output; never commit rotated logs. Compiled artifacts land in `dist/` and should not be edited directly.

## Build, Test, and Development Commands

Use `pnpm dev` for the watcher-backed Node process and `pnpm dev:cli` (or `pnpm debug`) when iterating on the interactive terminal agent. Ship-ready bundles come from `pnpm build`, which runs `tsdown` after compiling translations; verify with `pnpm start`. Ensure static analysis stays clean via `pnpm lint` or auto-fix with `pnpm lint:fix`. Database changes flow through `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:studio` (temporary UI). Run the local stack through Docker using `pnpm docker` / `pnpm docker:down`, and inspect streaming output with `pnpm logs`.

## Coding Style & Naming Conventions

This codebase targets Node 22+, TypeScript modules, and the `@antfu/eslint-config` preset. Default to 2-space indentation, single quotes, and trailing commas where valid. Use descriptive file names (`feature-action.ts`), `camelCase` for functions and variables, `PascalCase` for classes/components, and suffix React/Ink components with `.tsx`. Keep configuration isolated under `src/config/` and avoid duplicating environment reads—create helpers instead.

## Testing Guidelines

There is no dedicated test runner yet; authors are expected to provide manual verification steps. For features touching the chat loop, run both `pnpm dev` (server) and `pnpm dev:cli` to ensure SSH interactions and Ink UI remain stable. Validate migrations with a clean PGlite instance via `pnpm db:migrate`, and capture any edge cases in Markdown checklists inside the PR until automated coverage is added.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style (`feat:`, `fix:`, `chore:`, etc.), scoped when helpful (`feat(cli): ...`). Group changes logically—one concern per commit. Pull requests should include: summary, testing notes (commands + observations), linked issues, and screenshots or terminal captures for UX-visible changes. Rebase onto the latest main, ensure `pnpm lint` and `pnpm build` pass, and request at least one maintainer review before merging.

## Security & Configuration Tips

Store secrets in `.env` (never commit) and mirror required keys in `README.md`. When using Docker, prefer the dev compose file so Redis/PostgreSQL ports remain isolated. Log files may contain tokens—scrub them before sharing. Rotate SSH keys regularly and document any new providers under `src/app/` with clear fallback behavior.
