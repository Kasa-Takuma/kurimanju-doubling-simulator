export interface LODThresholds {
  lod0: number;
  lod1: number;
  lod2: number;
  hysteresis: number;
}

// The source distance profile was authored for a one-metre-class model.
// Scale it by the measured 6.5 cm long axis of the Kurimanju asset.
export const KURIMANJU_MODEL_LENGTH_M = 0.065;

export const DEFAULT_LOD_THRESHOLDS: LODThresholds = {
  lod0: 3 * KURIMANJU_MODEL_LENGTH_M,
  lod1: 12 * KURIMANJU_MODEL_LENGTH_M,
  lod2: 40 * KURIMANJU_MODEL_LENGTH_M,
  hysteresis: 1.5 * KURIMANJU_MODEL_LENGTH_M,
};

export type LODLevel = 0 | 1 | 2 | 3;

export function lodThresholdsForCount(instanceCount: number): LODThresholds {
  const safeCount = Math.max(0, Math.floor(Number.isFinite(instanceCount) ? instanceCount : 0));
  const scale = safeCount <= 1024
    ? 1
    : safeCount <= 4096
      ? 0.8
      : safeCount <= 16000
        ? 0.6
        : 0.45;
  return {
    lod0: DEFAULT_LOD_THRESHOLDS.lod0 * scale,
    lod1: DEFAULT_LOD_THRESHOLDS.lod1 * scale,
    lod2: DEFAULT_LOD_THRESHOLDS.lod2 * scale,
    hysteresis: DEFAULT_LOD_THRESHOLDS.hysteresis * scale,
  };
}

export function selectLOD(distance: number, previous: LODLevel | null, thresholds = DEFAULT_LOD_THRESHOLDS): LODLevel {
  const safeDistance = Math.max(0, distance);
  if (previous === 0 && safeDistance < thresholds.lod0 + thresholds.hysteresis) {
    return 0;
  }
  if (previous === 1 && safeDistance >= thresholds.lod0 - thresholds.hysteresis && safeDistance < thresholds.lod1 + thresholds.hysteresis) {
    return 1;
  }
  if (previous === 2 && safeDistance >= thresholds.lod1 - thresholds.hysteresis && safeDistance < thresholds.lod2 + thresholds.hysteresis) {
    return 2;
  }
  if (previous === 3 && safeDistance >= thresholds.lod2 - thresholds.hysteresis) {
    return 3;
  }
  if (safeDistance < thresholds.lod0) {
    return 0;
  }
  if (safeDistance < thresholds.lod1) {
    return 1;
  }
  if (safeDistance < thresholds.lod2) {
    return 2;
  }
  return 3;
}
