# n9n Migration Inventory

This inventory captures the first pass of legacy identifier hotspots to execute
Phase 3 migration safely.

## Snapshot

- Scan scope: root and workspace `package.json` files
- Pattern: `n8n`, `@n8n`, `n8n-`
- Total matches in scanned package manifests: **313**

## Completed in current batch

- Renamed entry package IDs:
  - `packages/cli`: `n8n` → `n9n`
  - `packages/workflow`: `n8n-workflow` → `n9n-workflow`
  - `packages/frontend/editor-ui`: `n8n-editor-ui` → `n9n-editor-ui`
- Updated direct workspace dependencies in selected packages:
  - `packages/cli`
  - `packages/core`
  - `packages/node-dev`
  - `packages/nodes-base`
  - `packages/testing/playwright`
  - `packages/frontend/editor-ui`
- Updated root turbo filters targeting renamed entry packages.
- Migrated package-manifest references from `n8n-workflow` to `n9n-workflow`.
- Migrated `n8n-core` and `n8n-nodes-base` package names/dependencies to `n9n-*`.
- Added temporary compatibility shim package `n8n-workflow` that re-exports
  `n9n-workflow` during transition.
- Reduced package-manifest legacy match count from **346** to **313** in this
  migration stage.

## High-impact hotspots

1. **Root scripts and filters** (`package.json`)
   - Legacy references in script names and Turbo filters (`build:n8n`, `--filter=n8n`, `n8n-editor-ui`)
2. **CLI dependency surface** (`packages/cli/package.json`)
   - Entry package renamed to `n9n`, but many downstream dependencies still use
     `n8n-*` and `@n8n/*` identifiers
3. **Frontend dependency surface** (`packages/frontend/editor-ui/package.json`)
   - Entry package renamed to `n9n-editor-ui`, but multiple dependencies are
     still sourced from `@n8n/*`
4. **Scoped workspace namespace**
   - Core shared packages continue to use `@n8n/*` names and require a dedicated
     namespace migration batch
5. **Root script compatibility**
   - Root scripts still include legacy `n8n-*` selectors to keep existing
     development workflows running during transition

## Recommended execution order

1. Rename runnable entry packages first:
   - `n8n` (CLI) → `n9n`
   - `n8n-workflow` → `n9n-workflow` (or `n9n-workspace`, if domain rename is
     already approved)
   - `n8n-editor-ui` → `n9n-editor-ui`
2. Update direct dependencies in workspace manifests for those packages.
3. Update root script filters and package selectors.
4. Run install/build/typecheck and resolve breakages before touching `@n8n/*`
   scoped utility packages.
5. Migrate scoped package namespace as a dedicated batch (`@n8n/*` → `@n9n/*`).

## Guardrails for next batches

- Keep compatibility aliases (`n8n` + `n9n`) for CLI command names while
  migrating downstream tools.
- Prefer small PRs by subsystem (CLI, workflow engine, editor UI, infra scripts).
- Validate each batch with:
  - `pnpm build > build.log 2>&1`
  - `pnpm typecheck`
  - targeted package tests
