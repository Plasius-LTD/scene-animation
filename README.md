# @plasius/scene-animation

[![npm version](https://img.shields.io/npm/v/@plasius/scene-animation.svg)](https://www.npmjs.com/package/@plasius/scene-animation)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/scene-animation/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/scene-animation/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/scene-animation)](https://codecov.io/gh/Plasius-LTD/scene-animation)
[![License](https://img.shields.io/github/license/Plasius-LTD/scene-animation)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

Reusable contracts for scene animation clip manifests, palette structure, and playback states.
It also exposes the v1 farm-adventure playback manifest used by GPU demos.

## Installation

```bash
npm install @plasius/scene-animation
```

## Rollout ownership

This package follows site-side rollout control:

- `scene.animation.palette-loader.enabled`
- `gpu-demo.animation-adventure.enabled`
- `gpu-demo.animation-adventure.professional.enabled`

## Package exports

- palette manifest validation and construction
- clip resolution and playlist resolution helpers
- playback state validation/factories
- adventure playback contracts for scripted beats, root/path motion policy,
  bezier-lag camera follow rigs, and deterministic prop layouts
- professional adventure contracts for WebGPU PBR rendering, root-motion-only
  travel, cinematic follow cameras, textured environment assets, movement
  profiles, movement requirements, and quality gates that reject proxy renderers

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

CI keeps the administrative contributor registry outside Git and npm package
artifacts using exact, case-normalised path checks. CI accepts trusted repository
pushes only and explicitly selects `Public CI - Quarantined` with
`[self-hosted, Linux, X64]`. PR/manual/caller-selected runners and hosted fallback
are not accepted. Checkout credentials are not persisted, npm installs are strict,
package-manager cache finalization is disabled, and both jobs have timeouts.
Pre-merge CI requires a reviewed branch locked against all updates, including
administrators and fork synchronization, before temporary exact-ref/SHA admission.
Remove that admission before any branch change and after qualification; preserve
other group entries and repository access. See [ADR-0004](./docs/adrs/adr-0004-trusted-self-hosted-ci.md).
Publication uses the GitHub-hosted `production` job with Node 24 and a pinned
npm 11.6.2 client. It is token-free and proceeds only while the prepared SHA
is the exact `main` head after successful push-triggered CI. Do not dispatch CD
until the npm trusted-publisher binding is verified. The inherited stored flag
`platform.public-artifact-integrity.enabled` governs restoration and cannot bypass
artifact or release gates. Missing/disabled flag state retains containment.
Rollback disables the affected workflow/channel and retains a known clean release;
it never restores hosted CI, private records, token publication or a removed version.
<!-- END PLASIUS RELEASE INTEGRITY -->
