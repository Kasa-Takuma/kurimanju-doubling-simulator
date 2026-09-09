export interface LODThresholds {
  lod0: number;
  lod1: number;
  lod2: number;
  hysteresis: number;
}

export const DEFAULT_LOD_THRESHOLDS: LODThresholds = {
  lod0: 3,
  lod1: 12,
  lod2: 40,
  hysteresis: 1.5,
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
