import {
  SCENE_ANIMATION_SCHEMA_VERSION,
  type SceneAnimationClip,
  type SceneAnimationManifest,
  type SceneAnimationPlaybackState,
  type SceneAnimationValidationIssue,
  type SceneAnimationValidationResult,
  type SceneAnimationPlaylist,
  type SceneAnimationResolutionResult,
  SCENE_ANIMATION_STATE_VERSION,
} from "./types.js";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function pushIssue(
  issues: SceneAnimationValidationIssue[],
  issue: SceneAnimationValidationIssue,
): void {
  issues.push(issue);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateKebabId(
  value: unknown,
  path: string,
  issues: SceneAnimationValidationIssue[],
): value is string {
  if (typeof value !== "string") {
    pushIssue(issues, {
      code: "invalid-type",
      path,
      message: "Expected a string identifier.",
    });
    return false;
  }

  if (!ID_PATTERN.test(value)) {
    pushIssue(issues, {
      code: "invalid-id",
      path,
      message: "Identifiers must be kebab-case tokens.",
    });
    return false;
  }

  return true;
}

function validateClip(clip: SceneAnimationClip, path: string, issues: SceneAnimationValidationIssue[]): boolean {
  let valid = true;

  if (!validateKebabId(clip.id, `${path}.id`, issues)) {
    valid = false;
  }

  if (!isFiniteNumber(clip.durationMs) || clip.durationMs <= 0) {
    pushIssue(issues, {
      code: "invalid-value",
      path: `${path}.durationMs`,
      message: "durationMs must be a positive finite number.",
    });
    valid = false;
  }

  if (!Array.isArray(clip.frames) || clip.frames.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: `${path}.frames`,
      message: "clip must provide at least one frame.",
    });
    valid = false;
  } else {
    let previousTime: number | undefined;

    for (const [index, frame] of clip.frames.entries()) {
      const framePath = `${path}.frames[${index}]`;
      if (!frame || typeof frame !== "object") {
        pushIssue(issues, {
          code: "required",
          path: framePath,
          message: "Expected frame definition.",
        });
        valid = false;
        continue;
      }

      if (!isFiniteNumber(frame.timeMs) || frame.timeMs < 0) {
        pushIssue(issues, {
          code: "invalid-type",
          path: `${framePath}.timeMs`,
          message: "frame timeMs must be non-negative number.",
        });
        valid = false;
      }

      if (previousTime !== undefined && frame.timeMs < previousTime) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${framePath}.timeMs`,
          message: "frames must be in non-decreasing time order.",
        });
        valid = false;
      }

      previousTime = frame.timeMs;

      if (!Array.isArray(frame.value) || frame.value.length !== 3 || frame.value.some((axis) => !isFiniteNumber(axis))) {
        pushIssue(issues, {
          code: "invalid-type",
          path: `${framePath}.value`,
          message: "frame value must be three finite numbers.",
        });
        valid = false;
      }
    }
  }

  if (!Array.isArray(clip.targets) || clip.targets.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: `${path}.targets`,
      message: "Clip targets must include at least one object id.",
    });
    valid = false;
  } else {
    const seenTargets = new Set<string>();
    for (const [targetIndex, target] of clip.targets.entries()) {
      if (!validateKebabId(target, `${path}.targets[${targetIndex}]`, issues)) {
        valid = false;
        continue;
      }

      if (seenTargets.has(target)) {
        pushIssue(issues, {
          code: "duplicate-id",
          path: `${path}.targets[${targetIndex}]`,
          message: `Duplicate target '${target}' is not allowed.`,
        });
        valid = false;
      }
      seenTargets.add(target);
    }
  }

  return valid;
}

export function validateSceneAnimationManifest(
  manifest: unknown,
): SceneAnimationValidationResult<SceneAnimationManifest> {
  const issues: SceneAnimationValidationIssue[] = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$",
          message: "Expected an animation manifest object.",
        },
      ],
    };
  }

  const value = manifest as Record<string, unknown>;
  let valid = true;

  if (value.schemaVersion !== SCENE_ANIMATION_SCHEMA_VERSION) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.schemaVersion",
      message: `schemaVersion must equal ${SCENE_ANIMATION_SCHEMA_VERSION}.`,
    });
    valid = false;
  }

  if (!validateKebabId(value.paletteId, "$.paletteId", issues)) {
    valid = false;
  }

  if (typeof value.paletteVersion !== "string" || value.paletteVersion.trim().length === 0) {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.paletteVersion",
      message: "paletteVersion must be a non-empty string.",
    });
    valid = false;
  }

  if (!Array.isArray(value.clips) || value.clips.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.clips",
      message: "manifest must include at least one clip.",
    });
    return { valid: false, issues };
  }

  const seenIds = new Set<string>();
  for (const [index, clip] of value.clips.entries()) {
    const clipValue = clip as SceneAnimationClip;
    if (!clipValue || typeof clipValue !== "object") {
      pushIssue(issues, {
        code: "required",
        path: `$.clips[${index}]`,
        message: "Expected a clip definition.",
      });
      valid = false;
      continue;
    }

    if (!validateClip(clipValue, `$.clips[${index}]`, issues)) {
      valid = false;
    }

    if (seenIds.has(clipValue.id)) {
      pushIssue(issues, {
        code: "duplicate-id",
        path: `$.clips[${index}].id`,
        message: `Duplicate clip id '${clipValue.id}' is not allowed.`,
      });
      valid = false;
    }

    seenIds.add(clipValue.id);
  }

  return valid
    ? {
        valid: true,
        issues,
        value: manifest as SceneAnimationManifest,
      }
    : {
        valid: false,
        issues,
      };
}

export function createSceneAnimationManifest(
  manifest: SceneAnimationManifest,
): SceneAnimationManifest {
  const validation = validateSceneAnimationManifest(manifest);
  if (!validation.valid || !validation.value) {
    const summary = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid scene animation manifest. ${summary}`);
  }

  return validation.value;
}

export function validateSceneAnimationPlaybackState(
  state: unknown,
): SceneAnimationValidationResult<SceneAnimationPlaybackState> {
  if (!state || typeof state !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$",
          message: "Expected animation playback state object.",
        },
      ],
    };
  }

  const value = state as Record<string, unknown>;
  const issues: SceneAnimationValidationIssue[] = [];
  let valid = true;

  if (value.schemaVersion !== SCENE_ANIMATION_STATE_VERSION) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.schemaVersion",
      message: `schemaVersion must equal ${SCENE_ANIMATION_STATE_VERSION}.`,
    });
    valid = false;
  }

  if (typeof value.objectId !== "string") {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.objectId",
      message: "objectId must be a string.",
    });
    valid = false;
  }

  if (!validateKebabId(value.paletteId, "$.paletteId", issues)) {
    valid = false;
  }

  if (!validateKebabId(value.clipId, "$.clipId", issues)) {
    valid = false;
  }

  if (!Number.isFinite(value.positionMs as number) || (value.positionMs as number) < 0) {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.positionMs",
      message: "positionMs must be a non-negative number.",
    });
    valid = false;
  }

  if (typeof value.mode !== "string") {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.mode",
      message: "mode must be one of playing, paused, stopped.",
    });
    valid = false;
  }

  if (!Number.isFinite(value.speed as number) || (value.speed as number) <= 0) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.speed",
      message: "speed must be greater than 0.",
    });
    valid = false;
  }

  return valid
    ? {
        valid: true,
        issues,
        value: state as SceneAnimationPlaybackState,
      }
    : {
        valid: false,
        issues,
      };
}

export function resolveSceneAnimationClip(
  request: { manifest: SceneAnimationManifest; clipId: string },
): SceneAnimationValidationResult<SceneAnimationResolutionResult> {
  const validation = validateSceneAnimationManifest(request.manifest);
  if (!validation.valid || !validation.value) {
    return {
      valid: false,
      issues: validation.issues,
    };
  }

  const clip = validation.value.clips.find((candidate) => candidate.id === request.clipId);
  if (!clip) {
    return {
      valid: false,
      issues: [
        {
          code: "missing-reference",
          path: "$.clipId",
          message: `Requested clip '${request.clipId}' was not found in manifest.`,
        },
      ],
    };
  }

  return {
    valid: true,
    issues: [],
    value: {
      manifest: validation.value,
      clip,
    },
  };
}

export function resolveSceneAnimationPlaylist(
  manifest: SceneAnimationManifest,
  playlist: SceneAnimationPlaylist,
): SceneAnimationValidationResult<SceneAnimationClip[]> {
  const validation = validateSceneAnimationManifest(manifest);
  if (!validation.valid || !validation.value) {
    return { valid: false, issues: validation.issues };
  }

  const clipById = new Map(
    validation.value.clips.map((clip) => [clip.id, clip]),
  );

  const issues: SceneAnimationValidationIssue[] = [];
  const resolved: typeof validation.value.clips = [];
  let valid = true;

  for (const [index, clipId] of playlist.sequence.entries()) {
    const clip = clipById.get(clipId);
    if (!clip) {
      pushIssue(issues, {
        code: "missing-reference",
        path: `$.sequence[${index}]`,
        message: `sequence clip '${clipId}' is not in manifest.`,
      });
      valid = false;
      continue;
    }

    resolved.push(clip);
  }

  if (playlist.fallbackClipId !== undefined && !clipById.has(playlist.fallbackClipId)) {
    pushIssue(issues, {
      code: "missing-reference",
      path: "$.fallbackClipId",
      message: `fallbackClipId '${playlist.fallbackClipId}' is not in manifest.`,
    });
    valid = false;
  }

  return valid
    ? { valid: true, issues: [], value: resolved }
    : { valid: false, issues };
}
