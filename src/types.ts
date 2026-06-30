export const SCENE_ANIMATION_SCHEMA_VERSION = "1.0.0";
export const SCENE_ANIMATION_STATE_VERSION = "1.0.0";
export const SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION = "1.0.0";
export const SCENE_ANIMATION_ADVENTURE_FLAG_ID =
  "gpu-demo.animation-adventure.enabled";
export const SCENE_ANIMATION_PALETTE_LOADER_FLAG_ID =
  "scene.animation.palette-loader.enabled";

export type SceneAnimationPlayMode = "playing" | "paused" | "stopped";
export type SceneAnimationAdventureBeatKind =
  | "idle"
  | "locomotion"
  | "action"
  | "modifier"
  | "object"
  | "spell-effect";
export type SceneAnimationRootMotionPolicy =
  | "prefer-root-motion"
  | "force-root-motion"
  | "route-driven"
  | "in-place";
export type SceneAnimationCameraFollowMode = "lagged-follow";
export type SceneAnimationPropKind =
  | "crop-row"
  | "fence-segment"
  | "crate"
  | "cart"
  | "small-tree"
  | "path-marker";

type NumericVector = [number, number, number];
type CubicBezier = [number, number, number, number];

type Id = string;

export interface SceneAnimationFrame {
  timeMs: number;
  value: NumericVector;
  easing?: "linear" | "ease-in" | "ease-out";
}

export interface SceneAnimationClip {
  id: Id;
  durationMs: number;
  loop: boolean;
  frames: SceneAnimationFrame[];
  targets: Id[];
}

export interface SceneAnimationManifest {
  schemaVersion: string;
  paletteId: Id;
  paletteVersion: string;
  clips: SceneAnimationClip[];
}

export interface SceneAnimationPlaylist {
  sequence: Id[];
  loop: boolean;
  fallbackClipId?: Id;
}

export interface SceneAnimationPlaybackState {
  schemaVersion: string;
  objectId: Id;
  paletteId: Id;
  clipId: string;
  mode: SceneAnimationPlayMode;
  positionMs: number;
  speed: number;
  loopsCompleted: number;
}

export interface SceneAnimationAdventureClipRef {
  id: Id;
  category: SceneAnimationAdventureBeatKind;
  url?: string;
  rootTranslation?: boolean;
}

export interface SceneAnimationAdventurePathPoint {
  id: Id;
  position: NumericVector;
  arriveMs: number;
}

export interface SceneAnimationAdventureBlendWindow {
  inMs: number;
  outMs: number;
}

export interface SceneAnimationAdventureBeat {
  id: Id;
  order: number;
  kind: SceneAnimationAdventureBeatKind;
  clipId: Id;
  durationMs: number;
  pathPointId?: Id;
  rootMotion: SceneAnimationRootMotionPolicy;
  blend: SceneAnimationAdventureBlendWindow;
}

export interface SceneAnimationAdventureCameraFollowRig {
  mode: SceneAnimationCameraFollowMode;
  cubicBezier: CubicBezier;
  lagMs: number;
  lookAheadMs: number;
  offset: NumericVector;
}

export interface SceneAnimationAdventurePropLayout {
  seed: number;
  bounds: {
    min: NumericVector;
    max: NumericVector;
  };
  kinds: SceneAnimationPropKind[];
}

export interface SceneAnimationAdventureManifest {
  schemaVersion: string;
  adventureId: Id;
  characterId: Id;
  modelUrl: string;
  clips: SceneAnimationAdventureClipRef[];
  route: SceneAnimationAdventurePathPoint[];
  beats: SceneAnimationAdventureBeat[];
  camera: SceneAnimationAdventureCameraFollowRig;
  props: SceneAnimationAdventurePropLayout;
}

export type SceneAnimationValidationCode =
  | "required"
  | "invalid-type"
  | "invalid-id"
  | "invalid-value"
  | "duplicate-id"
  | "missing-reference";

export interface SceneAnimationValidationIssue {
  code: SceneAnimationValidationCode;
  path: string;
  message: string;
}

export interface SceneAnimationValidationResult<T> {
  valid: boolean;
  issues: SceneAnimationValidationIssue[];
  value?: T;
}

export interface SceneAnimationResolutionRequest {
  manifest: SceneAnimationManifest;
  clipId: Id;
}

export interface SceneAnimationResolutionResult {
  manifest: SceneAnimationManifest;
  clip: SceneAnimationClip;
}
