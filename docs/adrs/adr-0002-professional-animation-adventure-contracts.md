# ADR 0002: Professional Animation Adventure Contracts

## Status

Accepted

## Context

The Animation Adventure demo needs a professional WebGPU path that uses
textured skinned GLB rendering and animation-driven locomotion. The legacy
manifest could still describe a canvas proxy renderer, generated 2D props, and
calibrated in-place travel. That made it possible for runtime packages to
silently force movement through route interpolation even when the active clip
had no authored root motion.

## Decision

Add optional professional adventure contract fields to the existing manifest:

- `renderMode: "webgpu-pbr"`
- `motionPolicy: "root-motion-required"`
- clip-level `movementProfile`
- beat-level `movementRequirement`
- `cinematic-follow` camera fields
- textured `environmentAssets` and deterministic `environmentInstances`
- `qualityGates` for textured, skinned, non-proxy playback

Existing manifests remain valid when these fields are omitted. When the
professional mode is selected, validation fails closed unless movement beats use
root-authored clip profiles, stationary beats do not displace the character,
the camera is cinematic, textured environment assets are declared, and proxy
rendering is explicitly disallowed.

## Consequences

Renderer and orchestration packages get a stable boundary for professional
Animation Adventure playback without coupling this package to WebGPU APIs. The
site can keep the legacy adventure as an explicit fallback while refusing to
ship professional mode with route-driven movement or untextured proxy visuals.
