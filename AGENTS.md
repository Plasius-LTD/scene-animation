# AGENTS.md

## 1. Scope and Purpose
- This file is the repo-local operating policy for `@plasius/scene-layout`.
- Treat it as the active rule set for this repository.
- The package provides public, reusable scene layout contracts for Plasius runtimes.

## 2. Instruction Priority and Conflict Handling
- Apply the most specific applicable rule.
- Follow root Codex governance first, then this repo-local file for package specifics.
- Referenced companion markdown files in this repo are part of the active instruction set.
- If rules conflict and the written guidance cannot be reconciled safely, stop and ask.

## 3. Repository Map and Common Paths
- `src/`: public package source
- `tests/`: Vitest coverage for exported behavior
- `docs/adrs/`: architecture decision records
- `legal/`: CLA and legal templates
- `dist/`: generated build output, never edit by hand

## 4. Tooling and Common Commands
- Use npm and Node from [`.nvmrc`](/Users/philliphounslow/plasius/scene-layout/.nvmrc).
- Install dependencies with `npm ci`.
- Common commands:
  - `npm run build`
  - `npm run test`
  - `npm run test:coverage`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run pack:check`

## 5. Non-Negotiable Safety and Integrity Rules
- Secrets and PII must never be committed.
- Do not fake test, CI, coverage, release, or publish state.
- Publish only through `.github/workflows/cd.yml`.
- Keep runtime contracts storage-agnostic and free from credential-bearing configuration.

## 6. Core Engineering Rules
- Keep the package framework-agnostic and renderer-agnostic.
- Prefer explicit contract types plus deterministic validation helpers.
- Do not couple layout contracts to blob transport, renderer SDKs, or site-only globals.
- Preserve stable public APIs unless the tracked work intentionally changes them.
- Use feature-flag documentation, not package-local env flags, for rollout ownership.

## 7. Work Definition and GitHub Governance
- Source of truth for the parent feature/story is `Plasius-LTD/plasius-ltd-site`.
- Source of truth for repo-local implementation is this repository's tracked `[TASK]` issues.
- Every implementation task must reference the parent feature and parent rollout flag.

## 8. Documentation Requirements
- Update `README.md` for public API or usage changes.
- Update `CHANGELOG.md` under `Unreleased` for user-facing changes unless explicitly exempted.
- Record meaningful architectural choices in `docs/adrs/`.

## 9. Testing and Quality Gates
- Add or update tests for every behavior change.
- Maintain line coverage at 80% or higher.
- Ensure every changed source file appears in LCOV output.
- Run relevant validation before considering work complete.

## 10. Delivery Workflow
- Use the heavy-weight workflow in [WORKFLOW.md](/Users/philliphounslow/plasius/scene-layout/WORKFLOW.md).
- Trivial-edit exceptions do not apply to tracked implementation work.

## 11. Dependency Hygiene Policy
- Keep dependencies minimal and trusted.
- Avoid adding runtime dependencies unless they materially reduce risk or duplication.
- Refresh targeted dev dependencies when the tracked feature requires it.

## 12. Capability and Feature-Flag Governance
- Parent rollout flag: `scene.layout.foundation.enabled`.
- Source-of-truth evaluator: site-owned rollout control in `plasius-ltd-site`.
- This package must document flag ownership and rollback posture but must not become the control plane.

## 13. Release and Deployment Governance
- A change is not complete until validation passes and CI succeeds after push.
- Production publication must happen through `.github/workflows/cd.yml` on `main`.

## 14. Package Creation and Public API Rules
- Keep exports flat and intentional from `src/index.ts`.
- Ship ESM and CJS outputs with types.
- Preserve public package integrity through `prepublishOnly` and `pack:check`.

## 15. Companion Guidance Files
- `WORKFLOW.md`
- `FLAGS_AND_CAPABILITIES.md`
- `NFR.md`
- `SECURITY.md`

## 16. Local Repository Guidance
- The package models zones, anchors, coordinate spaces, responsive variants, and deterministic variant resolution.
- Rollout ownership stays with the parent feature flag `scene.layout.foundation.enabled`.
- Downstream packages should be able to bind by stable zone and anchor ids without renderer coupling.
