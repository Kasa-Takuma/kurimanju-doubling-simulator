import { Scene, Vector3 } from 'three';
import { SimulationClockSnapshot } from '../simulation/SimulationClock';
import { randomFor } from '../utils/random';
import { KurimanjuAssetsResult } from './KurimanjuAssets';
import {
  estimatedVisibleCount,
  populationSnapshot,
  RepresentationStage,
} from './PopulationModel';
import { KURIMANJU_HALF_EXTENTS, KurimanjuPhysics, MAX_RAPIER_BODIES, PHYSICS_REGION_RADIUS, PhysicsBodyState, PhysicsStats } from './KurimanjuPhysics';
import { KurimanjuRenderer, KurimanjuRenderStats, RenderableInstance } from './KurimanjuRenderer';
import { generateChunkPlacement, PLACEMENT_CHUNK_SIZE } from './KurimanjuPlacement';

const GLOBAL_SEED = 0x4b555249;
const PHYSICAL_GENERATION_LIMIT = 10;
const CHUNK_SEARCH_LIMIT = 14;

interface PhysicalInstance {
  body: PhysicsBodyState;
  seed: number;
}

export interface KurimanjuSystemStats extends KurimanjuRenderStats, PhysicsStats {
  generation: number;
  stage: RepresentationStage;
  assetStatus: string;
}

export class KurimanjuSystem {
  readonly renderer: KurimanjuRenderer;
  private readonly physics: KurimanjuPhysics;
  private readonly physicalInstances: PhysicalInstance[] = [];
  private readonly proceduralInstances: RenderableInstance[] = [];
  private readonly renderInstances: RenderableInstance[] = [];
  private readonly cameraPosition = new Vector3();
  private generation = 0;
  private lastPlacementGeneration = -1;
  private lastPlacementChunkX = Number.NaN;
  private lastPlacementChunkZ = Number.NaN;

  constructor(scene: Scene, assets: KurimanjuAssetsResult, physics: KurimanjuPhysics) {
    this.physics = physics;
    this.renderer = new KurimanjuRenderer(assets);
    this.renderer.addTo(scene);
    this.reset();
  }

  reset(): void {
    this.physics.clear();
    this.physicalInstances.length = 0;
    this.proceduralInstances.length = 0;
    this.renderInstances.length = 0;
    this.generation = 0;
    this.lastPlacementGeneration = -1;
    this.spawnInitial();
  }

  applySimulation(snapshot: SimulationClockSnapshot): void {
    const targetGeneration = snapshot.generation;
    if (targetGeneration < this.generation) {
      this.reset();
    }
    while (this.generation < Math.min(targetGeneration, PHYSICAL_GENERATION_LIMIT)) {
      this.doublePhysicalPopulation(this.generation + 1);
      this.generation += 1;
    }
    this.generation = targetGeneration;
    this.lastPlacementGeneration = -1;
  }

  update(cameraPosition: Vector3): void {
    this.physics.step();
    this.cameraPosition.copy(cameraPosition);
    this.refreshProceduralInstances();
    this.renderInstances.length = 0;
    for (const instance of this.physicalInstances) {
      const translation = instance.body.body.translation();
      const rotation = instance.body.body.rotation();
      this.renderInstances.push({
        x: translation.x,
        y: Math.max(KURIMANJU_HALF_EXTENTS.y, translation.y),
        z: translation.z,
        rotationY: Math.atan2(2 * (rotation.w * rotation.y + rotation.x * rotation.z), 1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)),
        scale: 1,
        variation: (instance.seed % 997) / 997,
      });
    }
    this.renderInstances.push(...this.proceduralInstances);
    this.renderer.update(this.renderInstances, this.cameraPosition);
  }

  getStats(): KurimanjuSystemStats {
    const population = populationSnapshot(this.generation);
    const renderStats = this.renderer.getStats();
    const physicsStats = this.physics.getStats();
    return {
      ...renderStats,
      ...physicsStats,
      generation: population.generation,
      stage: population.stage,
      assetStatus: this.renderer.getAssetStatus(),
    };
  }

  get population() {
    return populationSnapshot(this.generation);
  }

  private spawnInitial(): void {
    const body = this.physics.createBody(new Vector3(0, KURIMANJU_HALF_EXTENTS.y, 0), new Vector3(0, 0, 0), new Vector3(0, 0, 0), GLOBAL_SEED);
    if (body) {
      this.physicalInstances.push({ body, seed: GLOBAL_SEED });
    }
  }

  private doublePhysicalPopulation(generation: number): void {
    const parentCount = this.physicalInstances.length;
    if (parentCount === 0) {
      return;
    }
    const childrenToCreate = Math.min(parentCount, MAX_RAPIER_BODIES - parentCount);
    for (let index = 0; index < childrenToCreate; index += 1) {
      const parent = this.physicalInstances[index % parentCount];
      const translation = parent.body.body.translation();
      const parentSeed = parent.seed;
      const random = randomFor(parentSeed, generation, index, GLOBAL_SEED);
      const angle = random.range(0, Math.PI * 2);
      const horizontalOffset = random.range(KURIMANJU_HALF_EXTENTS.x * 0.8, KURIMANJU_HALF_EXTENTS.x * 1.6);
      const position = new Vector3(
        translation.x + Math.cos(angle) * horizontalOffset,
        translation.y + random.range(KURIMANJU_HALF_EXTENTS.y * 1.5, KURIMANJU_HALF_EXTENTS.y * 2.6),
        translation.z + Math.sin(angle) * horizontalOffset,
      );
      const velocity = new Vector3(
        Math.cos(angle) * random.range(0.015, 0.055),
        random.range(0.08, 0.18),
        Math.sin(angle) * random.range(0.015, 0.055),
      );
      const angularVelocity = new Vector3(random.signed(0.8), random.signed(0.8), random.signed(0.8));
      const seed = random.next() * 0xffffffff;
      const body = this.physics.createBody(position, velocity, angularVelocity, seed);
      if (body) {
        this.physicalInstances.push({ body, seed });
      }
    }
  }

  private refreshProceduralInstances(): void {
    const chunkX = Math.floor(this.cameraPosition.x / PLACEMENT_CHUNK_SIZE);
    const chunkZ = Math.floor(this.cameraPosition.z / PLACEMENT_CHUNK_SIZE);
    if (
      chunkX === this.lastPlacementChunkX &&
      chunkZ === this.lastPlacementChunkZ &&
      this.generation === this.lastPlacementGeneration
    ) {
      return;
    }

    this.lastPlacementChunkX = chunkX;
    this.lastPlacementChunkZ = chunkZ;
    this.lastPlacementGeneration = this.generation;
    this.proceduralInstances.length = 0;
    const stage = populationSnapshot(this.generation).stage;
    if (stage === 'A') {
      return;
    }

    const target = estimatedVisibleCount(this.generation);
    const remaining = Math.max(0, target - this.physicalInstances.length);
    const clusterRadius = stage === 'B'
      ? 22 + (this.generation - 10) * 7
      : Math.min(9000, 120 + (this.generation - 22) * 36);
    const density = stage === 'B'
      ? Math.min(0.92, 0.5 + (this.generation - 10) * 0.035)
      : Math.min(0.98, 0.78 + (this.generation - 22) * 0.012);
    const searchRadius = Math.min(CHUNK_SEARCH_LIMIT, Math.ceil(clusterRadius / PLACEMENT_CHUNK_SIZE) + 2);
    const pileHeight = stage === 'C' ? Math.min(28, (this.generation - 20) * 0.75) : 0;

    for (let dz = -searchRadius; dz <= searchRadius && this.proceduralInstances.length < remaining; dz += 1) {
      for (let dx = -searchRadius; dx <= searchRadius && this.proceduralInstances.length < remaining; dx += 1) {
        const placements = generateChunkPlacement({
          chunkX: chunkX + dx,
          chunkZ: chunkZ + dz,
          generation: this.generation,
          globalSeed: GLOBAL_SEED,
          density,
          clusterRadius,
          maxInstances: remaining - this.proceduralInstances.length,
          centerX: 0,
          centerZ: 0,
        });
        for (const placement of placements) {
          const cameraDistance = Math.hypot(placement.x - this.cameraPosition.x, placement.z - this.cameraPosition.z);
          if (cameraDistance < PHYSICS_REGION_RADIUS + 2) {
            continue;
          }
          const clusterDistance = Math.hypot(placement.x, placement.z);
          const surfaceFactor = clusterRadius > 0 ? Math.max(0, 1 - clusterDistance / clusterRadius) : 0;
          this.proceduralInstances.push({
            ...placement,
            y: placement.y + Math.pow(surfaceFactor, 0.7) * pileHeight,
            scale: placement.scale * (1 + surfaceFactor * 0.04),
          });
          if (this.proceduralInstances.length >= remaining) {
            break;
          }
        }
      }
    }
  }
}
