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
