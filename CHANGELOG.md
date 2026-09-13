# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.7] - 2026-09-13

### Changed
- Refresh compatible npm dependencies from the registry for the weekly dependency maintenance wave.


- **Added**
  - (placeholder)

- **Changed**
  - Enforced build and public-package verification through the npm prepublish lifecycle.
  - Bound npm publication to the exact prepared `main` commit after successful push-triggered CI.
  - (placeholder)

- **Fixed**
  - Added exact-commit CI dispatch and disabled package-manager cache finalization in both hosted validation jobs.
  - (placeholder)

- **Security**
  - Removed the npm write-token path, added a fail-closed npm 11.5.1-or-newer OIDC guard, and denied fork PR code access to reviewed CI.
  - Pinned patched transitive npm dependencies to clear the current audit baseline.
  - Moved reviewed CI to explicit GitHub-hosted runners while retaining the same-repository pull-request guard.
  - Added fail-closed source and npm-package admission for the administrative contributor registry and pinned the CI/CD runtime to Node.js 24.18.0 LTS.
  - (placeholder)

## [0.1.6] - 2026-07-03

- **Added**
  - Added professional Animation Adventure contracts for WebGPU PBR render mode,
    root-motion-required playback, cinematic follow cameras, textured
    environment assets, movement profiles, movement requirements, and runtime
    quality gates.

- **Changed**
  - Tightened adventure validation so professional travel beats reject
    calibrated in-place movement, stationary beats reject world displacement,
    and professional manifests fail closed without textured environment assets.

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.5] - 2026-06-30

- **Added**
  - Added adventure playback manifest contracts for scripted beats, clip refs,
    root-motion policy, route points, lagged camera follow, and deterministic
    prop layouts.

- **Changed**
  - Expanded validation coverage for adventure clip ids, beat ordering,
    durations, path continuity, camera defaults, and prop seed bounds.

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.4] - 2026-06-22

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.3] - 2026-06-21

- **Added**
  - Added `@plasius/scene-animation` contracts for palette manifests, clips, and playback state.
  - Added validation and resolution helpers for deterministic clip selection and playlist composition.

- **Changed**
  - Created the public package baseline from the `@plasius/schema` template for the scene package family.

- **Fixed**
  - Established bounded validation for invalid layout ids, duplicate anchors, and malformed ratio surfaces before downstream runtime use.

- **Security**
  - Validation fails closed for malformed clip playback input and prevents runtime selector ambiguity.

---

[Unreleased]: https://github.com/Plasius-LTD/scene-animation/compare/v0.1.7...HEAD


[0.1.3]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.4
[0.1.5]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.5
[0.1.6]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.6
[0.1.7]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.7
