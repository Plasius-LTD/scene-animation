import { describe, expect, it } from "vitest";
import {
  SCENE_ANIMATION_PALETTE_LOADER_FLAG_ID,
  SCENE_ANIMATION_ADVENTURE_FLAG_ID,
  SCENE_ANIMATION_ADVENTURE_SCHEMA_VERSION,
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

  it("creates canonical adventure manifests", () => {
    const created = createSceneAnimationAdventureManifest(farmAdventureManifest);

    expect(created.adventureId).toBe("farm-adventure");
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
