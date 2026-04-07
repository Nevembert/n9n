# n9n Migration Checklist

This document tracks the migration from legacy n8n identifiers to a standalone
n9n project identity.

## Phase 0 — Legal & licensing

- [ ] Define target license model for n9n
- [ ] Decide handling strategy for `.ee` code paths
- [ ] Create `LEGAL.md` with source provenance and dependency policy
- [ ] Update license files after legal sign-off

## Phase 1 — Public branding

- [x] Rebrand top-level README to n9n
- [x] Remove external n8n links from README resources
- [x] Update README quickstart to repository-local flow

## Phase 2 — Runtime compatibility aliases

- [x] Add root build alias `build:n9n`
- [x] Add root runtime aliases (`start:n9n`, `webhook:n9n`, `worker:n9n`)
- [x] Add CLI binary alias `n9n` while keeping `n8n`

## Phase 3 — Internal package identity migration

- [x] Create package-name inventory with legacy identifier hotspots
- [x] Rename entry package IDs (`n8n`, `n8n-workflow`, `n8n-editor-ui`)
- [x] Update direct workspace dependencies for renamed entry packages
- [x] Update root turbo filters referencing renamed entry packages
- [x] Migrate workspace `n8n-workflow` dependency references to `n9n-workflow`
- [x] Migrate `n8n-core` and `n8n-nodes-base` package IDs to `n9n-*`
- [x] Migrate `packages/core` source imports from `n8n-workflow` to `n9n-workflow`
- [x] Add temporary `n8n-workflow` compatibility package mapped to `n9n-workflow`
- [ ] Rename internal package IDs (`n8n-*` → `n9n-*`)
- [ ] Update remaining workspace dependencies to new package IDs
- [ ] Update remaining turbo filters and scripts referencing legacy names
- [ ] Run full install/build/typecheck after package-graph migration

## Phase 4 — Domain language migration (`workflow` → `workspace`)

- [ ] Define compatibility contract for API payloads
- [ ] Migrate FE i18n copy to `workspace`
- [ ] Migrate BE DTOs/types with compatibility mappers
- [ ] Add migration notes for downstream integrations

## Phase 5 — Validation and release

- [ ] `pnpm build > build.log 2>&1` (root)
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] Publish `MIGRATION.md` and release notes
