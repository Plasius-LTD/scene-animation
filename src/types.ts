export const SCENE_ANIMATION_SCHEMA_VERSION = "1.0.0";
export const SCENE_ANIMATION_STATE_VERSION = "1.0.0";
export const SCENE_ANIMATION_PALETTE_LOADER_FLAG_ID =
  "scene.animation.palette-loader.enabled";

export type SceneAnimationPlayMode = "playing" | "paused" | "stopped";

type NumericVector = [number, number, number];

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
