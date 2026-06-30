# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

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

[Unreleased]: https://github.com/Plasius-LTD/scene-animation/compare/v0.1.4...HEAD


[0.1.3]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/scene-animation/releases/tag/v0.1.4
