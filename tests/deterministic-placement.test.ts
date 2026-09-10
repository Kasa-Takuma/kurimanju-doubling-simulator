import { describe, expect, it } from 'vitest';
import {
  estimateMoundRadius,
  generateChunkPlacement,
  generateMoundPlacement,
  MOUND_HEIGHT_RATIO,
} from '../src/kurimanju/KurimanjuPlacement';

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

  it('joins the Stage B mound to the physical core without a camera-relative hole', () => {
    const density = 0.605;
    const innerRadius = 0.5;
    const maxInstances = 8192 - 1024;
    const clusterRadius = estimateMoundRadius(maxInstances, density, innerRadius);
    const centerZ = Math.min(0, innerRadius - clusterRadius);
    const options = {
      generation: 13,
      globalSeed: 0x4b555249,
      density,
      clusterRadius,
      innerRadius,
      pileHeight: clusterRadius * MOUND_HEIGHT_RATIO,
      maxInstances,
      centerZ,
    };
    const placements = generateMoundPlacement(options);

    expect(placements).toHaveLength(maxInstances);
    expect(placements).toEqual(generateMoundPlacement(options));
    expect(Math.max(...placements.map((placement) => Math.hypot(placement.x, placement.z)))).toBeLessThan(1.5);
    expect(Math.max(...placements.map((placement) => placement.z))).toBeLessThan(0.51);
    expect(Math.max(...placements.map((placement) => placement.y))).toBeGreaterThan(0.5);
  });
});
