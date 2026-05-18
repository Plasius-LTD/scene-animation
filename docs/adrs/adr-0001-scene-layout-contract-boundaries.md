# ADR 0001: Scene layout contract boundaries

## Status

Accepted

## Context

Feature `Plasius-LTD/plasius-ltd-site#312` and story `#316` require a public, reusable package for scene layout zones, anchors, coordinate spaces, and responsive placement variants. The parent rollout flag already exists in the site backlog as `scene.layout.foundation.enabled`, but the package itself must stay portable and must not become the feature-flag control plane.

Downstream scene object and runtime packages need stable ids and deterministic resolution without inheriting renderer or storage coupling from `plasius-ltd-site`.

## Decision

Create `@plasius/scene-layout` as a public package that exports:

1. stable TypeScript contracts for manifests, variants, zones, anchors, rectangles, and breakpoint surfaces
2. fail-closed validation for untrusted runtime input
3. deterministic variant resolution based on width, height, orientation, and aspect ratio

The package deliberately does not:

- call feature-flag services
- read environment variables
- import renderer SDKs
- embed storage or blob resolution logic

## Consequences

### Positive

- downstream packages can bind to layout data by stable zone and anchor ids
- rollout remains reversible in the site through `scene.layout.foundation.enabled`
- public package consumers get bounded validation for malformed manifests

### Negative

- package consumers must wire rollout and delivery concerns separately
- the package does not solve authoring, persistence, or renderer translation on its own

## Rollout notes

- Parent feature flag: `scene.layout.foundation.enabled`
- Source-of-truth evaluator: site-owned rollout control in `plasius-ltd-site`
- Package posture: document the flag, do not evaluate it
