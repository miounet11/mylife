# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 15 app using the App Router and TypeScript. Route files live in `app/`, including page entries such as `app/page.tsx` and API handlers under `app/api/*`. Reusable UI lives in `components/`, with report-specific widgets in `components/report/` and basic primitives in `components/ui/`. Core business logic, repositories, validators, and services live in `lib/`. Tests are primarily under `tests/lib/*.test.ts`. Persistent local data is stored in `data/`, and shared type declarations live in `types/`.

## Build, Test, and Development Commands
Use `npm install` to sync dependencies from `package-lock.json`.

- `npm run dev`: start the local Next.js dev server.
- `npm run build`: create a production build with an increased Node memory limit.
- `npm run start`: serve the production build locally.
- `npm run test`: run Jest once.
- `npm run test:watch`: run Jest in watch mode during local development.
- `npm run lint`: run Next.js linting.

## Coding Style & Naming Conventions
Prefer TypeScript for new code. Follow the existing style: 2-space indentation, semicolons, single quotes, and strict typing. Keep path imports rooted at `@/` when crossing directories. Use `kebab-case` for component filenames like `fortune-progress.tsx`, `PascalCase` for React component names, and `camelCase` for functions and variables. Keep route-specific logic close to the route; move reusable logic into `lib/services` or `lib/repositories`.

## Testing Guidelines
Jest is configured through `jest.config.js` with `ts-jest` and a Node test environment. Add tests as `*.test.ts` under `tests/` to match the current suite, for example `tests/lib/validators.test.ts`. Favor focused unit tests for `lib/` modules and validators before adding broader integration scripts. Run `npm run test` before opening a PR.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style, for example `feat(ui): ...`, `refactor(api): ...`, and `fix: ...`. Keep commit messages scoped and imperative. PRs should include a short summary, affected areas, test results, and screenshots for UI changes. Call out schema, environment, or data-file changes explicitly.

## Security & Configuration Tips
Keep secrets in `.env.local`; do not commit credentials. Treat `data/lifekline.db*` as local state unless a change explicitly requires updating seed data or migration behavior.
