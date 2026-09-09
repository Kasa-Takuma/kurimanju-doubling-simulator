import { describe, expect, it } from 'vitest';
import { selectLOD } from '../src/kurimanju/KurimanjuLOD';

describe('LOD selection', () => {
  it('selects four distance ranges', () => {
    expect(selectLOD(1, null)).toBe(0);
    expect(selectLOD(6, null)).toBe(1);
    expect(selectLOD(20, null)).toBe(2);
    expect(selectLOD(60, null)).toBe(3);
  });

  it('uses hysteresis around a previous level', () => {
    expect(selectLOD(3.8, 0)).toBe(0);
    expect(selectLOD(3.8, 1)).toBe(1);
  });
});
