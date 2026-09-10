import { randomFor } from '../utils/random';

export const PLACEMENT_CHUNK_SIZE = 2;
export const PLACEMENT_CELL_SIZE = 0.08;
const MOUND_SPACING_X = 0.046;
const MOUND_SPACING_Y = 0.026;
const MOUND_SPACING_Z = 0.036;
export const MOUND_HEIGHT_RATIO = 1;

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

export interface MoundPlacementOptions {
  generation: number;
  globalSeed: number;
  density: number;
  clusterRadius: number;
  innerRadius: number;
  pileHeight: number;
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
  const cellsPerSide = Math.ceil(PLACEMENT_CHUNK_SIZE / PLACEMENT_CELL_SIZE);
  const originX = chunkX * PLACEMENT_CHUNK_SIZE;
  const originZ = chunkZ * PLACEMENT_CHUNK_SIZE;
  const radiusSquared = clusterRadius * clusterRadius;

  for (let row = 0; row < cellsPerSide && result.length < maxInstances; row += 1) {
    for (let column = 0; column < cellsPerSide && result.length < maxInstances; column += 1) {
      if (random.next() > density) {
        continue;
      }
      const x = originX + (column + 0.5) * PLACEMENT_CELL_SIZE + random.signed(0.012);
      const z = originZ + (row + 0.5) * PLACEMENT_CELL_SIZE + random.signed(0.012);
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

export function estimateMoundRadius(instanceCount: number, density: number, innerRadius: number): number {
  const safeCount = Math.max(0, Math.floor(instanceCount));
  const safeDensity = Math.max(0.05, Math.min(1, density));
  const cellVolume = MOUND_SPACING_X * MOUND_SPACING_Y * MOUND_SPACING_Z;
  const requiredVolume = safeCount * cellVolume / safeDensity;
  const physicalCoreVolume = Math.PI * innerRadius ** 3 * MOUND_HEIGHT_RATIO / 3;
  return Math.cbrt(3 * (requiredVolume + physicalCoreVolume) / (Math.PI * MOUND_HEIGHT_RATIO)) * 1.08;
}

export function generateMoundPlacement(options: MoundPlacementOptions): PlacementInstance[] {
  const {
    generation,
    globalSeed,
    density,
    clusterRadius,
    innerRadius,
    pileHeight,
    maxInstances,
    centerX = 0,
    centerZ = 0,
  } = options;
  const candidates: Array<{ order: number; placement: PlacementInstance }> = [];
  const layerCount = Math.max(1, Math.floor(pileHeight / MOUND_SPACING_Y));
  for (let layer = 0; layer <= layerCount; layer += 1) {
    const layerHeight = layer * MOUND_SPACING_Y;
    const layerRadius = clusterRadius * Math.max(0, 1 - layerHeight / pileHeight);
    const rowCount = Math.ceil(layerRadius / MOUND_SPACING_Z);
    const columnCount = Math.ceil(layerRadius / MOUND_SPACING_X);
    for (let row = -rowCount; row <= rowCount; row += 1) {
      for (let column = -columnCount; column <= columnCount; column += 1) {
        const random = randomFor(globalSeed, generation, layer, row, column);
        if (random.next() > density) {
          continue;
        }
        const localX = column * MOUND_SPACING_X + ((row + layer) & 1) * MOUND_SPACING_X * 0.5 + random.signed(0.004);
        const localZ = row * MOUND_SPACING_Z + random.signed(0.004);
        const distance = Math.hypot(localX, localZ);
        if (distance > layerRadius) {
          continue;
        }
        const x = centerX + localX;
        const z = centerZ + localZ;
        const physicalDistance = Math.hypot(x, z);
        const physicalCoreHeight = innerRadius * MOUND_HEIGHT_RATIO * Math.max(0, 1 - physicalDistance / innerRadius);
        if (physicalDistance < innerRadius && layerHeight < physicalCoreHeight) {
          continue;
        }
        const variation = random.next();
        candidates.push({
          order: random.next(),
          placement: {
            x,
            y: 0.015 + layerHeight + random.signed(0.002),
            z,
            rotationY: random.range(0, Math.PI * 2),
            scale: random.range(0.95, 1.05) * (1 + Math.max(0, 1 - distance / clusterRadius) * 0.04),
            variation,
          },
        });
      }
    }
  }
  candidates.sort((a, b) => a.order - b.order);
  return candidates.slice(0, maxInstances).map((candidate) => candidate.placement);
}

export function placementForWorldPosition(x: number, z: number, generation: number, globalSeed: number): PlacementInstance {
  const random = randomFor(globalSeed, Math.floor(x / PLACEMENT_CELL_SIZE), Math.floor(z / PLACEMENT_CELL_SIZE), generation);
  return {
    x,
    y: 0.015,
    z,
    rotationY: random.range(0, Math.PI * 2),
    scale: random.range(0.95, 1.05),
    variation: random.next(),
  };
}
