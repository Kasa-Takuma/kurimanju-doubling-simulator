import { describe, expect, it } from 'vitest';
import { DEFAULT_LOD_THRESHOLDS, KURIMANJU_MODEL_LENGTH_M, selectLOD } from '../src/kurimanju/KurimanjuLOD';

describe('LOD selection', () => {
  it('scales distance ranges to the measured model size', () => {
    expect(KURIMANJU_MODEL_LENGTH_M).toBe(0.065);
    expect(DEFAULT_LOD_THRESHOLDS).toMatchObject({
      lod0: 0.195,
      lod1: 0.78,
      lod2: 2.6,
      hysteresis: 0.0975,
    });
    expect(selectLOD(0.1, null)).toBe(0);
    expect(selectLOD(0.5, null)).toBe(1);
    expect(selectLOD(1.5, null)).toBe(2);
    expect(selectLOD(3, null)).toBe(3);
  });

  it('uses hysteresis around a previous level', () => {
    expect(selectLOD(0.25, 0)).toBe(0);
    expect(selectLOD(0.35, 1)).toBe(1);
  });
});
