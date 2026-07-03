import { describe, expect, it } from "vitest";
import {
  SCENE_ANIMATION_PALETTE_LOADER_FLAG_ID,
  SCENE_ANIMATION_ADVENTURE_FLAG_ID,
  SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION,
  SCENE_ANIMATION_PROFESSIONAL_ADVENTURE_FLAG_ID,
  SCENE_ANIMATION_SCHEMA_VERSION,
  createSceneAnimationAdventureManifest,
  createSceneAnimationManifest,
  resolveSceneAnimationClip,
  type SceneAnimationAdventureManifest,
  type SceneAnimationManifest,
  validateSceneAnimationAdventureManifest,
  validateSceneAnimationManifest,
  validateSceneAnimationPlaybackState,
  resolveSceneAnimationPlaylist,
} from "../src/index.js";

const baseManifest: SceneAnimationManifest = {
  schemaVersion: SCENE_ANIMATION_SCHEMA_VERSION,
  paletteId: "hero-palette",
  paletteVersion: "1.0.0",
  clips: [
    {
      id: "walk",
      durationMs: 1000,
      loop: true,
      targets: ["hero", "npc"],
      frames: [
        { timeMs: 0, value: [0, 0, 0] },
        { timeMs: 500, value: [1, 0, 0], easing: "ease-in" },
        { timeMs: 1000, value: [2, 0, 0] },
      ],
    },
  ],
};

const farmAdventureManifest: SceneAnimationAdventureManifest = {
  schemaVersion: SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION,
  adventureId: "farm-adventure",
  characterId: "peasant-girl",
  modelUrl: "/gpu-demo/animation-models/peasant-girl/peasant-girl.glb",
  clips: [
    { id: "female-basic-locomotion-idle", category: "idle", rootTranslation: false },
    { id: "female-basic-locomotion-walking", category: "locomotion", rootTranslation: true },
    { id: "farming-dig-and-plant-seeds", category: "action" },
    { id: "farming-watering", category: "action" },
    { id: "farming-pick-fruit", category: "action" },
    { id: "female-basic-locomotion-jump", category: "locomotion", rootTranslation: true },
    { id: "gestures-basic-happy-hand-gesture", category: "modifier" },
  ],
  route: [
    { id: "gate", position: [0, 0, 0], arriveMs: 0 },
    { id: "crop-row", position: [3, 0, 1], arriveMs: 3200 },
    { id: "ditch", position: [5, 0, 1.5], arriveMs: 9200 },
    { id: "cart", position: [7, 0, 0], arriveMs: 12800 },
  ],
  beats: [
    {
      id: "idle-at-gate",
      order: 0,
      kind: "idle",
      clipId: "female-basic-locomotion-idle",
      durationMs: 1200,
      pathPointId: "gate",
      rootMotion: "in-place",
      blend: { inMs: 0, outMs: 240 },
    },
    {
      id: "walk-to-crops",
      order: 1,
      kind: "locomotion",
      clipId: "female-basic-locomotion-walking",
      durationMs: 3200,
      pathPointId: "crop-row",
      rootMotion: "prefer-root-motion",
      blend: { inMs: 180, outMs: 220 },
    },
    {
      id: "dig-and-plant",
      order: 2,
      kind: "action",
      clipId: "farming-dig-and-plant-seeds",
      durationMs: 1800,
      pathPointId: "crop-row",
      rootMotion: "in-place",
      blend: { inMs: 160, outMs: 160 },
    },
  ],
  camera: {
    mode: "lagged-follow",
    cubicBezier: [0.22, 0.61, 0.36, 1],
    lagMs: 240,
    lookAheadMs: 320,
    offset: [0, 2.4, 5.5],
  },
  props: {
    seed: 12_084,
    bounds: {
      min: [-8, -1, -8],
      max: [8, 4, 8],
    },
    kinds: ["crop-row", "fence-segment", "crate", "cart", "small-tree", "path-marker"],
  },
};

const rootMotionProfile = {
  motionMode: "root-authored" as const,
  rootTranslationDistance: 2.4,
  durationMs: 1200,
  expectedSpeed: 2,
  strideLength: 1.2,
  footContactWindows: [
    { startMs: 120, endMs: 260, foot: "left" as const },
    { startMs: 680, endMs: 820, foot: "right" as const },
  ],
  verticalBounds: { min: 0, max: 0.08 },
  loopable: true,
  worldDisplacementAllowed: true,
  footSlideTolerancePassed: true,
};

const stationaryProfile = {
  motionMode: "stationary" as const,
  rootTranslationDistance: 0,
  durationMs: 1200,
  expectedSpeed: 0,
  strideLength: 0,
  footContactWindows: [],
  verticalBounds: { min: 0, max: 0.05 },
  loopable: true,
  worldDisplacementAllowed: false,
  footSlideTolerancePassed: true,
};

const professionalAdventureManifest: SceneAnimationAdventureManifest = {
  ...farmAdventureManifest,
  renderMode: "webgpu-pbr",
  motionPolicy: "root-motion-required",
  clips: [
    {
      id: "female-basic-locomotion-idle",
      category: "idle",
      rootTranslation: false,
      movementProfile: stationaryProfile,
    },
    {
      id: "female-basic-locomotion-walking",
      category: "locomotion",
      rootTranslation: true,
      movementProfile: rootMotionProfile,
    },
  ],
  beats: [
    {
      ...farmAdventureManifest.beats[0]!,
      movementRequirement: { kind: "stationary" },
    },
    {
      ...farmAdventureManifest.beats[1]!,
      rootMotion: "force-root-motion",
      movementRequirement: {
        kind: "travel",
        distanceMeters: 2.4,
        directionToleranceDegrees: 12,
        minSpeed: 1.5,
        maxSpeed: 2.4,
        loopPolicy: "loop-to-distance",
      },
    },
  ],
  camera: {
    mode: "cinematic-follow",
    cubicBezier: [0.22, 0.61, 0.36, 1],
    lagMs: 240,
    lookAheadMs: 320,
    offset: [0, 2.4, 5.5],
    shoulderOffset: [-0.9, 2.2, 4.8],
    velocityLookAheadMs: 420,
    yawSmoothingMs: 180,
    pitchSmoothingMs: 240,
    deadZoneRadius: 0.4,
    maxLagDistance: 2.8,
  },
  environmentAssets: [
    {
      id: "farm-terrain",
      kind: "terrain",
      url: "/gpu-demo/animation-environment/farm-terrain.glb",
      textureRequired: true,
      normalTextureRequired: true,
      groundLocked: true,
    },
    {
      id: "crop-row-asset",
      kind: "crop-row",
      url: "/gpu-demo/animation-environment/crop-row.glb",
      textureRequired: true,
      groundLocked: true,
    },
  ],
  environmentInstances: [
    { id: "terrain-main", assetId: "farm-terrain", position: [0, 0, 0] },
    { id: "crop-row-a", assetId: "crop-row-asset", position: [3, 0, 1], scale: [1, 1, 1] },
  ],
  qualityGates: {
    minCharacterTextureCount: 2,
    requireNormalTexture: true,
    requireSkinnedCharacter: true,
    requireTexturedEnvironment: true,
    disallowProxyRenderer: true,
    requireShadows: true,
  },
};

describe("scene animation manifest validation", () => {
  it("accepts valid manifests", () => {
    const result = validateSceneAnimationManifest(baseManifest);
    expect(result.valid).toBe(true);
    expect(result.value?.paletteId).toBe("hero-palette");
  });

  it("exports parent rollout flag", () => {
    expect(SCENE_ANIMATION_PALETTE_LOADER_FLAG_ID).toBe(
      "scene.animation.palette-loader.enabled",
    );
  });

  it("exports animation adventure rollout flag", () => {
    expect(SCENE_ANIMATION_ADVENTURE_FLAG_ID).toBe(
      "gpu-demo.animation-adventure.enabled",
    );
  });

  it("exports professional animation adventure rollout flag", () => {
    expect(SCENE_ANIMATION_PROFESSIONAL_ADVENTURE_FLAG_ID).toBe(
      "gpu-demo.animation-adventure.professional.enabled",
    );
  });

  it("throws on invalid clip references when resolving", () => {
    const result = resolveSceneAnimationClip({ manifest: baseManifest, clipId: "run" });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-reference", path: "$.clipId" }),
      ]),
    );
  });

  it("can create canonical manifest", () => {
    const created = createSceneAnimationManifest(baseManifest);
    expect(created.clips).toHaveLength(1);
  });

  it("throws with validation details when creating invalid manifests", () => {
    expect(() =>
      createSceneAnimationManifest({
        ...baseManifest,
        clips: [],
      }),
    ).toThrow("manifest must include at least one clip");
  });

  it("validates playback state", () => {
    const stateResult = validateSceneAnimationPlaybackState({
      schemaVersion: "1.0.0",
      objectId: "hero",
      paletteId: "hero-palette",
      clipId: "walk",
      mode: "playing",
      positionMs: 200,
      speed: 1,
      loopsCompleted: 0,
    });

    expect(stateResult.valid).toBe(true);
  });

  it("rejects missing playback state objects", () => {
    const stateResult = validateSceneAnimationPlaybackState(undefined);

    expect(stateResult.valid).toBe(false);
    expect(stateResult.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$" }),
    ]);
  });

  it("reports all invalid playback state fields", () => {
    const stateResult = validateSceneAnimationPlaybackState({
      schemaVersion: "0.1.0",
      objectId: 17,
      paletteId: "Hero Palette",
      clipId: undefined,
      mode: 42,
      positionMs: -1,
      speed: 0,
    });

    expect(stateResult.valid).toBe(false);
    expect(stateResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.schemaVersion" }),
        expect.objectContaining({ code: "invalid-type", path: "$.objectId" }),
        expect.objectContaining({ code: "invalid-id", path: "$.paletteId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clipId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.mode" }),
        expect.objectContaining({ code: "invalid-type", path: "$.positionMs" }),
        expect.objectContaining({ code: "invalid-value", path: "$.speed" }),
      ]),
    );
  });

  it("rejects missing manifest objects", () => {
    const invalid = validateSceneAnimationManifest(null);

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$" }),
    ]);
  });

  it("reports invalid top-level manifest fields", () => {
    const invalid = validateSceneAnimationManifest({
      schemaVersion: "0.1.0",
      paletteId: "Hero Palette",
      paletteVersion: " ",
      clips: [],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.schemaVersion" }),
        expect.objectContaining({ code: "invalid-id", path: "$.paletteId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.paletteVersion" }),
        expect.objectContaining({ code: "required", path: "$.clips" }),
      ]),
    );
  });

  it("reports malformed clip frames, targets, and duplicate clip ids", () => {
    const invalid = validateSceneAnimationManifest({
      ...baseManifest,
      clips: [
        {
          id: "walk",
          durationMs: Number.NaN,
          loop: true,
          targets: ["hero", "hero", "Hero"],
          frames: [
            null,
            { timeMs: -1, value: [0, 0] },
            { timeMs: 10, value: [0, Number.POSITIVE_INFINITY, 0] },
          ],
        },
        {
          ...baseManifest.clips[0]!,
          id: "walk",
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.clips[0].durationMs" }),
        expect.objectContaining({ code: "required", path: "$.clips[0].frames[0]" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[0].frames[1].timeMs" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[0].frames[1].value" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[0].frames[2].value" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.clips[0].targets[1]" }),
        expect.objectContaining({ code: "invalid-id", path: "$.clips[0].targets[2]" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.clips[1].id" }),
      ]),
    );
  });

  it("requires clip frames and targets", () => {
    const invalid = validateSceneAnimationManifest({
      ...baseManifest,
      clips: [
        {
          ...baseManifest.clips[0]!,
          frames: [],
          targets: [],
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.clips[0].frames" }),
        expect.objectContaining({ code: "required", path: "$.clips[0].targets" }),
      ]),
    );
  });

  it("rejects non-object clip entries", () => {
    const invalid = validateSceneAnimationManifest({
      ...baseManifest,
      clips: [undefined],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.clips[0]" }),
    ]);
  });

  it("invalidates a non-monotonic frame sequence", () => {
    const invalid = validateSceneAnimationManifest({
      ...baseManifest,
      clips: [
        {
          ...baseManifest.clips[0]!,
          frames: [
            { timeMs: 500, value: [0, 0, 0] },
            { timeMs: 250, value: [1, 0, 0] },
          ],
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.clips[0].frames[1].timeMs" }),
      ]),
    );
  });

  it("resolves a clip from a valid manifest", () => {
    const result = resolveSceneAnimationClip({ manifest: baseManifest, clipId: "walk" });

    expect(result.valid).toBe(true);
    expect(result.value?.clip.id).toBe("walk");
  });

  it("returns manifest validation issues when resolving a clip from an invalid manifest", () => {
    const result = resolveSceneAnimationClip({
      manifest: {
        ...baseManifest,
        clips: [],
      },
      clipId: "walk",
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.clips" }),
    ]);
  });

  it("resolves a playlist and validates missing fallback clips", () => {
    const playlist = resolveSceneAnimationPlaylist(
      baseManifest,
      {
        sequence: ["walk"],
        loop: true,
        fallbackClipId: "missing",
      },
    );

    expect(playlist.valid).toBe(false);
    expect(playlist.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-reference", path: "$.fallbackClipId" }),
      ]),
    );
  });

  it("resolves playlist sequences in order", () => {
    const playlist = resolveSceneAnimationPlaylist(
      baseManifest,
      {
        sequence: ["walk"],
        loop: false,
      },
    );

    expect(playlist.valid).toBe(true);
    expect(playlist.value).toEqual([baseManifest.clips[0]]);
  });

  it("reports playlist sequence entries missing from the manifest", () => {
    const playlist = resolveSceneAnimationPlaylist(
      baseManifest,
      {
        sequence: ["run"],
        loop: false,
      },
    );

    expect(playlist.valid).toBe(false);
    expect(playlist.issues).toEqual([
      expect.objectContaining({ code: "missing-reference", path: "$.sequence[0]" }),
    ]);
  });

  it("returns manifest validation issues when resolving playlists from invalid manifests", () => {
    const playlist = resolveSceneAnimationPlaylist(
      {
        ...baseManifest,
        clips: [],
      },
      {
        sequence: ["walk"],
        loop: false,
      },
    );

    expect(playlist.valid).toBe(false);
    expect(playlist.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.clips" }),
    ]);
  });
});

describe("scene animation adventure manifest validation", () => {
  it("rejects missing adventure manifests", () => {
    const invalid = validateSceneAnimationAdventureManifest(undefined);

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$" }),
    ]);
  });

  it("accepts the farm adventure manifest contract", () => {
    const result = validateSceneAnimationAdventureManifest(farmAdventureManifest);

    expect(result.valid).toBe(true);
    expect(result.value?.camera).toEqual(
      expect.objectContaining({
        mode: "lagged-follow",
        cubicBezier: [0.22, 0.61, 0.36, 1],
        lagMs: 240,
        lookAheadMs: 320,
      }),
    );
  });

  it("accepts the professional WebGPU farm adventure contract", () => {
    const result = validateSceneAnimationAdventureManifest(professionalAdventureManifest);

    expect(result.valid).toBe(true);
    expect(result.value).toEqual(
      expect.objectContaining({
        renderMode: "webgpu-pbr",
        motionPolicy: "root-motion-required",
      }),
    );
  });

  it("rejects professional manifests without required quality gates and environment assets", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...professionalAdventureManifest,
      environmentAssets: undefined,
      environmentInstances: undefined,
      qualityGates: {
        minCharacterTextureCount: 0,
        requireNormalTexture: false,
        requireSkinnedCharacter: true,
        requireTexturedEnvironment: false,
        disallowProxyRenderer: false,
      },
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.environmentAssets" }),
        expect.objectContaining({ code: "required", path: "$.environmentInstances" }),
        expect.objectContaining({ code: "invalid-value", path: "$.qualityGates.minCharacterTextureCount" }),
        expect.objectContaining({ code: "invalid-value", path: "$.qualityGates.requireNormalTexture" }),
        expect.objectContaining({ code: "invalid-value", path: "$.qualityGates.requireTexturedEnvironment" }),
        expect.objectContaining({ code: "invalid-value", path: "$.qualityGates.disallowProxyRenderer" }),
      ]),
    );
  });

  it("rejects professional travel beats that use calibrated in-place movement", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...professionalAdventureManifest,
      clips: [
        professionalAdventureManifest.clips[0],
        {
          id: "female-basic-locomotion-walking",
          category: "locomotion",
          rootTranslation: false,
          movementProfile: {
            ...rootMotionProfile,
            motionMode: "calibrated-in-place",
            rootTranslationDistance: 0,
            strideLength: 1,
          },
        },
      ],
      beats: [
        professionalAdventureManifest.beats[0],
        {
          ...professionalAdventureManifest.beats[1]!,
          rootMotion: "route-driven",
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].rootMotion" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].clipId" }),
      ]),
    );
  });

  it("rejects professional stationary beats with world-displacing clips", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...professionalAdventureManifest,
      clips: [
        {
          ...professionalAdventureManifest.clips[0]!,
          movementProfile: {
            ...stationaryProfile,
            worldDisplacementAllowed: true,
          },
        },
        professionalAdventureManifest.clips[1],
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "invalid-value", path: "$.beats[0].clipId" }),
    ]);
  });

  it("requires cinematic camera parameters for professional manifests", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...professionalAdventureManifest,
      camera: {
        ...farmAdventureManifest.camera,
      },
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.camera.mode" }),
        expect.objectContaining({ code: "invalid-type", path: "$.camera.shoulderOffset" }),
        expect.objectContaining({ code: "invalid-value", path: "$.camera.velocityLookAheadMs" }),
      ]),
    );
  });

  it("reports malformed professional movement, environment, and quality gate fields", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...professionalAdventureManifest,
      renderMode: "webgpu-pbr",
      motionPolicy: "legacy-compatible",
      clips: [
        {
          id: "Bad Clip",
          category: "idle",
          rootTranslation: "yes",
          movementProfile: null,
        },
        {
          id: "female-basic-locomotion-walking",
          category: "locomotion",
          rootTranslation: true,
          movementProfile: {
            motionMode: "root-authored",
            rootTranslationDistance: Number.NaN,
            durationMs: -1,
            expectedSpeed: -1,
            strideLength: -1,
            loopable: "yes",
            worldDisplacementAllowed: "yes",
            footSlideTolerancePassed: "yes",
            verticalBounds: { min: 2, max: 1 },
            footContactWindows: "none",
          },
        },
        {
          id: "missing-profile",
          category: "idle",
        },
      ],
      beats: [
        {
          ...professionalAdventureManifest.beats[0]!,
          clipId: "Bad Clip",
          movementRequirement: null,
        },
        {
          ...professionalAdventureManifest.beats[1]!,
          clipId: "female-basic-locomotion-walking",
          movementRequirement: {
            kind: "travel",
            distanceMeters: -1,
            directionToleranceDegrees: -1,
            minSpeed: -1,
            maxSpeed: -1,
            loopPolicy: "forever",
            verticalArc: { min: 2, max: 1 },
          },
        },
        {
          id: "missing-requirement",
          order: 2,
          kind: "idle",
          clipId: "missing-profile",
          durationMs: 1000,
          rootMotion: "in-place",
          blend: { inMs: 0, outMs: 0 },
        },
      ],
      environmentAssets: [
        null,
        {
          id: "farm-terrain",
          kind: "terrain",
          url: "/gpu-demo/animation-environment/farm-terrain.glb",
        },
        {
          id: "farm-terrain",
          kind: "bad-kind",
          url: " ",
          textureRequired: "yes",
          normalTextureRequired: "yes",
          groundLocked: "yes",
        },
      ],
      environmentInstances: [
        null,
        {
          id: "terrain-main",
          assetId: "farm-terrain",
          position: [0, 0, 0],
        },
        {
          id: "terrain-main",
          assetId: "missing-asset",
          position: [0, Number.NaN, 0],
          rotation: [0, 0],
          scale: [1, 1],
        },
      ],
      qualityGates: {
        minCharacterTextureCount: 1,
        requireNormalTexture: "yes",
        requireSkinnedCharacter: true,
        requireTexturedEnvironment: true,
        disallowProxyRenderer: true,
        requireShadows: "yes",
      },
    } as unknown as SceneAnimationAdventureManifest);

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.motionPolicy" }),
        expect.objectContaining({ code: "invalid-id", path: "$.clips[0].id" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[0].rootTranslation" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[0].movementProfile" }),
        expect.objectContaining({ code: "invalid-value", path: "$.clips[1].movementProfile.rootTranslationDistance" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[1].movementProfile.loopable" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[1].movementProfile.worldDisplacementAllowed" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[1].movementProfile.footSlideTolerancePassed" }),
        expect.objectContaining({ code: "invalid-value", path: "$.clips[1].movementProfile.verticalBounds" }),
        expect.objectContaining({ code: "invalid-type", path: "$.clips[1].movementProfile.footContactWindows" }),
        expect.objectContaining({ code: "required", path: "$.clips[2].movementProfile" }),
        expect.objectContaining({ code: "invalid-type", path: "$.beats[0].movementRequirement" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].movementRequirement.distanceMeters" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].movementRequirement.loopPolicy" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].movementRequirement.verticalArc" }),
        expect.objectContaining({ code: "required", path: "$.beats[2].movementRequirement" }),
        expect.objectContaining({ code: "required", path: "$.environmentAssets[0]" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.environmentAssets[2].id" }),
        expect.objectContaining({ code: "invalid-value", path: "$.environmentAssets[2].kind" }),
        expect.objectContaining({ code: "invalid-type", path: "$.environmentAssets[2].url" }),
        expect.objectContaining({ code: "invalid-type", path: "$.environmentAssets[2].textureRequired" }),
        expect.objectContaining({ code: "required", path: "$.environmentInstances[0]" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.environmentInstances[2].id" }),
        expect.objectContaining({ code: "missing-reference", path: "$.environmentInstances[2].assetId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.environmentInstances[2].position" }),
        expect.objectContaining({ code: "invalid-type", path: "$.environmentInstances[2].rotation" }),
        expect.objectContaining({ code: "invalid-type", path: "$.environmentInstances[2].scale" }),
        expect.objectContaining({ code: "invalid-type", path: "$.qualityGates.requireNormalTexture" }),
        expect.objectContaining({ code: "invalid-type", path: "$.qualityGates.requireShadows" }),
      ]),
    );
  });

  it("rejects unsupported professional render and motion policy values", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      renderMode: "sprites",
      motionPolicy: "teleport",
    } as unknown as SceneAnimationAdventureManifest);

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.renderMode" }),
        expect.objectContaining({ code: "invalid-value", path: "$.motionPolicy" }),
      ]),
    );
  });

  it("rejects non-array environment instances and non-object quality gates", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...professionalAdventureManifest,
      environmentInstances: "instances",
      qualityGates: "strict",
    } as unknown as SceneAnimationAdventureManifest);

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-type", path: "$.environmentInstances" }),
        expect.objectContaining({ code: "invalid-type", path: "$.qualityGates" }),
      ]),
    );
  });

  it("creates canonical adventure manifests", () => {
    const created = createSceneAnimationAdventureManifest(farmAdventureManifest);

    expect(created.adventureId).toBe("farm-adventure");
  });

  it("throws with validation details when creating invalid adventure manifests", () => {
    expect(() =>
      createSceneAnimationAdventureManifest({
        ...farmAdventureManifest,
        beats: [],
      }),
    ).toThrow("adventure manifest must include scripted beats");
  });

  it("reports invalid top-level adventure fields and missing sections", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      schemaVersion: "0.1.0",
      adventureId: "Farm Adventure",
      characterId: 42,
      modelUrl: " ",
      clips: [],
      route: [],
      beats: [],
      camera: null,
      props: null,
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.schemaVersion" }),
        expect.objectContaining({ code: "invalid-id", path: "$.adventureId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.characterId" }),
        expect.objectContaining({ code: "invalid-type", path: "$.modelUrl" }),
        expect.objectContaining({ code: "required", path: "$.clips" }),
        expect.objectContaining({ code: "required", path: "$.route" }),
        expect.objectContaining({ code: "required", path: "$.beats" }),
        expect.objectContaining({ code: "required", path: "$.camera" }),
        expect.objectContaining({ code: "required", path: "$.props" }),
      ]),
    );
  });

  it("rejects malformed and duplicate adventure clip references", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      clips: [
        null,
        {
          id: "female-basic-locomotion-idle",
          category: "idle",
        },
        {
          id: "female-basic-locomotion-idle",
          category: "wrong",
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.clips[0]" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.clips[2].id" }),
        expect.objectContaining({ code: "invalid-value", path: "$.clips[2].category" }),
      ]),
    );
  });

  it("rejects missing clip references from beats", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      beats: [
        {
          ...farmAdventureManifest.beats[0]!,
          clipId: "missing-clip",
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "missing-reference", path: "$.beats[0].clipId" }),
    ]);
  });

  it("rejects non-continuous path timing and repeated positions", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      route: [
        farmAdventureManifest.route[0],
        {
          id: "bad-point",
          position: farmAdventureManifest.route[0]!.position,
          arriveMs: 0,
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.route[1].position" }),
        expect.objectContaining({ code: "invalid-value", path: "$.route[1].arriveMs" }),
      ]),
    );
  });

  it("rejects malformed route points and duplicate ids", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      route: [
        null,
        {
          id: "gate",
          position: [0, 0, 0],
          arriveMs: 0,
        },
        {
          id: "gate",
          position: [1, Number.NaN, 0],
          arriveMs: Number.POSITIVE_INFINITY,
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.route[0]" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.route[2].id" }),
        expect.objectContaining({ code: "invalid-type", path: "$.route[2].position" }),
        expect.objectContaining({ code: "invalid-value", path: "$.route[2].arriveMs" }),
      ]),
    );
  });

  it("rejects malformed beat ids, kinds, path references, root motion, and blends", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      beats: [
        null,
        {
          id: "idle-at-gate",
          order: -1,
          kind: "wrong",
          clipId: "Bad Clip",
          durationMs: 0,
          pathPointId: "missing-point",
          rootMotion: "teleport",
          blend: {
            inMs: -1,
            outMs: Number.NaN,
          },
        },
        {
          ...farmAdventureManifest.beats[0]!,
          order: 2,
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.beats[0]" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].order" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].kind" }),
        expect.objectContaining({ code: "invalid-id", path: "$.beats[1].clipId" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].durationMs" }),
        expect.objectContaining({ code: "missing-reference", path: "$.beats[1].pathPointId" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].rootMotion" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].blend.inMs" }),
        expect.objectContaining({ code: "invalid-value", path: "$.beats[1].blend.outMs" }),
        expect.objectContaining({ code: "duplicate-id", path: "$.beats[2].id" }),
      ]),
    );
  });

  it("rejects missing beat blend windows", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      beats: [
        {
          ...farmAdventureManifest.beats[0]!,
          blend: undefined,
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.beats[0].blend" }),
    ]);
  });

  it("rejects stale camera defaults and out-of-bounds prop seeds", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      camera: {
        ...farmAdventureManifest.camera,
        lagMs: 120,
      },
      props: {
        ...farmAdventureManifest.props,
        seed: -1,
      },
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.camera.lagMs" }),
        expect.objectContaining({ code: "invalid-value", path: "$.props.seed" }),
      ]),
    );
  });

  it("rejects invalid camera mode, bezier, look-ahead, and offset", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      camera: {
        mode: "snap",
        cubicBezier: [0.2, 0.6, 0.3, 1],
        lagMs: 240,
        lookAheadMs: 0,
        offset: [0, Number.POSITIVE_INFINITY, 1],
      },
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.camera.mode" }),
        expect.objectContaining({ code: "invalid-value", path: "$.camera.cubicBezier" }),
        expect.objectContaining({ code: "invalid-value", path: "$.camera.lookAheadMs" }),
        expect.objectContaining({ code: "invalid-type", path: "$.camera.offset" }),
      ]),
    );
  });

  it("rejects invalid prop bounds and kinds", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      props: {
        seed: 12,
        bounds: {
          min: [2, 0, 0],
          max: [1, 0, 3],
        },
        kinds: ["cart", "dragon"],
      },
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-value", path: "$.props.bounds" }),
        expect.objectContaining({ code: "invalid-value", path: "$.props.kinds[1]" }),
      ]),
    );
  });

  it("rejects missing prop bounds and kinds", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      props: {
        seed: 12,
      },
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.props.bounds" }),
        expect.objectContaining({ code: "required", path: "$.props.kinds" }),
      ]),
    );
  });

  it("rejects beats that are not in strict order", () => {
    const invalid = validateSceneAnimationAdventureManifest({
      ...farmAdventureManifest,
      beats: [
        farmAdventureManifest.beats[0],
        {
          ...farmAdventureManifest.beats[1]!,
          order: 0,
        },
      ],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual([
      expect.objectContaining({ code: "invalid-value", path: "$.beats[1].order" }),
    ]);
  });
});
