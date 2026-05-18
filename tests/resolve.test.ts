import { describe, expect, it } from "vitest";
import { toPlaybackFallback, type SceneAnimationManifest } from "../src/index.js";

const manifest: SceneAnimationManifest = {
  schemaVersion: "1.0.0",
  paletteId: "idle-palette",
  paletteVersion: "1.0.0",
  clips: [
    {
      id: "idle",
      durationMs: 2000,
      loop: true,
      targets: ["hero"],
      frames: [{ timeMs: 0, value: [0, 0, 0] }],
    },
  ],
};

describe("scene animation playback helpers", () => {
  it("creates fallback state from first clip", () => {
    const fallback = toPlaybackFallback(manifest);

    expect(fallback?.clipId).toBe("idle");
    expect(fallback?.mode).toBe("stopped");
    expect(fallback?.positionMs).toBe(0);
  });

  it("returns undefined fallback when no clips exist", () => {
    const none = toPlaybackFallback({
      schemaVersion: "1.0.0",
      paletteId: "empty",
      paletteVersion: "1.0.0",
      clips: [],
    });

    expect(none).toBeUndefined();
  });
});
