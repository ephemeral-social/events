# Contributing to Ephemeral Events Web

Thank you for considering contributing to Ephemeral Events. This document covers the development workflow, coding standards, and pull request process.

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Start the shared backend: `cd ../ephemeral_backend && npx wrangler dev`
5. Start the frontend: `pnpm dev`
6. Open [http://127.0.0.1:5173](http://127.0.0.1:5173) -- use `127.0.0.1`, not `localhost`

## Development Workflow

### Branch Naming

```
feat/short-description
fix/short-description
chore/short-description
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(events): add recurring event series generation
fix(tickets): correct fee calculation for >$25 tickets
chore(db): add migration for short_code column
```

Imperative mood. Scope in parens. No trailing period.

### Before Submitting a PR

Run all checks locally:

```bash
pnpm check          # Type checking (svelte-check)
pnpm lint           # ESLint + Prettier
pnpm test           # Vitest test suite
```

All three must pass. PRs with failing checks will not be reviewed.

## Coding Standards

### Language and Framework

- **TypeScript** throughout -- no `any` types unless interfacing with third-party libraries
- **Svelte 5 runes** syntax (`$state`, `$derived`, `$effect`, `$props`) -- do not use Svelte 4 stores
- **SvelteKit 2** conventions for routing and data loading

### Architecture

This is a SvelteKit frontend that calls the shared `ephemeral_backend/` API. It does not have its own database or auth system.

- **Server-side routes** (`+page.server.ts`, `+server.ts`) are thin proxies to the backend API
- **Never implement business logic** in the SvelteKit layer -- add new endpoints to `ephemeral_backend/`
- **Never access D1/R2 directly** from SvelteKit -- all data goes through the backend API
- **JWT tokens stay server-side** -- stored in HttpOnly cookies, never exposed to client JS

### Environment Variables

Follow the existing pattern for environment variable access:

```ts
// Server-side: platform.env with fallback
const value = platform?.env?.MY_VAR || env.MY_VAR || 'default';
```

Never hardcode account-specific values (API keys, namespace IDs, user IDs). Use environment variables with safe defaults for local development.

### Design

- **Dark mode only** -- no light mode, no theme toggle
- **Fonts:** Vollkorn (headlines), Manrope (body/UI) -- never Inter, system-ui, or Arial
- **Icons:** Phosphor (`phosphor-svelte`) only -- never Lucide or Heroicons
- **Colors:** Warm surfaces (never pure `#000` or `#fff`), forest green accent (`#52b788`)
- See the README for the full design system reference

### Testing

- Write tests for new server-side logic (load functions, API routes, utilities)
- Test files go in `src/test/` organized by type (`unit/`, `integration/`, `api/`, `pages/`)
- Use the existing mock helpers in `src/test/mocks/` and `src/test/helpers.ts`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure all checks pass (`pnpm check && pnpm lint && pnpm test`)
4. Open a PR with a clear description of what changed and why
5. Link any related issues

### PR Description Template

```markdown
## What

Brief description of the change.

## Why

Context and motivation.

## Testing

How you verified the change works.
```

## Project Structure

See the [README](./README.md) for a full project structure overview and architecture diagram.

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](./LICENSE).
