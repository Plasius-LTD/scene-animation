import {
  SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION,
  SCENE_ANIMATION_SCHEMA_VERSION,
  type SceneAnimationClip,
  type SceneAnimationAdventureBeatKind,
  type SceneAnimationAdventureManifest,
  type SceneAnimationAdventureMotionPolicy,
  type SceneAnimationAdventureMovementMode,
  type SceneAnimationAdventureMovementRequirementKind,
  type SceneAnimationAdventureRenderMode,
  type SceneAnimationCameraFollowMode,
  type SceneAnimationPropKind,
  type SceneAnimationRootMotionPolicy,
  type SceneAnimationManifest,
  type SceneAnimationPlaybackState,
  type SceneAnimationValidationIssue,
  type SceneAnimationValidationResult,
  type SceneAnimationPlaylist,
  type SceneAnimationResolutionResult,
  SCENE_ANIMATION_STATE_VERSION,
} from "./types.js";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ADVENTURE_BEAT_KINDS = new Set<SceneAnimationAdventureBeatKind>([
  "idle",
  "locomotion",
  "action",
  "modifier",
  "object",
  "spell-effect",
]);
const ROOT_MOTION_POLICIES = new Set<SceneAnimationRootMotionPolicy>([
  "prefer-root-motion",
  "force-root-motion",
  "root-authored",
  "route-driven",
  "in-place",
]);
const CAMERA_FOLLOW_MODES = new Set<SceneAnimationCameraFollowMode>([
  "lagged-follow",
  "cinematic-follow",
]);
const ADVENTURE_RENDER_MODES = new Set<SceneAnimationAdventureRenderMode>([
  "canvas-2d",
  "webgpu-pbr",
]);
const ADVENTURE_MOTION_POLICIES = new Set<SceneAnimationAdventureMotionPolicy>([
  "legacy-compatible",
  "root-motion-required",
]);
const MOVEMENT_MODES = new Set<SceneAnimationAdventureMovementMode>([
  "stationary",
  "root-authored",
  "calibrated-in-place",
  "jump",
]);
const MOVEMENT_REQUIREMENT_KINDS = new Set<SceneAnimationAdventureMovementRequirementKind>([
  "stationary",
  "travel",
  "jump",
  "root-authored",
]);
const PROP_KINDS = new Set<SceneAnimationPropKind>([
  "crop-row",
  "fence-segment",
  "crate",
  "cart",
  "small-tree",
  "path-marker",
]);
const MAX_PROP_SEED = 0xffff_ffff;
const ENVIRONMENT_ASSET_KINDS = new Set([
  "terrain",
  "path",
  "crop-row",
  "fence-segment",
  "crate",
  "cart",
  "tree",
  "marker",
  "lighting-probe",
]);

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

function validateVector3(
  value: unknown,
  path: string,
  issues: SceneAnimationValidationIssue[],
): value is [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3 || value.some((axis) => !isFiniteNumber(axis))) {
    pushIssue(issues, {
      code: "invalid-type",
      path,
      message: "Expected three finite numbers.",
    });
    return false;
  }

  return true;
}

function validateEnum<T extends string>(
  value: unknown,
  accepted: Set<T>,
  path: string,
  issues: SceneAnimationValidationIssue[],
  label: string,
): value is T {
  if (typeof value !== "string" || !accepted.has(value as T)) {
    pushIssue(issues, {
      code: "invalid-value",
      path,
      message: `${label} is not supported.`,
    });
    return false;
  }

  return true;
}

function validateOptionalBoolean(
  value: unknown,
  path: string,
  issues: SceneAnimationValidationIssue[],
): boolean {
  if (value === undefined || typeof value === "boolean") {
    return true;
  }

  pushIssue(issues, {
    code: "invalid-type",
    path,
    message: "Expected a boolean value.",
  });
  return false;
}

function validateOptionalFiniteNumber(
  value: unknown,
  path: string,
  issues: SceneAnimationValidationIssue[],
  label: string,
  minimum = 0,
): boolean {
  if (value === undefined) {
    return true;
  }
  if (!isFiniteNumber(value) || value < minimum) {
    pushIssue(issues, {
      code: "invalid-value",
      path,
      message: `${label} must be a finite number greater than or equal to ${minimum}.`,
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

export function validateSceneAnimationAdventureManifest(
  manifest: unknown,
): SceneAnimationValidationResult<SceneAnimationAdventureManifest> {
  const issues: SceneAnimationValidationIssue[] = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$",
          message: "Expected an animation adventure manifest object.",
        },
      ],
    };
  }

  const value = manifest as Record<string, unknown>;
  let valid = true;

  if (value.schemaVersion !== SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.schemaVersion",
      message: `schemaVersion must equal ${SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION}.`,
    });
    valid = false;
  }

  if (!validateKebabId(value.adventureId, "$.adventureId", issues)) {
    valid = false;
  }

  if (!validateKebabId(value.characterId, "$.characterId", issues)) {
    valid = false;
  }

  if (typeof value.modelUrl !== "string" || value.modelUrl.trim().length === 0) {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.modelUrl",
      message: "modelUrl must be a non-empty string.",
    });
    valid = false;
  }

  if (value.renderMode !== undefined && !validateEnum(value.renderMode, ADVENTURE_RENDER_MODES, "$.renderMode", issues, "adventure render mode")) {
    valid = false;
  }

  if (value.motionPolicy !== undefined && !validateEnum(value.motionPolicy, ADVENTURE_MOTION_POLICIES, "$.motionPolicy", issues, "adventure motion policy")) {
    valid = false;
  }

  const professionalMode = value.renderMode === "webgpu-pbr" || value.motionPolicy === "root-motion-required";
  if (professionalMode && value.motionPolicy !== "root-motion-required") {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.motionPolicy",
      message: "professional WebGPU animation manifests must require root motion.",
    });
    valid = false;
  }

  const clipIds = new Set<string>();
  const clipById = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(value.clips) || value.clips.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.clips",
      message: "adventure manifest must include at least one clip reference.",
    });
    valid = false;
  } else {
    for (const [index, clip] of value.clips.entries()) {
      const clipValue = clip as Record<string, unknown>;
      const path = `$.clips[${index}]`;
      if (!clipValue || typeof clipValue !== "object") {
        pushIssue(issues, {
          code: "required",
          path,
          message: "Expected a clip reference.",
        });
        valid = false;
        continue;
      }

      if (validateKebabId(clipValue.id, `${path}.id`, issues)) {
        if (clipIds.has(clipValue.id)) {
          pushIssue(issues, {
            code: "duplicate-id",
            path: `${path}.id`,
            message: `Duplicate clip id '${clipValue.id}' is not allowed.`,
          });
          valid = false;
        }
        clipIds.add(clipValue.id);
        clipById.set(clipValue.id, clipValue);
      } else {
        valid = false;
      }

      if (!validateEnum(clipValue.category, ADVENTURE_BEAT_KINDS, `${path}.category`, issues, "clip category")) {
        valid = false;
      }

      if (!validateOptionalBoolean(clipValue.rootTranslation, `${path}.rootTranslation`, issues)) {
        valid = false;
      }

      const movementProfile = clipValue.movementProfile as Record<string, unknown> | undefined;
      if (movementProfile !== undefined) {
        if (!movementProfile || typeof movementProfile !== "object") {
          pushIssue(issues, {
            code: "invalid-type",
            path: `${path}.movementProfile`,
            message: "movementProfile must be an object.",
          });
          valid = false;
        } else {
          if (!validateEnum(movementProfile.motionMode, MOVEMENT_MODES, `${path}.movementProfile.motionMode`, issues, "movement mode")) {
            valid = false;
          }
          for (const key of ["rootTranslationDistance", "durationMs", "expectedSpeed", "strideLength"] as const) {
            if (!isFiniteNumber(movementProfile[key]) || (movementProfile[key] as number) < 0) {
              pushIssue(issues, {
                code: "invalid-value",
                path: `${path}.movementProfile.${key}`,
                message: "movement profile numeric values must be non-negative finite numbers.",
              });
              valid = false;
            }
          }
          if (typeof movementProfile.loopable !== "boolean") {
            pushIssue(issues, {
              code: "invalid-type",
              path: `${path}.movementProfile.loopable`,
              message: "movement profile loopable must be boolean.",
            });
            valid = false;
          }
          if (typeof movementProfile.worldDisplacementAllowed !== "boolean") {
            pushIssue(issues, {
              code: "invalid-type",
              path: `${path}.movementProfile.worldDisplacementAllowed`,
              message: "movement profile worldDisplacementAllowed must be boolean.",
            });
            valid = false;
          }
          if (!validateOptionalBoolean(movementProfile.footSlideTolerancePassed, `${path}.movementProfile.footSlideTolerancePassed`, issues)) {
            valid = false;
          }
          const verticalBounds = movementProfile.verticalBounds as Record<string, unknown>;
          if (!verticalBounds || typeof verticalBounds !== "object" || !isFiniteNumber(verticalBounds.min) || !isFiniteNumber(verticalBounds.max) || verticalBounds.min > verticalBounds.max) {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.movementProfile.verticalBounds`,
              message: "movement profile vertical bounds must provide finite min and max values.",
            });
            valid = false;
          }
          if (!Array.isArray(movementProfile.footContactWindows)) {
            pushIssue(issues, {
              code: "invalid-type",
              path: `${path}.movementProfile.footContactWindows`,
              message: "movement profile footContactWindows must be an array.",
            });
            valid = false;
          }
        }
      } else if (professionalMode) {
        pushIssue(issues, {
          code: "required",
          path: `${path}.movementProfile`,
          message: "professional animation manifests must include clip movement profiles.",
        });
        valid = false;
      }
    }
  }

  const pathPointIds = new Set<string>();
  if (!Array.isArray(value.route) || value.route.length < 2) {
    pushIssue(issues, {
      code: "required",
      path: "$.route",
      message: "route must include at least two path points.",
    });
    valid = false;
  } else {
    let previousArriveMs: number | undefined;
    let previousPosition: [number, number, number] | undefined;

    for (const [index, point] of value.route.entries()) {
      const pointValue = point as Record<string, unknown>;
      const path = `$.route[${index}]`;
      if (!pointValue || typeof pointValue !== "object") {
        pushIssue(issues, {
          code: "required",
          path,
          message: "Expected a route path point.",
        });
        valid = false;
        continue;
      }

      if (validateKebabId(pointValue.id, `${path}.id`, issues)) {
        if (pathPointIds.has(pointValue.id)) {
          pushIssue(issues, {
            code: "duplicate-id",
            path: `${path}.id`,
            message: `Duplicate path point '${pointValue.id}' is not allowed.`,
          });
          valid = false;
        }
        pathPointIds.add(pointValue.id);
      } else {
        valid = false;
      }

      if (!validateVector3(pointValue.position, `${path}.position`, issues)) {
        valid = false;
      } else if (previousPosition) {
        const distance = Math.hypot(
          pointValue.position[0] - previousPosition[0],
          pointValue.position[1] - previousPosition[1],
          pointValue.position[2] - previousPosition[2],
        );
        if (distance <= 0) {
          pushIssue(issues, {
            code: "invalid-value",
            path: `${path}.position`,
            message: "route path points must make forward spatial progress.",
          });
          valid = false;
        }
      }

      if (!isFiniteNumber(pointValue.arriveMs) || pointValue.arriveMs < 0) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.arriveMs`,
          message: "arriveMs must be a non-negative finite number.",
        });
        valid = false;
      } else if (previousArriveMs !== undefined && pointValue.arriveMs <= previousArriveMs) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.arriveMs`,
          message: "route path points must be in strictly increasing time order.",
        });
        valid = false;
      }

      if (Array.isArray(pointValue.position)) {
        previousPosition = pointValue.position as [number, number, number];
      }
      if (isFiniteNumber(pointValue.arriveMs)) {
        previousArriveMs = pointValue.arriveMs;
      }
    }
  }

  if (!Array.isArray(value.beats) || value.beats.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.beats",
      message: "adventure manifest must include scripted beats.",
    });
    valid = false;
  } else {
    const beatIds = new Set<string>();
    let previousOrder: number | undefined;
    for (const [index, beat] of value.beats.entries()) {
      const beatValue = beat as Record<string, unknown>;
      const path = `$.beats[${index}]`;
      if (!beatValue || typeof beatValue !== "object") {
        pushIssue(issues, {
          code: "required",
          path,
          message: "Expected a scripted beat.",
        });
        valid = false;
        continue;
      }

      if (validateKebabId(beatValue.id, `${path}.id`, issues)) {
        if (beatIds.has(beatValue.id)) {
          pushIssue(issues, {
            code: "duplicate-id",
            path: `${path}.id`,
            message: `Duplicate beat id '${beatValue.id}' is not allowed.`,
          });
          valid = false;
        }
        beatIds.add(beatValue.id);
      } else {
        valid = false;
      }

      if (!isFiniteNumber(beatValue.order) || beatValue.order < 0) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.order`,
          message: "beat order must be a non-negative finite number.",
        });
        valid = false;
      } else if (previousOrder !== undefined && beatValue.order <= previousOrder) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.order`,
          message: "beats must be in strictly increasing order.",
        });
        valid = false;
      }
      if (isFiniteNumber(beatValue.order)) {
        previousOrder = beatValue.order;
      }

      if (!validateEnum(beatValue.kind, ADVENTURE_BEAT_KINDS, `${path}.kind`, issues, "beat kind")) {
        valid = false;
      }

      if (!validateKebabId(beatValue.clipId, `${path}.clipId`, issues)) {
        valid = false;
      } else if (!clipIds.has(beatValue.clipId)) {
        pushIssue(issues, {
          code: "missing-reference",
          path: `${path}.clipId`,
          message: `beat clipId '${beatValue.clipId}' is not declared in clips.`,
        });
        valid = false;
      }

      if (!isFiniteNumber(beatValue.durationMs) || beatValue.durationMs <= 0) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.durationMs`,
          message: "beat durationMs must be a positive finite number.",
        });
        valid = false;
      }

      if (beatValue.pathPointId !== undefined) {
        if (!validateKebabId(beatValue.pathPointId, `${path}.pathPointId`, issues)) {
          valid = false;
        } else if (!pathPointIds.has(beatValue.pathPointId)) {
          pushIssue(issues, {
            code: "missing-reference",
            path: `${path}.pathPointId`,
            message: `beat pathPointId '${beatValue.pathPointId}' is not declared in route.`,
          });
          valid = false;
        }
      }

      if (!validateEnum(beatValue.rootMotion, ROOT_MOTION_POLICIES, `${path}.rootMotion`, issues, "root-motion policy")) {
        valid = false;
      }

      const movementRequirement = beatValue.movementRequirement as Record<string, unknown> | undefined;
      if (movementRequirement !== undefined) {
        if (!movementRequirement || typeof movementRequirement !== "object") {
          pushIssue(issues, {
            code: "invalid-type",
            path: `${path}.movementRequirement`,
            message: "movementRequirement must be an object.",
          });
          valid = false;
        } else {
          if (!validateEnum(movementRequirement.kind, MOVEMENT_REQUIREMENT_KINDS, `${path}.movementRequirement.kind`, issues, "movement requirement")) {
            valid = false;
          }
          if (!validateOptionalFiniteNumber(movementRequirement.distanceMeters, `${path}.movementRequirement.distanceMeters`, issues, "movement distance")) {
            valid = false;
          }
          if (!validateOptionalFiniteNumber(movementRequirement.directionToleranceDegrees, `${path}.movementRequirement.directionToleranceDegrees`, issues, "direction tolerance")) {
            valid = false;
          }
          if (!validateOptionalFiniteNumber(movementRequirement.minSpeed, `${path}.movementRequirement.minSpeed`, issues, "minimum speed")) {
            valid = false;
          }
          if (!validateOptionalFiniteNumber(movementRequirement.maxSpeed, `${path}.movementRequirement.maxSpeed`, issues, "maximum speed")) {
            valid = false;
          }
          if (movementRequirement.loopPolicy !== undefined && !["single", "loop-to-distance", "clip-duration"].includes(String(movementRequirement.loopPolicy))) {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.movementRequirement.loopPolicy`,
              message: "movement loop policy is not supported.",
            });
            valid = false;
          }
          const verticalArc = movementRequirement.verticalArc as Record<string, unknown> | undefined;
          if (verticalArc !== undefined && (!verticalArc || typeof verticalArc !== "object" || !isFiniteNumber(verticalArc.min) || !isFiniteNumber(verticalArc.max) || verticalArc.min > verticalArc.max)) {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.movementRequirement.verticalArc`,
              message: "movement vertical arc must provide finite min and max values.",
            });
            valid = false;
          }
        }
      } else if (professionalMode) {
        pushIssue(issues, {
          code: "required",
          path: `${path}.movementRequirement`,
          message: "professional animation beats must declare movement requirements.",
        });
        valid = false;
      }

      if (professionalMode && typeof beatValue.clipId === "string" && clipIds.has(beatValue.clipId)) {
        const clip = clipById.get(beatValue.clipId);
        const profile = clip?.movementProfile as Record<string, unknown> | undefined;
        const requirementKind = movementRequirement?.kind;
        const movesThroughWorld = requirementKind === "travel" || requirementKind === "jump" || requirementKind === "root-authored";
        if (movesThroughWorld) {
          if (beatValue.rootMotion !== "force-root-motion" && beatValue.rootMotion !== "root-authored") {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.rootMotion`,
              message: "professional travel beats must use force-root-motion or root-authored.",
            });
            valid = false;
          }
          if (clip?.rootTranslation !== true || (profile?.motionMode !== "root-authored" && profile?.motionMode !== "jump")) {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.clipId`,
              message: "professional travel beats require a root-motion clip profile.",
            });
            valid = false;
          }
          if (profile?.footSlideTolerancePassed === false) {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.clipId`,
              message: "professional travel beats cannot use clips that fail foot-slide tolerance.",
            });
            valid = false;
          }
        }
        if (requirementKind === "stationary" && profile?.worldDisplacementAllowed === true) {
          pushIssue(issues, {
            code: "invalid-value",
            path: `${path}.clipId`,
            message: "stationary professional beats cannot use clips that allow world displacement.",
          });
          valid = false;
        }
      }

      const blend = beatValue.blend as Record<string, unknown>;
      if (!blend || typeof blend !== "object") {
        pushIssue(issues, {
          code: "required",
          path: `${path}.blend`,
          message: "beat blend window is required.",
        });
        valid = false;
      } else {
        for (const key of ["inMs", "outMs"] as const) {
          if (!isFiniteNumber(blend[key]) || blend[key] < 0) {
            pushIssue(issues, {
              code: "invalid-value",
              path: `${path}.blend.${key}`,
              message: "blend windows must be non-negative finite numbers.",
            });
            valid = false;
          }
        }
      }
    }
  }

  const camera = value.camera as Record<string, unknown>;
  if (!camera || typeof camera !== "object") {
    pushIssue(issues, {
      code: "required",
      path: "$.camera",
      message: "camera follow rig is required.",
    });
    valid = false;
  } else {
    if (!validateEnum(camera.mode, CAMERA_FOLLOW_MODES, "$.camera.mode", issues, "camera follow mode")) {
      valid = false;
    }

    if (!validateVector3(camera.offset, "$.camera.offset", issues)) {
      valid = false;
    }

    if (!professionalMode && camera.mode !== "cinematic-follow") {
      const requiredBezier = [0.22, 0.61, 0.36, 1];
      if (
        !Array.isArray(camera.cubicBezier) ||
        camera.cubicBezier.length !== 4 ||
        camera.cubicBezier.some((axis, index) => !isFiniteNumber(axis) || axis !== requiredBezier[index])
      ) {
        pushIssue(issues, {
          code: "invalid-value",
          path: "$.camera.cubicBezier",
          message: "cubicBezier must equal [0.22, 0.61, 0.36, 1] for v1.",
        });
        valid = false;
      }

      if (camera.lagMs !== 240) {
        pushIssue(issues, {
          code: "invalid-value",
          path: "$.camera.lagMs",
          message: "lagMs must equal 240 for v1.",
        });
        valid = false;
      }

      if (camera.lookAheadMs !== 320) {
        pushIssue(issues, {
          code: "invalid-value",
          path: "$.camera.lookAheadMs",
          message: "lookAheadMs must equal 320 for v1.",
        });
        valid = false;
      }
    }

    if (professionalMode) {
      if (camera.mode !== "cinematic-follow") {
        pushIssue(issues, {
          code: "invalid-value",
          path: "$.camera.mode",
          message: "professional WebGPU animation manifests must use cinematic-follow.",
        });
        valid = false;
      }
      if (!validateVector3(camera.shoulderOffset, "$.camera.shoulderOffset", issues)) {
        valid = false;
      }
      for (const key of ["velocityLookAheadMs", "yawSmoothingMs", "pitchSmoothingMs", "deadZoneRadius", "maxLagDistance"] as const) {
        if (!isFiniteNumber(camera[key]) || camera[key] <= 0) {
          pushIssue(issues, {
            code: "invalid-value",
            path: `$.camera.${key}`,
            message: "cinematic camera values must be positive finite numbers.",
          });
          valid = false;
        }
      }
    }
  }

  const props = value.props as Record<string, unknown>;
  if (!props || typeof props !== "object") {
    pushIssue(issues, {
      code: "required",
      path: "$.props",
      message: "prop layout is required.",
    });
    valid = false;
  } else {
    if (!Number.isInteger(props.seed) || (props.seed as number) < 0 || (props.seed as number) > MAX_PROP_SEED) {
      pushIssue(issues, {
        code: "invalid-value",
        path: "$.props.seed",
        message: `prop seed must be an integer between 0 and ${MAX_PROP_SEED}.`,
      });
      valid = false;
    }

    const bounds = props.bounds as Record<string, unknown>;
    if (!bounds || typeof bounds !== "object") {
      pushIssue(issues, {
        code: "required",
        path: "$.props.bounds",
        message: "prop bounds are required.",
      });
      valid = false;
    } else {
      const minValid = validateVector3(bounds.min, "$.props.bounds.min", issues);
      const maxValid = validateVector3(bounds.max, "$.props.bounds.max", issues);
      if (!minValid || !maxValid) {
        valid = false;
      } else {
        const min = bounds.min as [number, number, number];
        const max = bounds.max as [number, number, number];
        if (min.some((axis, index) => axis >= max[index]!)) {
        pushIssue(issues, {
          code: "invalid-value",
          path: "$.props.bounds",
          message: "prop bounds min values must be lower than max values.",
        });
        valid = false;
        }
      }
    }

    if (!Array.isArray(props.kinds) || props.kinds.length === 0) {
      pushIssue(issues, {
        code: "required",
        path: "$.props.kinds",
        message: "prop layout must include at least one prop kind.",
      });
      valid = false;
    } else {
      for (const [index, kind] of props.kinds.entries()) {
        if (!validateEnum(kind, PROP_KINDS, `$.props.kinds[${index}]`, issues, "prop kind")) {
          valid = false;
        }
      }
    }
  }

  const environmentAssetIds = new Set<string>();
  if (value.environmentAssets !== undefined) {
    if (!Array.isArray(value.environmentAssets) || value.environmentAssets.length === 0) {
      pushIssue(issues, {
        code: "required",
        path: "$.environmentAssets",
        message: "environmentAssets must include at least one asset when provided.",
      });
      valid = false;
    } else {
      for (const [index, asset] of value.environmentAssets.entries()) {
        const assetValue = asset as Record<string, unknown>;
        const path = `$.environmentAssets[${index}]`;
        if (!assetValue || typeof assetValue !== "object") {
          pushIssue(issues, {
            code: "required",
            path,
            message: "Expected an environment asset.",
          });
          valid = false;
          continue;
        }
        if (validateKebabId(assetValue.id, `${path}.id`, issues)) {
          if (environmentAssetIds.has(assetValue.id)) {
            pushIssue(issues, {
              code: "duplicate-id",
              path: `${path}.id`,
              message: `Duplicate environment asset '${assetValue.id}' is not allowed.`,
            });
            valid = false;
          }
          environmentAssetIds.add(assetValue.id);
        } else {
          valid = false;
        }
        if (typeof assetValue.kind !== "string" || !ENVIRONMENT_ASSET_KINDS.has(assetValue.kind)) {
          pushIssue(issues, {
            code: "invalid-value",
            path: `${path}.kind`,
            message: "environment asset kind is not supported.",
          });
          valid = false;
        }
        if (typeof assetValue.url !== "string" || assetValue.url.trim().length === 0) {
          pushIssue(issues, {
            code: "invalid-type",
            path: `${path}.url`,
            message: "environment asset url must be a non-empty string.",
          });
          valid = false;
        }
        for (const key of ["textureRequired", "normalTextureRequired", "groundLocked"] as const) {
          if (!validateOptionalBoolean(assetValue[key], `${path}.${key}`, issues)) {
            valid = false;
          }
        }
      }
    }
  } else if (professionalMode) {
    pushIssue(issues, {
      code: "required",
      path: "$.environmentAssets",
      message: "professional WebGPU animation manifests must declare textured environment assets.",
    });
    valid = false;
  }

  if (value.environmentInstances !== undefined) {
    if (!Array.isArray(value.environmentInstances)) {
      pushIssue(issues, {
        code: "invalid-type",
        path: "$.environmentInstances",
        message: "environmentInstances must be an array.",
      });
      valid = false;
    } else {
      const instanceIds = new Set<string>();
      for (const [index, instance] of value.environmentInstances.entries()) {
        const instanceValue = instance as Record<string, unknown>;
        const path = `$.environmentInstances[${index}]`;
        if (!instanceValue || typeof instanceValue !== "object") {
          pushIssue(issues, {
            code: "required",
            path,
            message: "Expected an environment instance.",
          });
          valid = false;
          continue;
        }
        if (validateKebabId(instanceValue.id, `${path}.id`, issues)) {
          if (instanceIds.has(instanceValue.id)) {
            pushIssue(issues, {
              code: "duplicate-id",
              path: `${path}.id`,
              message: `Duplicate environment instance '${instanceValue.id}' is not allowed.`,
            });
            valid = false;
          }
          instanceIds.add(instanceValue.id);
        } else {
          valid = false;
        }
        if (!validateKebabId(instanceValue.assetId, `${path}.assetId`, issues)) {
          valid = false;
        } else if (environmentAssetIds.size > 0 && !environmentAssetIds.has(instanceValue.assetId)) {
          pushIssue(issues, {
            code: "missing-reference",
            path: `${path}.assetId`,
            message: `environment instance assetId '${instanceValue.assetId}' is not declared in environmentAssets.`,
          });
          valid = false;
        }
        if (!validateVector3(instanceValue.position, `${path}.position`, issues)) {
          valid = false;
        }
        if (instanceValue.rotation !== undefined && !validateVector3(instanceValue.rotation, `${path}.rotation`, issues)) {
          valid = false;
        }
        if (instanceValue.scale !== undefined && !validateVector3(instanceValue.scale, `${path}.scale`, issues)) {
          valid = false;
        }
      }
    }
  } else if (professionalMode) {
    pushIssue(issues, {
      code: "required",
      path: "$.environmentInstances",
      message: "professional WebGPU animation manifests must declare deterministic environment instances.",
    });
    valid = false;
  }

  const qualityGates = value.qualityGates as Record<string, unknown> | undefined;
  if (qualityGates !== undefined) {
    if (!qualityGates || typeof qualityGates !== "object") {
      pushIssue(issues, {
        code: "invalid-type",
        path: "$.qualityGates",
        message: "qualityGates must be an object.",
      });
      valid = false;
    } else {
      if (!Number.isInteger(qualityGates.minCharacterTextureCount) || (qualityGates.minCharacterTextureCount as number) < 1) {
        pushIssue(issues, {
          code: "invalid-value",
          path: "$.qualityGates.minCharacterTextureCount",
          message: "qualityGates minCharacterTextureCount must be a positive integer.",
        });
        valid = false;
      }
      for (const key of ["requireNormalTexture", "requireSkinnedCharacter", "requireTexturedEnvironment", "disallowProxyRenderer", "requireShadows"] as const) {
        if (!validateOptionalBoolean(qualityGates[key], `$.qualityGates.${key}`, issues)) {
          valid = false;
        }
      }
    }
  } else if (professionalMode) {
    pushIssue(issues, {
      code: "required",
      path: "$.qualityGates",
      message: "professional WebGPU animation manifests must declare quality gates.",
    });
    valid = false;
  }

  if (professionalMode && qualityGates) {
    for (const [key, expected] of [
      ["requireNormalTexture", true],
      ["requireSkinnedCharacter", true],
      ["requireTexturedEnvironment", true],
      ["disallowProxyRenderer", true],
    ] as const) {
      if (qualityGates[key] !== expected) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `$.qualityGates.${key}`,
          message: "professional WebGPU animation manifests must enable required quality gates.",
        });
        valid = false;
      }
    }
  }

  return valid
    ? {
        valid: true,
        issues,
        value: manifest as SceneAnimationAdventureManifest,
      }
    : { valid: false, issues };
}

export function createSceneAnimationAdventureManifest(
  manifest: SceneAnimationAdventureManifest,
): SceneAnimationAdventureManifest {
  const validation = validateSceneAnimationAdventureManifest(manifest);
  if (!validation.valid || !validation.value) {
    const summary = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid scene animation adventure manifest. ${summary}`);
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
