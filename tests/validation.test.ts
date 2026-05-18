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
});
