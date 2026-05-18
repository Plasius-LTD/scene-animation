# Contributing to @plasius/scene-layout

First off: thanks for taking the time to contribute!
This document explains how to work on the project, how to propose changes, and what we expect in pull requests.

> TL;DR
>
> - Be respectful and follow the Code of Conduct.
> - Open an issue before large changes; small fixes can go straight to a PR.
> - Write tests, keep coverage steady or improving.
> - Use Conventional Commits.
> - Don’t include real PII in code, issues, tests, or logs.

---

## Code of Conduct

Participation in this project is governed by our **Code of Conduct** (see `CODE_OF_CONDUCT.md`). By participating, you agree to abide by it.

## Licensing & CLA

This project is open source (see `LICENSE`). To protect contributors and users, we require contributors to agree to our **Contributor License Agreement (CLA)** before we can merge PRs (see `legal/CLA.md`). You’ll be prompted automatically by the CLA bot on your first PR.

> If your company has special legal needs, please contact the maintainers before sending large PRs.

## Security

**Never** report security issues in public issues or PRs. Instead, follow the process in `SECURITY.md`.

---

## What this project does

`@plasius/scene-layout` provides portable scene layout contracts and runtime helpers:

- typed manifests for variants, zones, anchors, and coordinate spaces
- fail-closed validation helpers for untrusted layout input
- deterministic responsive variant resolution

Contributions typically fall into: contract additions, validation hardening, resolution logic, docs, and tooling quality.

---

## Getting started (local dev)

### Prerequisites

- Node.js (use the version specified in `.nvmrc` if present: `nvm use`).
- npm (we use npm scripts in this repo).

### Install

```bash
npm ci
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
# or, if using Vitest in watch mode
npm run test:watch
```

### Lint

```bash
npm run lint
```

---

## How to propose a change

### 1) For bugs

- Search existing issues first.
- Open a new issue with:
  - Clear title, steps to reproduce, expected vs actual behaviour,
  - Minimal repro (code snippet or small repo),
  - Environment info (OS, Node, package version).

### 2) For features / refactors

- For anything non-trivial, open an issue first and outline the proposal.
- If the change affects public API or architecture, add an ADR draft (see `docs/adrs/`).

### 3) Good first issues

We label approachable tasks as **good first issue** and **help wanted**.

---

## Branch, commit, PR

**Branching**

- Fork or create a feature branch from `main`: `feat/xyz` or `fix/abc`.

**Commit messages** (Conventional Commits)

- `feat: add breakpoint aspect-ratio matching`
- `fix: reject duplicate anchor ids`
- `docs: expand rollout ownership notes`
- `refactor: simplify variant scoring`
- `test: add invalid ratio surface coverage`
- `chore: bump dev deps`

**Pull Requests**

- Keep PRs focused and small when possible.
- Include tests for new/changed behaviour.
- Update docs (README, JSDoc, ADRs) as needed.
- Add a clear description of what & why, with before/after examples if useful.
- Ensure CI is green (lint, build, tests).

**PR checklist**

- [ ] Title uses Conventional Commits
- [ ] Tests added/updated
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] Docs updated (README/ADR/CHANGELOG if needed)
- [ ] No real PII in code, tests, or logs

---

## Coding standards

- **Language:** TypeScript with `strict` types.
- **Style:** ESLint + Prettier.
- **Tests:** Prefer Vitest (or Jest) + `@testing-library/*` for React-facing bits.
- **Public API:** Aim for backward compatibility; use SemVer and mark breaking changes clearly (`feat!:` or `fix!:`).
- **Performance:** Avoid excessive allocations in hot paths; prefer immutable patterns but mind GC pressure.
- **Docs:** Add TSDoc comments for exported types/functions.

### Contracts and validation

- Add tests covering common and edge cases.
- Keep ids and variant semantics stable unless the tracked work intentionally changes them.
- Fail closed for malformed input instead of inferring partial layout state.

---

## Adding dependencies

- Minimise runtime dependencies; prefer dev dependencies.
- Justify any new runtime dependency in the PR description (size, security, maintenance).
- Avoid transitive heavy deps unless critical.

---

## Versioning & releases

- We follow **SemVer**.
- Breaking changes require a major bump and migration notes.
- Keep the `CHANGELOG.md` (or release notes) clear about user-facing changes.

---

## Documentation

- Update `README.md` with new features or setup steps.
- Add or update ADRs in `docs/adrs/` for architectural decisions.
- Keep examples minimal, copy-pasteable, and tested when feasible.

---

## Maintainers’ process (overview)

- Triage new issues weekly; label and assign.
- Review PRs for correctness, tests, and docs.
- Squash-merge with Conventional Commit titles.
- Publish from CI when applicable.

---

## Questions

If you have questions or want feedback before building:

- Open a discussion or issue with a short proposal,
- Or draft a PR early (mark as **Draft**) to get directional feedback.

Thanks again for contributing.
