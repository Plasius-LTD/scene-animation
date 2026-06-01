import { describe, expect, it } from "vitest";
import {
  SCENE_ANIMATION_PALETTE_LOADER_FLAG_ID,
  SCENE_ANIMATION_SCHEMA_VERSION,
  createSceneAnimationManifest,
  resolveSceneAnimationClip,
  type SceneAnimationManifest,
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
