# @plasius/scene-animation

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
