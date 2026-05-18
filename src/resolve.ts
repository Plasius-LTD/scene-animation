import { SceneAnimationManifest, SceneAnimationPlaybackState } from "./types.js";

export function toPlaybackFallback(manifest: SceneAnimationManifest): SceneAnimationPlaybackState | undefined {
  if (manifest.clips.length === 0) {
    return undefined;
  }

  const firstClip = manifest.clips[0]!;
  return {
    schemaVersion: "1.0.0",
    objectId: firstClip.targets[0] ?? "",
    paletteId: manifest.paletteId,
    clipId: firstClip.id,
    mode: "stopped",
    positionMs: 0,
    speed: 1,
    loopsCompleted: 0,
  };
}
