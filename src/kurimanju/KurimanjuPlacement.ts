import { randomFor } from '../utils/random';

export const PLACEMENT_CHUNK_SIZE = 32;
const CELL_SIZE = 0.08;

export interface PlacementInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
  variation: number;
}

export interface PlacementOptions {
  chunkX: number;
  chunkZ: number;
  generation: number;
  globalSeed: number;
  density: number;
  clusterRadius: number;
  maxInstances: number;
  centerX?: number;
  centerZ?: number;
}

export function generateChunkPlacement(options: PlacementOptions): PlacementInstance[] {
  const {
    chunkX,
    chunkZ,
    generation,
    globalSeed,
    density,
    clusterRadius,
    maxInstances,
    centerX = 0,
    centerZ = 0,
  } = options;
  const random = randomFor(globalSeed, chunkX, chunkZ, generation);
  const result: PlacementInstance[] = [];
  const cellsPerSide = Math.ceil(PLACEMENT_CHUNK_SIZE / CELL_SIZE);
  const originX = chunkX * PLACEMENT_CHUNK_SIZE;
  const originZ = chunkZ * PLACEMENT_CHUNK_SIZE;
  const radiusSquared = clusterRadius * clusterRadius;

  for (let row = 0; row < cellsPerSide && result.length < maxInstances; row += 1) {
    for (let column = 0; column < cellsPerSide && result.length < maxInstances; column += 1) {
      if (random.next() > density) {
        continue;
      }
      const x = originX + (column + 0.5) * CELL_SIZE + random.signed(0.012);
      const z = originZ + (row + 0.5) * CELL_SIZE + random.signed(0.012);
      const offsetX = x - centerX;
      const offsetZ = z - centerZ;
      if (offsetX * offsetX + offsetZ * offsetZ > radiusSquared) {
        continue;
      }
      result.push({
        x,
        y: 0.015 + random.signed(0.001),
        z,
        rotationY: random.range(0, Math.PI * 2),
        scale: random.range(0.95, 1.05),
        variation: random.next(),
      });
    }
  }
  return result;
}

export function placementForWorldPosition(x: number, z: number, generation: number, globalSeed: number): PlacementInstance {
  const random = randomFor(globalSeed, Math.floor(x / CELL_SIZE), Math.floor(z / CELL_SIZE), generation);
  return {
    x,
    y: 0.015,
    z,
    rotationY: random.range(0, Math.PI * 2),
    scale: random.range(0.95, 1.05),
    variation: random.next(),
  };
}
