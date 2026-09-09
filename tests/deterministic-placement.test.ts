import { describe, expect, it } from 'vitest';
import { generateChunkPlacement } from '../src/kurimanju/KurimanjuPlacement';

describe('deterministic placement', () => {
  it('recreates the same chunk from the same inputs', () => {
    const options = {
      chunkX: -2,
      chunkZ: 4,
      generation: 24,
      globalSeed: 0x12345678,
      density: 0.8,
      clusterRadius: 220,
      maxInstances: 500,
    };
    expect(generateChunkPlacement(options)).toEqual(generateChunkPlacement(options));
  });

  it('keeps packed points within the requested cluster radius', () => {
    const placements = generateChunkPlacement({
      chunkX: 0,
      chunkZ: 0,
      generation: 22,
      globalSeed: 1,
      density: 1,
      clusterRadius: 5,
      maxInstances: 1000,
    });
    expect(placements.every((placement) => Math.hypot(placement.x, placement.z) <= 5)).toBe(true);
  });
});
